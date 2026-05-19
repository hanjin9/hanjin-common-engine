/**
 * 생체 데이터 수집 서버 모듈
 * 클라이언트에서 수집된 데이터를 받아 DB에 저장하고 분석
 * - 수면 세션 관리 (옵트아웃 방식 - 기본 ON)
 * - 호흡 데이터 처리
 * - 목소리 컨디션 분석
 * - 헬스 플랫폼 연동 설정
 */

import { getDb } from "../../db";
import {
  biodataRecords,
  sleepSessions,
  healthPlatformConnections,
  userFeedbackProfiles,
} from "../../../drizzle/schema";
import { eq, and, desc, gte, isNull } from "drizzle-orm";

// ─── 타입 정의 ────────────────────────────────────────────────────────────────

export interface RawBiodataInput {
  userId: number;
  projectId?: number;
  dataType:
    | "heart_rate"
    | "breathing_rate"
    | "breathing_quality"
    | "sleep_duration"
    | "sleep_quality"
    | "sleep_start"
    | "sleep_end"
    | "snoring_detected"
    | "steps"
    | "voice_energy"
    | "voice_stress"
    | "stress_level"
    | "body_temperature"
    | "weight"
    | "mood"
    | "energy_level";
  value: number;
  unit?: string;
  accuracy?: number; // 0-100, 기본 70
  dataSource?: "self" | "google_fit" | "apple_health" | "samsung_health" | "manual";
  measuredAt?: Date;
  durationSeconds?: number;
  rawData?: string; // JSON 원본 데이터
}

export interface SleepSessionInput {
  userId: number;
  projectId?: number;
  sleepStart: Date;
  sleepEnd?: Date;
  detectionMethod?: "accelerometer" | "microphone" | "both" | "manual";
  movementCount?: number;
  avgBreathingRate?: number;
  breathingRegularity?: number; // 0-100
  snoringDetected?: boolean;
  snoringMinutes?: number;
  sleepStages?: {
    awake: number;
    light: number;
    deep: number;
    rem: number;
  };
}

export interface BreathingAnalysisResult {
  breathingRate: number; // 회/분
  breathingQuality: number; // 0-100
  regularity: number; // 0-100
  pattern: "normal" | "shallow" | "deep" | "irregular" | "hyperventilation";
  stressIndicator: number; // 0-100
  recommendation: string;
}

export interface VoiceAnalysisResult {
  energyLevel: number; // 0-100
  stressLevel: number; // 0-100
  fatigueLevel: number; // 0-100
  emotionTone: "positive" | "neutral" | "negative" | "tired" | "anxious";
  confidence: number; // 분석 신뢰도 0-100
}

// ─── 호흡 데이터 분석 ────────────────────────────────────────────────────────

/**
 * 클라이언트에서 수집된 오디오 주파수 데이터를 분석하여 호흡 패턴 추출
 * Web Audio API의 AnalyserNode 데이터를 받아 처리
 */
export function analyzeBreathingData(
  frequencyData: number[], // 150-400Hz 대역 주파수 데이터
  sampleDurationSeconds: number
): BreathingAnalysisResult {
  if (!frequencyData || frequencyData.length === 0) {
    return {
      breathingRate: 16,
      breathingQuality: 70,
      regularity: 70,
      pattern: "normal",
      stressIndicator: 30,
      recommendation: "호흡 데이터를 수집 중입니다.",
    };
  }

  // 피크 감지 (들숨/날숨 사이클 계산)
  const threshold = Math.max(...frequencyData) * 0.4;
  let peakCount = 0;
  let inPeak = false;
  const peakIntervals: number[] = [];
  let lastPeakIndex = 0;

  for (let i = 0; i < frequencyData.length; i++) {
    if (frequencyData[i] > threshold && !inPeak) {
      inPeak = true;
      if (lastPeakIndex > 0) {
        peakIntervals.push(i - lastPeakIndex);
      }
      lastPeakIndex = i;
      peakCount++;
    } else if (frequencyData[i] <= threshold) {
      inPeak = false;
    }
  }

  // 호흡수 계산 (분당)
  const breathingRate = Math.round(
    (peakCount / sampleDurationSeconds) * 60
  );
  const normalizedRate = Math.max(8, Math.min(30, breathingRate));

  // 규칙성 계산 (인터벌 편차)
  let regularity = 70;
  if (peakIntervals.length > 2) {
    const avgInterval =
      peakIntervals.reduce((a, b) => a + b, 0) / peakIntervals.length;
    const variance =
      peakIntervals.reduce((sum, v) => sum + Math.pow(v - avgInterval, 2), 0) /
      peakIntervals.length;
    const stdDev = Math.sqrt(variance);
    regularity = Math.max(0, Math.min(100, 100 - (stdDev / avgInterval) * 100));
  }

  // 패턴 분류
  let pattern: BreathingAnalysisResult["pattern"] = "normal";
  if (normalizedRate < 10) pattern = "deep";
  else if (normalizedRate > 20) pattern = "hyperventilation";
  else if (regularity < 50) pattern = "irregular";
  else if (normalizedRate < 14) pattern = "deep";
  else if (normalizedRate > 18) pattern = "shallow";

  // 호흡 질 점수 (12-18회/분이 정상)
  const rateScore =
    normalizedRate >= 12 && normalizedRate <= 18
      ? 100
      : Math.max(0, 100 - Math.abs(normalizedRate - 15) * 10);
  const breathingQuality = Math.round((rateScore * 0.6 + regularity * 0.4));

  // 스트레스 지표 (빠르고 불규칙한 호흡 = 높은 스트레스)
  const stressIndicator = Math.round(
    Math.min(100, (normalizedRate > 18 ? (normalizedRate - 18) * 10 : 0) +
      (100 - regularity) * 0.5)
  );

  // 추천 메시지
  const recommendations: Record<string, string> = {
    normal: "호흡이 안정적입니다. 잘 하고 계세요! 😊",
    shallow: "호흡이 약간 얕습니다. 잠깐 깊게 숨을 쉬어보세요.",
    deep: "호흡이 깊고 안정적입니다. 훌륭해요! 🌿",
    irregular: "호흡이 약간 불규칙합니다. 잠시 쉬어가세요.",
    hyperventilation: "호흡이 빠릅니다. 천천히 깊게 숨을 쉬어보세요.",
  };

  return {
    breathingRate: normalizedRate,
    breathingQuality,
    regularity: Math.round(regularity),
    pattern,
    stressIndicator,
    recommendation: recommendations[pattern],
  };
}

// ─── 목소리 컨디션 분석 ──────────────────────────────────────────────────────

/**
 * 목소리 에너지 및 스트레스 분석
 * 배경 잡음 필터링 후 목소리 특성 추출
 */
export function analyzeVoiceCondition(
  amplitudeData: number[], // 볼륨 진폭 데이터
  frequencySpectrum: number[] // 주파수 스펙트럼
): VoiceAnalysisResult {
  if (!amplitudeData || amplitudeData.length === 0) {
    return {
      energyLevel: 50,
      stressLevel: 30,
      fatigueLevel: 30,
      emotionTone: "neutral",
      confidence: 20,
    };
  }

  // 평균 에너지 레벨
  const avgAmplitude =
    amplitudeData.reduce((a, b) => a + b, 0) / amplitudeData.length;
  const maxAmplitude = Math.max(...amplitudeData);
  const energyLevel = Math.min(100, Math.round((avgAmplitude / 128) * 100));

  // 고주파 성분 비율 (스트레스 = 고주파 증가)
  const highFreqComponents = frequencySpectrum.filter((_, i) =>
    i > frequencySpectrum.length * 0.6
  );
  const highFreqRatio =
    highFreqComponents.reduce((a, b) => a + b, 0) /
    (frequencySpectrum.reduce((a, b) => a + b, 0) || 1);
  const stressLevel = Math.min(100, Math.round(highFreqRatio * 200));

  // 피로도 (낮은 에너지 + 불규칙한 패턴)
  const amplitudeVariance =
    amplitudeData.reduce(
      (sum, v) => sum + Math.pow(v - avgAmplitude, 2),
      0
    ) / amplitudeData.length;
  const fatigueLevel = Math.min(
    100,
    Math.round(
      (100 - energyLevel) * 0.6 + Math.sqrt(amplitudeVariance) * 0.4
    )
  );

  // 감정 톤 분류
  let emotionTone: VoiceAnalysisResult["emotionTone"] = "neutral";
  if (fatigueLevel > 65) emotionTone = "tired";
  else if (stressLevel > 65) emotionTone = "anxious";
  else if (energyLevel > 70 && stressLevel < 40) emotionTone = "positive";
  else if (energyLevel < 30) emotionTone = "negative";

  // 신뢰도 (데이터 양에 따라)
  const confidence = Math.min(90, Math.round(amplitudeData.length / 10));

  return {
    energyLevel,
    stressLevel,
    fatigueLevel,
    emotionTone,
    confidence,
  };
}

// ─── 수면 질 점수 계산 ────────────────────────────────────────────────────────

export function calculateSleepQuality(session: {
  totalMinutes?: number;
  breathingRegularity?: number;
  snoringDetected?: boolean;
  snoringMinutes?: number;
  movementCount?: number;
  sleepStages?: { awake: number; light: number; deep: number; rem: number };
}): number {
  let score = 100;

  // 수면 시간 (7-9시간 최적)
  if (session.totalMinutes) {
    const hours = session.totalMinutes / 60;
    if (hours < 5) score -= 30;
    else if (hours < 6) score -= 15;
    else if (hours < 7) score -= 5;
    else if (hours > 10) score -= 10;
  }

  // 호흡 규칙성
  if (session.breathingRegularity !== undefined) {
    score -= Math.round((100 - session.breathingRegularity) * 0.2);
  }

  // 코골이
  if (session.snoringDetected) {
    score -= 10;
    if (session.snoringMinutes && session.snoringMinutes > 30) score -= 10;
  }

  // 움직임 (너무 많으면 수면 질 저하)
  if (session.movementCount && session.movementCount > 20) {
    score -= Math.min(20, Math.round((session.movementCount - 20) * 0.5));
  }

  // 수면 단계 (깊은 수면 비율)
  if (session.sleepStages) {
    const total =
      session.sleepStages.awake +
      session.sleepStages.light +
      session.sleepStages.deep +
      session.sleepStages.rem;
    if (total > 0) {
      const deepRatio = session.sleepStages.deep / total;
      const remRatio = session.sleepStages.rem / total;
      if (deepRatio < 0.1) score -= 15;
      if (remRatio < 0.15) score -= 10;
    }
  }

  return Math.max(0, Math.min(100, score));
}

// ─── DB 저장 함수들 ───────────────────────────────────────────────────────────

export async function saveBiodataRecord(input: RawBiodataInput): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("[DB] Database not available");
  await db.insert(biodataRecords).values({
    userId: input.userId,
    projectId: input.projectId,
    dataSource: input.dataSource ?? "self",
    dataType: input.dataType,
    value: String(input.value),
    unit: input.unit,
    accuracy: input.accuracy ?? 70,
    measuredAt: input.measuredAt ?? new Date(),
    durationSeconds: input.durationSeconds,
    rawData: input.rawData,
  });
}

export async function saveBiodataBatch(
  records: RawBiodataInput[]
): Promise<void> {
  if (records.length === 0) return;
  const db = await getDb();
  if (!db) throw new Error("[DB] Database not available");
  await db.insert(biodataRecords).values(
    records.map((input) => ({
      userId: input.userId,
      projectId: input.projectId,
      dataSource: input.dataSource ?? "self",
      dataType: input.dataType,
      value: String(input.value),
      unit: input.unit,
      accuracy: input.accuracy ?? 70,
      measuredAt: input.measuredAt ?? new Date(),
      durationSeconds: input.durationSeconds,
      rawData: input.rawData,
    }))
  );
}

export async function startSleepSession(
  input: SleepSessionInput
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("[DB] Database not available");
  const [result] = await db.insert(sleepSessions).values({
    userId: input.userId,
    projectId: input.projectId,
    sleepStart: input.sleepStart,
    detectionMethod: input.detectionMethod ?? "both",
    movementCount: input.movementCount ?? 0,
  });
  return (result as { insertId?: number })?.insertId ?? 0;
}

export async function endSleepSession(
  sessionId: number,
  input: Partial<SleepSessionInput> & { sleepEnd: Date }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("[DB] Database not available");

  // 세션 조회
  const sessions = await db
    .select()
    .from(sleepSessions)
    .where(eq(sleepSessions.id, sessionId))
    .limit(1);

  if (sessions.length === 0) return;
  const session = sessions[0];

  const totalMinutes = Math.round(
    (input.sleepEnd.getTime() - session.sleepStart.getTime()) / 60000
  );

  const qualityScore = calculateSleepQuality({
    totalMinutes,
    breathingRegularity: input.breathingRegularity,
    snoringDetected: input.snoringDetected,
    snoringMinutes: input.snoringMinutes,
    movementCount: input.movementCount ?? session.movementCount ?? 0,
  });

  await db
    .update(sleepSessions)
    .set({
      sleepEnd: input.sleepEnd,
      totalMinutes,
      qualityScore,
      avgBreathingRate: input.avgBreathingRate
        ? String(input.avgBreathingRate)
        : null,
      breathingRegularity: input.breathingRegularity,
      snoringDetected: input.snoringDetected ?? false,
      snoringMinutes: input.snoringMinutes ?? 0,
      movementCount: input.movementCount ?? session.movementCount ?? 0,
      sleepStages: input.sleepStages
        ? JSON.stringify(input.sleepStages)
        : null,
    })
    .where(eq(sleepSessions.id, sessionId));

  // 수면 데이터를 biodata_records에도 저장
  await saveBiodataBatch([
    {
      userId: session.userId,
      projectId: session.projectId ?? undefined,
      dataType: "sleep_duration",
      value: totalMinutes,
      unit: "minutes",
      accuracy: 85,
      measuredAt: input.sleepEnd,
    },
    {
      userId: session.userId,
      projectId: session.projectId ?? undefined,
      dataType: "sleep_quality",
      value: qualityScore,
      unit: "score",
      accuracy: 75,
      measuredAt: input.sleepEnd,
    },
  ]);
}

// ─── 헬스 플랫폼 연동 설정 ───────────────────────────────────────────────────

export async function getHealthPlatformConnections(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("[DB] Database not available");
  return db
    .select()
    .from(healthPlatformConnections)
    .where(eq(healthPlatformConnections.userId, userId));
}

export async function updateHealthPlatformConnection(
  userId: number,
  platform: "google_fit" | "apple_health" | "samsung_health" | "garmin" | "fitbit",
  status: "connected" | "disconnected" | "pending",
  syncDataTypes?: string[]
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("[DB] Database not available");

  const existing = await db
    .select()
    .from(healthPlatformConnections)
    .where(
      and(
        eq(healthPlatformConnections.userId, userId),
        eq(healthPlatformConnections.platform, platform)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(healthPlatformConnections)
      .set({
        status: status as "connected" | "disconnected" | "pending",
        syncDataTypes: syncDataTypes ? JSON.stringify(syncDataTypes) : null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(healthPlatformConnections.userId, userId),
          eq(healthPlatformConnections.platform, platform)
        )
      );
  } else {
    await db.insert(healthPlatformConnections).values({
      userId,
      platform,
      status: status as "connected" | "disconnected" | "pending",
      syncEnabled: true,
      syncDataTypes: syncDataTypes ? JSON.stringify(syncDataTypes) : null,
    });
  }
}

// ─── 오늘의 활성 수면 세션 조회 ──────────────────────────────────────────────

export async function getActiveSleepSession(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("[DB] Database not available");
  const sessions = await db
    .select()
    .from(sleepSessions)
    .where(
      and(eq(sleepSessions.userId, userId), isNull(sleepSessions.sleepEnd))
    )
    .orderBy(desc(sleepSessions.sleepStart))
    .limit(1);

  return sessions[0] ?? null;
}
