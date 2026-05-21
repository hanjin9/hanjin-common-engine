import { invokeLLM } from "../../_core/llm";
import { z } from "zod";

/**
 * Phase: AI 피드백 엔진 (3단계 Multi-Agent)
 * 
 * 3단계 피드백 시스템:
 * 1차: 격려 피드백 (무료, 즉시) - 긍정적이고 가벼운 톤
 * 2차: 경고/심화 피드백 (무료, 조건부) - 개선 방안 포함
 * 3차: 유료 전문 컨설팅 - 전문가 수준의 심화 분석
 */

export interface FeedbackInput {
  userId: string;
  userName?: string;
  tier?: string; // 상위10%, 상위20%, 중위, 하위20%, 하위10%
  score?: number; // 0-100
  healthData: {
    sleepHours: number;
    sleepQuality: number; // 1-10
    heartRate: number;
    bloodPressure: string; // "120/80"
    bloodSugar: number;
    activityMinutes: number;
    mealScore: number; // 1-10
    stressLevel?: number; // 1-10
    waterIntake?: number; // cups
  };
  language: string; // "ko", "en", "ja", "zh", "es"
}

export interface FeedbackResponse {
  stage: "encouragement" | "warning" | "premium";
  text: string;
  voiceUrl?: string;
  missionSuggestion?: string;
  isPremium: boolean;
  price?: number;
  tierMessage?: string; // 티어별 메시지
}

/**
 * 1차 피드백: 격려 (Encouragement)
 * 무료, 즉시 제공, 긍정적 톤
 */
export async function generateEncouragementFeedback(
  input: FeedbackInput
): Promise<FeedbackResponse> {
  const prompt = buildEncouragementPrompt(input);

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a warm and encouraging health coach. Provide positive feedback based on the user's health data. 
        Keep the message concise (1-2 sentences), uplifting, and specific to their metrics.
        Respond in ${input.language} language.
        Be supportive and motivating.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  const feedbackText = typeof content === "string" ? content : "좋은 하루를 보내셨어요! 계속 화이팅!";

  // 티어별 메시지
  const tierMessage = getTierMessage(input.tier, "encouragement", input.language);

  return {
    stage: "encouragement",
    text: feedbackText,
    voiceUrl: undefined,
    isPremium: false,
    tierMessage,
  };
}

/**
 * 2차 피드백: 경고/심화 (Warning/Deep Analysis)
 * 무료, 조건부 제공, 개선 방안 포함
 */
export async function generateWarningFeedback(
  input: FeedbackInput
): Promise<FeedbackResponse | null> {
  // 헬스 임계값 확인
  const warnings = checkHealthThresholds(input.healthData);

  if (warnings.length === 0) {
    return null; // 경고 필요 없음
  }

  const prompt = buildWarningPrompt(input, warnings);

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a professional health advisor. Provide a warning and actionable improvement suggestions.
        Be direct but supportive. Include a specific recommendation.
        Keep the message concise (2-3 sentences).
        Respond in ${input.language} language.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  const feedbackText = typeof content === "string" ? content : "건강 개선이 필요합니다. 전문가의 조언을 받으세요.";

  // 미션 제안
  const missionSuggestion = suggestMissionFromWarnings(warnings, input.language);

  // 티어별 메시지
  const tierMessage = getTierMessage(input.tier, "warning", input.language);

  return {
    stage: "warning",
    text: feedbackText,
    voiceUrl: undefined,
    missionSuggestion,
    isPremium: false,
    tierMessage,
  };
}

/**
 * 3차 피드백: 유료 전문 컨설팅 (Premium Consultation)
 * 유료 ($9.99), 심화 분석, PDF 리포트
 */
export async function generatePremiumFeedback(
  input: FeedbackInput
): Promise<FeedbackResponse> {
  const prompt = buildPremiumPrompt(input);

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a premium health consultant with expertise in personalized wellness coaching.
        Provide a comprehensive analysis including:
        1. Weekly trend analysis
        2. Personalized health coaching
        3. Expert medical advisor opinion
        4. Customized 30-day plan
        
        Format the response as a detailed report.
        Respond in ${input.language} language.
        Be professional and thorough.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  const reportText = typeof content === "string" ? content : "프리미엄 리포트 생성에 실패했습니다.";

  // 티어별 메시지
  const tierMessage = getTierMessage(input.tier, "premium", input.language);

  return {
    stage: "premium",
    text: reportText,
    voiceUrl: undefined,
    isPremium: true,
    price: 9.99,
    tierMessage,
  };
}

/**
 * 헬스 임계값 확인
 */
function checkHealthThresholds(
  healthData: FeedbackInput["healthData"]
): string[] {
  const warnings: string[] = [];

  if (healthData.sleepHours < 6) {
    warnings.push("sleep_insufficient");
  }
  if (healthData.sleepQuality < 5) {
    warnings.push("sleep_quality_poor");
  }
  if (healthData.heartRate < 60 || healthData.heartRate > 100) {
    warnings.push("heart_rate_abnormal");
  }
  if (healthData.activityMinutes < 30) {
    warnings.push("activity_insufficient");
  }
  if (healthData.mealScore < 5) {
    warnings.push("nutrition_poor");
  }
  if (healthData.bloodSugar > 125) {
    warnings.push("blood_sugar_high");
  }
  if (healthData.stressLevel && healthData.stressLevel > 7) {
    warnings.push("stress_high");
  }

  return warnings;
}

/**
 * 격려 피드백 프롬프트 생성
 */
function buildEncouragementPrompt(input: FeedbackInput): string {
  const { healthData, userName = "User", tier = "일반" } = input;

  return `
${userName}님의 오늘 건강 데이터:
- 수면: ${healthData.sleepHours}시간 (품질: ${healthData.sleepQuality}/10)
- 심박수: ${healthData.heartRate} bpm
- 혈압: ${healthData.bloodPressure}
- 혈당: ${healthData.bloodSugar} mg/dL
- 활동: ${healthData.activityMinutes}분
- 영양 점수: ${healthData.mealScore}/10
- 등급: ${tier}

긍정적이고 격려하는 피드백을 제공하세요. 좋은 지표를 강조하세요.
`;
}

/**
 * 경고 피드백 프롬프트 생성
 */
function buildWarningPrompt(
  input: FeedbackInput,
  warnings: string[]
): string {
  const { healthData, userName = "User" } = input;

  return `
${userName}님의 건강 데이터에 다음 우려사항이 있습니다: ${warnings.join(", ")}

상세 정보:
- 수면: ${healthData.sleepHours}시간 (품질: ${healthData.sleepQuality}/10)
- 심박수: ${healthData.heartRate} bpm
- 활동: ${healthData.activityMinutes}분
- 영양 점수: ${healthData.mealScore}/10

지지적이면서도 직설적인 경고와 구체적인 개선 제안을 제공하세요.
`;
}

/**
 * 프리미엄 피드백 프롬프트 생성
 */
function buildPremiumPrompt(input: FeedbackInput): string {
  const { healthData, userName = "User", score = 0 } = input;

  return `
사용자: ${userName}
점수: ${score}/100

종합 건강 분석:
- 수면: ${healthData.sleepHours}시간 (품질: ${healthData.sleepQuality}/10)
- 심박수: ${healthData.heartRate} bpm
- 혈압: ${healthData.bloodPressure}
- 혈당: ${healthData.bloodSugar} mg/dL
- 활동: ${healthData.activityMinutes}분
- 영양 점수: ${healthData.mealScore}/10

상세한 프리미엄 리포트를 생성하세요:
1. 주간 트렌드 분석
2. 개인화된 건강 코칭
3. 전문가 의견
4. 맞춤형 30일 플랜
`;
}

/**
 * 경고에 기반한 미션 제안
 */
function suggestMissionFromWarnings(warnings: string[], language: string = "ko"): string {
  const missionMap: Record<string, Record<string, string>> = {
    sleep_insufficient: {
      ko: "3분 숙면 호흡법 - 깊은 수면을 위한 명상",
      en: "3-minute sleep breathing - meditation for deep sleep",
    },
    sleep_quality_poor: {
      ko: "5분 수면 개선 요가 - 편안한 자세 교정",
      en: "5-minute sleep yoga - comfortable posture correction",
    },
    heart_rate_abnormal: {
      ko: "10분 심박 안정화 운동 - 부드러운 스트레칭",
      en: "10-minute heart rate stabilization - gentle stretching",
    },
    activity_insufficient: {
      ko: "15분 활동량 증진 - 가벼운 산책 또는 스트레칭",
      en: "15-minute activity boost - light walk or stretching",
    },
    nutrition_poor: {
      ko: "영양 개선 가이드 - 건강한 식습관 교육",
      en: "Nutrition improvement guide - healthy eating habits",
    },
    blood_sugar_high: {
      ko: "혈당 관리 호흡법 - 인슐린 민감도 개선",
      en: "Blood sugar management breathing - insulin sensitivity improvement",
    },
    stress_high: {
      ko: "스트레스 해소 명상 - 10분 마음챙김",
      en: "Stress relief meditation - 10-minute mindfulness",
    },
  };

  const firstWarning = warnings[0] || "activity_insufficient";
  return missionMap[firstWarning]?.[language] || "종합 건강 개선 미션";
}

/**
 * 티어별 메시지 생성
 */
function getTierMessage(
  tier: string | undefined,
  stage: "encouragement" | "warning" | "premium",
  language: string = "ko"
): string {
  if (!tier) return "";

  const tierMessages: Record<string, Record<string, Record<string, string>>> = {
    "상위10%": {
      encouragement: {
        ko: "🏆 축하합니다! 당신은 상위 10%의 건강 실천자입니다!",
        en: "🏆 Congratulations! You're in the top 10% of health practitioners!",
      },
      warning: {
        ko: "⚠️ 상위 10%도 개선이 필요합니다. 더 높은 목표를 향해 나아가세요!",
        en: "⚠️ Even top 10% needs improvement. Aim higher!",
      },
      premium: {
        ko: "👑 프리미엄 컨설팅: 당신의 건강을 다음 단계로 끌어올리세요.",
        en: "👑 Premium consulting: Take your health to the next level.",
      },
    },
    "상위20%": {
      encouragement: {
        ko: "⭐ 좋습니다! 당신은 상위 20%의 건강 실천자입니다!",
        en: "⭐ Great! You're in the top 20% of health practitioners!",
      },
      warning: {
        ko: "📈 상위 20%에 머물지 말고 더 나아가세요!",
        en: "📈 Don't stay in top 20%, aim higher!",
      },
      premium: {
        ko: "💎 프리미엄 컨설팅으로 상위 10%에 도달하세요.",
        en: "💎 Premium consulting to reach top 10%.",
      },
    },
    중위: {
      encouragement: {
        ko: "👍 좋은 시작입니다! 계속 노력하세요!",
        en: "👍 Good start! Keep it up!",
      },
      warning: {
        ko: "🎯 더 나은 건강을 위해 노력해야 합니다.",
        en: "🎯 You need to work harder for better health.",
      },
      premium: {
        ko: "🚀 프리미엄 컨설팅으로 상위권에 도달하세요.",
        en: "🚀 Premium consulting to reach top ranks.",
      },
    },
    "하위20%": {
      encouragement: {
        ko: "💪 작은 노력이 큰 변화를 만듭니다!",
        en: "💪 Small efforts make big changes!",
      },
      warning: {
        ko: "🆘 지금이 변화의 시작입니다. 도움을 받으세요!",
        en: "🆘 Now is the time for change. Get help!",
      },
      premium: {
        ko: "🤝 전문가의 도움이 필요합니다. 프리미엄 컨설팅을 추천합니다.",
        en: "🤝 Professional help needed. Premium consulting recommended.",
      },
    },
    "하위10%": {
      encouragement: {
        ko: "🌟 당신도 할 수 있습니다! 첫 걸음을 시작하세요!",
        en: "🌟 You can do it! Take the first step!",
      },
      warning: {
        ko: "🆘 긴급: 건강 개선이 시급합니다!",
        en: "🆘 Urgent: Health improvement needed!",
      },
      premium: {
        ko: "🎯 프리미엄 컨설팅: 전문가와 함께 건강을 되찾으세요.",
        en: "🎯 Premium consulting: Regain health with experts.",
      },
    },
  };

  return tierMessages[tier]?.[stage]?.[language] || "";
}

/**
 * 전체 피드백 플로우 (자동 3단계)
 */
export async function generateCompleteFeedback(
  input: FeedbackInput
): Promise<{
  encouragement: FeedbackResponse;
  warning: FeedbackResponse | null;
  premium: FeedbackResponse;
}> {
  const encouragement = await generateEncouragementFeedback(input);
  const warning = await generateWarningFeedback(input);
  const premium = await generatePremiumFeedback(input);

  return {
    encouragement,
    warning,
    premium,
  };
}

export type FeedbackEngine = typeof generateCompleteFeedback;
