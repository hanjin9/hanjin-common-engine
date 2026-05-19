/**
 * 모바일 생체 데이터 수집 훅
 * Web Audio API + DeviceMotion API를 사용하여 실시간 데이터 수집
 *
 * 설계 원칙:
 * - 옵트아웃(Opt-out) 방식: 기본 ON, 사용자가 원하면 끄기
 * - 배경 잡음 필터링: 호흡 주파수 대역(150-400Hz)만 추출
 * - 낮 호흡: 5분마다 30초 샘플링 (잡음 무시, 평균값 종합)
 * - 수면 감지: 밤 10시 이후 + 30분 이상 정지 → 수면 시작
 * - 의료적 표현 금지: 건강 참고용 안내만 제공
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "../lib/trpc";

// ─── 타입 ────────────────────────────────────────────────────────────────────

interface BiometricSettings {
  sleepDetectionEnabled: boolean;
  breathingSamplingEnabled: boolean;
  voiceSamplingEnabled: boolean;
  samplingIntervalMinutes: number; // 기본 5분
}

interface SleepState {
  isTracking: boolean;
  sessionId?: number;
  startTime?: Date;
  movementCount: number;
  breathingRates: number[];
  snoringEvents: number;
}

interface BreathingSample {
  rate: number;
  quality: number;
  pattern: string;
  stressIndicator: number;
  timestamp: Date;
}

interface BiometricState {
  settings: BiometricSettings;
  sleep: SleepState;
  todayBreathingSamples: BreathingSample[];
  currentBreathingRate: number | null;
  currentStressLevel: number | null;
  isCollecting: boolean;
  permissionGranted: boolean;
  error: string | null;
}

// ─── 기본 설정 ────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: BiometricSettings = {
  sleepDetectionEnabled: true,
  breathingSamplingEnabled: true,
  voiceSamplingEnabled: true,
  samplingIntervalMinutes: 5,
};

const BREATHING_FREQ_MIN = 150; // Hz
const BREATHING_FREQ_MAX = 400; // Hz
const SLEEP_MOTION_THRESHOLD = 0.05; // 가속도계 임계값
const SLEEP_START_HOUR = 22; // 밤 10시
const SLEEP_IDLE_MINUTES = 30; // 30분 정지 시 수면 시작

// ─── 메인 훅 ─────────────────────────────────────────────────────────────────

export function useBiometricCollector() {
  const [state, setState] = useState<BiometricState>({
    settings: DEFAULT_SETTINGS,
    sleep: {
      isTracking: false,
      movementCount: 0,
      breathingRates: [],
      snoringEvents: 0,
    },
    todayBreathingSamples: [],
    currentBreathingRate: null,
    currentStressLevel: null,
    isCollecting: false,
    permissionGranted: false,
    error: null,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const samplingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sleepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMotionTimeRef = useRef<number>(Date.now());
  const motionCountRef = useRef<number>(0);

  const saveBiometricMutation = trpc.ai.saveBiometricData.useMutation();
  const startSleepMutation = trpc.ai.startSleepSession.useMutation();
  const endSleepMutation = trpc.ai.endSleepSession.useMutation();

  // ─── 마이크 권한 요청 ──────────────────────────────────────────────────────

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false, // 원본 소리 필요
          noiseSuppression: false, // 잡음 직접 필터링
          autoGainControl: false,
          sampleRate: 44100,
        },
      });

      micStreamRef.current = stream;

      // Web Audio API 초기화
      audioContextRef.current = new AudioContext({ sampleRate: 44100 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      setState((prev) => ({ ...prev, permissionGranted: true, error: null }));
      return true;
    } catch (e) {
      setState((prev) => ({
        ...prev,
        permissionGranted: false,
        error: "마이크 권한이 필요합니다. 설정에서 허용해주세요.",
      }));
      return false;
    }
  }, []);

  // ─── 호흡 주파수 데이터 추출 ───────────────────────────────────────────────

  const extractBreathingFrequencies = useCallback((): number[] => {
    if (!analyserRef.current || !audioContextRef.current) return [];

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    analyserRef.current.getFloatFrequencyData(dataArray);

    const sampleRate = audioContextRef.current.sampleRate;
    const binSize = sampleRate / (analyserRef.current.fftSize);

    // 호흡 주파수 대역(150-400Hz)만 추출
    const breathingBand: number[] = [];
    for (let i = 0; i < bufferLength; i++) {
      const freq = i * binSize;
      if (freq >= BREATHING_FREQ_MIN && freq <= BREATHING_FREQ_MAX) {
        // dB → 선형 변환 (0-255 범위로 정규화)
        const linearValue = Math.pow(10, dataArray[i] / 20);
        breathingBand.push(Math.min(255, Math.max(0, linearValue * 255)));
      }
    }

    return breathingBand;
  }, []);

  // ─── 30초 호흡 샘플 수집 ──────────────────────────────────────────────────

  const collectBreathingSample = useCallback(async () => {
    if (!state.permissionGranted || !analyserRef.current) return;

    const samples: number[][] = [];
    const SAMPLE_DURATION_MS = 30000; // 30초
    const SAMPLE_INTERVAL_MS = 500; // 0.5초마다 샘플

    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        const freqData = extractBreathingFrequencies();
        if (freqData.length > 0) samples.push(freqData);
      }, SAMPLE_INTERVAL_MS);

      setTimeout(async () => {
        clearInterval(interval);

        if (samples.length === 0) {
          resolve();
          return;
        }

        // 평균 주파수 데이터 계산
        const avgFreqData = samples[0].map((_, i) =>
          samples.reduce((sum, s) => sum + (s[i] ?? 0), 0) / samples.length
        );

        // 서버로 전송하여 분석
        try {
          await saveBiometricMutation.mutateAsync({
            eventType: "breathing_sample",
            data: {
              frequencyData: avgFreqData,
              sampleDuration: 30,
            },
          });
        } catch (e) {
          console.error("[Biometric] 호흡 샘플 저장 실패:", e);
        }

        resolve();
      }, SAMPLE_DURATION_MS);
    });
  }, [state.permissionGranted, extractBreathingFrequencies, saveBiometricMutation]);

  // ─── 수면 감지 (가속도계) ──────────────────────────────────────────────────

  const startMotionDetection = useCallback(() => {
    if (!("DeviceMotionEvent" in window)) return;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      const magnitude = Math.sqrt(
        (acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2
      );

      // 중력(9.8) 제거 후 움직임 감지
      const movement = Math.abs(magnitude - 9.8);

      if (movement > SLEEP_MOTION_THRESHOLD) {
        lastMotionTimeRef.current = Date.now();
        motionCountRef.current++;
      }
    };

    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, []);

  // ─── 수면 자동 감지 루프 ──────────────────────────────────────────────────

  const startSleepDetectionLoop = useCallback(() => {
    if (sleepTimerRef.current) return;

    sleepTimerRef.current = setInterval(async () => {
      const now = new Date();
      const hour = now.getHours();
      const minutesSinceLastMotion =
        (Date.now() - lastMotionTimeRef.current) / 60000;

      // 수면 감지 조건: 밤 10시 이후 + 30분 이상 정지
      if (
        hour >= SLEEP_START_HOUR &&
        minutesSinceLastMotion >= SLEEP_IDLE_MINUTES &&
        !state.sleep.isTracking
      ) {
        // 수면 세션 시작
        try {
          const result = await startSleepMutation.mutateAsync({
            sleepStart: new Date(
              Date.now() - SLEEP_IDLE_MINUTES * 60000
            ).toISOString(),
            detectionMethod: "accelerometer",
          });

          setState((prev) => ({
            ...prev,
            sleep: {
              ...prev.sleep,
              isTracking: true,
              sessionId: result.sessionId,
              startTime: new Date(),
              movementCount: 0,
            },
          }));
        } catch (e) {
          console.error("[Biometric] 수면 세션 시작 실패:", e);
        }
      }

      // 수면 종료 감지: 아침 5-10시 사이 + 움직임 감지
      if (
        state.sleep.isTracking &&
        hour >= 5 &&
        hour <= 10 &&
        minutesSinceLastMotion < 2
      ) {
        await endCurrentSleepSession();
      }
    }, 60000); // 1분마다 체크
  }, [state.sleep.isTracking, startSleepMutation]);

  // ─── 수면 세션 종료 ────────────────────────────────────────────────────────

  const endCurrentSleepSession = useCallback(async () => {
    if (!state.sleep.isTracking || !state.sleep.sessionId) return;

    const avgBreathingRate =
      state.sleep.breathingRates.length > 0
        ? state.sleep.breathingRates.reduce((a, b) => a + b, 0) /
          state.sleep.breathingRates.length
        : undefined;

    try {
      await endSleepMutation.mutateAsync({
        sessionId: state.sleep.sessionId,
        sleepEnd: new Date().toISOString(),
        avgBreathingRate,
        snoringDetected: state.sleep.snoringEvents > 5,
        snoringMinutes: state.sleep.snoringEvents * 2,
        movementCount: state.sleep.movementCount,
      });

      setState((prev) => ({
        ...prev,
        sleep: {
          isTracking: false,
          movementCount: 0,
          breathingRates: [],
          snoringEvents: 0,
        },
      }));
    } catch (e) {
      console.error("[Biometric] 수면 세션 종료 실패:", e);
    }
  }, [state.sleep, endSleepMutation]);

  // ─── 수동 수면 모드 시작/종료 ─────────────────────────────────────────────

  const manualStartSleep = useCallback(async () => {
    try {
      const result = await startSleepMutation.mutateAsync({
        sleepStart: new Date().toISOString(),
        detectionMethod: "manual",
      });

      setState((prev) => ({
        ...prev,
        sleep: {
          ...prev.sleep,
          isTracking: true,
          sessionId: result.sessionId,
          startTime: new Date(),
        },
      }));
    } catch (e) {
      console.error("[Biometric] 수동 수면 시작 실패:", e);
    }
  }, [startSleepMutation]);

  const manualEndSleep = useCallback(async () => {
    await endCurrentSleepSession();
  }, [endCurrentSleepSession]);

  // ─── 설정 업데이트 ────────────────────────────────────────────────────────

  const updateSettings = useCallback(
    (newSettings: Partial<BiometricSettings>) => {
      setState((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...newSettings },
      }));

      // 로컬 스토리지에 저장
      const updated = { ...state.settings, ...newSettings };
      localStorage.setItem("biometric_settings", JSON.stringify(updated));
    },
    [state.settings]
  );

  // ─── 초기화 ───────────────────────────────────────────────────────────────

  useEffect(() => {
    // 로컬 스토리지에서 설정 복원
    const saved = localStorage.getItem("biometric_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState((prev) => ({
          ...prev,
          settings: { ...DEFAULT_SETTINGS, ...parsed },
        }));
      } catch {}
    }

    // 가속도계 감지 시작
    const cleanup = startMotionDetection();

    return () => {
      cleanup?.();
      if (samplingTimerRef.current) clearInterval(samplingTimerRef.current);
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // ─── 수면 감지 루프 시작 ──────────────────────────────────────────────────

  useEffect(() => {
    if (state.settings.sleepDetectionEnabled) {
      startSleepDetectionLoop();
    }
    return () => {
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current);
        sleepTimerRef.current = null;
      }
    };
  }, [state.settings.sleepDetectionEnabled]);

  // ─── 호흡 샘플링 루프 시작 ────────────────────────────────────────────────

  useEffect(() => {
    if (state.settings.breathingSamplingEnabled && state.permissionGranted) {
      const intervalMs = state.settings.samplingIntervalMinutes * 60 * 1000;
      samplingTimerRef.current = setInterval(() => {
        collectBreathingSample();
      }, intervalMs);
    }
    return () => {
      if (samplingTimerRef.current) {
        clearInterval(samplingTimerRef.current);
        samplingTimerRef.current = null;
      }
    };
  }, [
    state.settings.breathingSamplingEnabled,
    state.settings.samplingIntervalMinutes,
    state.permissionGranted,
  ]);

  return {
    state,
    requestPermissions,
    collectBreathingSample,
    manualStartSleep,
    manualEndSleep,
    updateSettings,
  };
}
