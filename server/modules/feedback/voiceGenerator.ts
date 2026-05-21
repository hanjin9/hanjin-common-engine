/**
 * 음성 생성 모듈 (TTS - Text to Speech)
 * 
 * 피드백을 음성으로 변환하여 사용자에게 제공
 * - 1차: 격려 (밝고 긍정적인 톤)
 * - 2차: 경고 (진지하고 전문적인 톤)
 * - 3차: 프리미엄 (따뜻하고 전문가적인 톤)
 */

export interface VoiceGenerationInput {
  text: string;
  stage: "encouragement" | "warning" | "premium";
  language: "ko" | "en" | "ja" | "zh" | "es";
  voiceType?: "male" | "female" | "neutral";
  speed?: number; // 0.5-2.0
  pitch?: number; // 0.5-2.0
}

export interface VoiceGenerationOutput {
  audioUrl: string;
  duration: number; // 초 단위
  format: "mp3" | "wav" | "ogg";
  voiceType: string;
}

/**
 * 음성 생성 (TTS)
 * Manus 내장 음성 생성 API 사용
 */
export async function generateVoiceFeedback(
  input: VoiceGenerationInput
): Promise<VoiceGenerationOutput | null> {
  try {
    // Manus 내장 음성 생성 API 호출
    // server/_core/voiceGeneration.ts 또는 유사 모듈 사용
    
    // 임시 구현: 실제로는 Manus API를 호출해야 함
    console.log(
      `[음성 생성] ${input.stage} 피드백 음성 생성 중...`,
      input.language
    );

    // 음성 톤 선택
    const voiceSettings = getVoiceSettings(input.stage, input.language);

    // 음성 생성 (실제 구현)
    const audioUrl = await callVoiceGenerationAPI(
      input.text,
      voiceSettings,
      input.speed || 1.0,
      input.pitch || 1.0
    );

    if (!audioUrl) {
      console.warn("[음성 생성] 음성 생성 실패");
      return null;
    }

    // 음성 길이 추정 (단어 수 기반)
    const estimatedDuration = estimateAudioDuration(input.text);

    return {
      audioUrl,
      duration: estimatedDuration,
      format: "mp3",
      voiceType: voiceSettings.voiceType,
    };
  } catch (error) {
    console.error("[음성 생성] 오류:", error);
    return null;
  }
}

/**
 * 피드백 단계별 음성 설정
 */
function getVoiceSettings(
  stage: "encouragement" | "warning" | "premium",
  language: string
): {
  voiceType: string;
  tone: string;
  speed: number;
  pitch: number;
} {
  const settings: Record<
    string,
    {
      voiceType: string;
      tone: string;
      speed: number;
      pitch: number;
    }
  > = {
    encouragement: {
      voiceType: "female", // 밝고 친근한 여성 음성
      tone: "positive",
      speed: 0.95, // 약간 느린 속도로 친근감 표현
      pitch: 1.1, // 약간 높은 음역대
    },
    warning: {
      voiceType: "male", // 진지하고 신뢰감 있는 남성 음성
      tone: "neutral",
      speed: 1.0,
      pitch: 0.9, // 약간 낮은 음역대
    },
    premium: {
      voiceType: "female", // 따뜻하고 전문적인 여성 음성
      tone: "professional",
      speed: 0.9, // 천천히 명확하게
      pitch: 1.0,
    },
  };

  return settings[stage] || settings.encouragement;
}

/**
 * 음성 생성 API 호출 (Manus 내장 API)
 */
async function callVoiceGenerationAPI(
  text: string,
  voiceSettings: {
    voiceType: string;
    tone: string;
    speed: number;
    pitch: number;
  },
  speed: number,
  pitch: number
): Promise<string | null> {
  try {
    // Manus 내장 음성 생성 API 호출
    // 실제 구현에서는 server/_core/voiceGeneration.ts 또는 유사 모듈 사용
    
    // 예: invokeLLM의 음성 생성 버전
    // const response = await invokeVoiceGeneration({ ... });

    // 임시: 로컬 테스트용 URL 반환
    const mockUrl = `/manus-storage/feedback-voice-${Date.now()}.mp3`;
    console.log(`[음성 생성] 생성된 음성 URL: ${mockUrl}`);

    return mockUrl;
  } catch (error) {
    console.error("[음성 생성 API] 오류:", error);
    return null;
  }
}

/**
 * 음성 길이 추정 (텍스트 기반)
 * 평균 음성 속도: 초당 약 3-4 단어
 */
function estimateAudioDuration(text: string): number {
  const wordCount = text.split(/\s+/).length;
  const wordsPerSecond = 3.5; // 평균 음성 속도
  const duration = Math.ceil(wordCount / wordsPerSecond);
  return Math.max(duration, 5); // 최소 5초
}

/**
 * 음성 피드백 캐시 (중복 생성 방지)
 */
class VoiceFeedbackCache {
  private cache: Map<string, VoiceGenerationOutput> = new Map();
  private maxCacheSize = 100;

  /**
   * 캐시 키 생성
   */
  private generateKey(input: VoiceGenerationInput): string {
    return `${input.stage}_${input.language}_${input.text.substring(0, 50)}`;
  }

  /**
   * 캐시에서 조회
   */
  get(input: VoiceGenerationInput): VoiceGenerationOutput | undefined {
    return this.cache.get(this.generateKey(input));
  }

  /**
   * 캐시에 저장
   */
  set(input: VoiceGenerationInput, output: VoiceGenerationOutput): void {
    const key = this.generateKey(input);

    // 캐시 크기 제한
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, output);
  }

  /**
   * 캐시 초기화
   */
  clear(): void {
    this.cache.clear();
  }
}

// 싱글톤 캐시 인스턴스
export const voiceFeedbackCache = new VoiceFeedbackCache();

/**
 * 캐시를 포함한 음성 생성 (권장)
 */
export async function generateVoiceFeedbackWithCache(
  input: VoiceGenerationInput
): Promise<VoiceGenerationOutput | null> {
  // 캐시 확인
  const cached = voiceFeedbackCache.get(input);
  if (cached) {
    console.log("[음성 생성] 캐시에서 음성 반환");
    return cached;
  }

  // 새로운 음성 생성
  const output = await generateVoiceFeedback(input);

  if (output) {
    voiceFeedbackCache.set(input, output);
  }

  return output;
}

/**
 * 배치 음성 생성 (여러 피드백 한번에)
 */
export async function generateVoiceFeedbackBatch(
  inputs: VoiceGenerationInput[]
): Promise<(VoiceGenerationOutput | null)[]> {
  try {
    const results = await Promise.all(
      inputs.map((input) => generateVoiceFeedbackWithCache(input))
    );
    return results;
  } catch (error) {
    console.error("[음성 생성 배치] 오류:", error);
    return inputs.map(() => null);
  }
}

/**
 * 음성 피드백 통계
 */
export function getVoiceGenerationStats(): {
  cacheSize: number;
  maxCacheSize: number;
  hitRate: number;
} {
  return {
    cacheSize: voiceFeedbackCache["cache"].size,
    maxCacheSize: 100,
    hitRate: 0, // 실제 구현에서는 히트율 추적
  };
}
