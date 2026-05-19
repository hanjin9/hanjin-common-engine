/**
 * AI 피드백 엔진 - 핵심 모듈
 * 3단계 피드백 시스템 (즉시 → 심화 → VIP 코칭)
 * GLWA 기반 재설계 + 약점 보완
 */

import { invokeLLM } from "../../_core/llm";
import { getDb } from "../../db";
import {
  feedbackLogs,
  userFeedbackProfiles,
  conversationHistory,
  biodataRecords,
  dailyMissions,
} from "../../../drizzle/schema";
import { eq, desc, and, gte } from "drizzle-orm";

// ─── 타입 정의 ────────────────────────────────────────────────────────────────

export type FeedbackTier = 1 | 2 | 3;
export type FeedbackType =
  | "activity"
  | "daily"
  | "sleep"
  | "breathing"
  | "mission"
  | "weekly"
  | "vip_coaching";
export type Language = "ko" | "en" | "ja" | "zh" | "es";
export type EmotionType =
  | "positive"
  | "negative"
  | "tired"
  | "neutral"
  | "excited"
  | "anxious";

export interface BiodataSnapshot {
  heartRate?: number;
  breathingRate?: number;
  breathingQuality?: number; // 0-100
  sleepDuration?: number; // 분
  sleepQuality?: number; // 0-100
  stressLevel?: number; // 0-100
  steps?: number;
  energyLevel?: number; // 0-100
  mood?: number; // 1-10
  voiceStress?: number; // 0-100
}

export interface FeedbackContext {
  userId: number;
  projectId?: number;
  feedbackType: FeedbackType;
  tier: FeedbackTier;
  language: Language;
  biodata?: BiodataSnapshot;
  activityData?: {
    type: string;
    duration?: number;
    completionRate?: number;
    score?: number;
  };
  userProfile?: {
    name?: string;
    personalityType?: string;
    motivationFactors?: string[];
    strengths?: string[];
    improvements?: string[];
    totalFeedbackCount?: number;
  };
  recentHistory?: string[]; // 최근 대화 요약
}

export interface FeedbackResult {
  content: string;
  summary: string;
  pointsAwarded: number;
  emotion: EmotionType;
  nextMissionSuggestion?: string;
  ttsText?: string; // TTS용 짧은 버전
}

// ─── 언어별 시스템 프롬프트 ──────────────────────────────────────────────────

const SYSTEM_PROMPTS: Record<Language, string> = {
  ko: `당신은 따뜻하고 전문적인 건강 코치입니다. 
사용자의 건강 데이터를 분석하여 친근하고 격려적인 피드백을 제공합니다.
의료적 진단은 하지 않으며, 건강 참고용 조언만 제공합니다.
짧고 명확하게, 사람이 직접 말해주는 것처럼 자연스럽게 표현하세요.
이모지를 적절히 사용하여 친근감을 높이세요.`,

  en: `You are a warm and professional health coach.
Analyze user health data and provide friendly, encouraging feedback.
Do not make medical diagnoses - provide health reference advice only.
Be brief, clear, and natural as if speaking directly to the person.
Use emojis appropriately to create a friendly atmosphere.`,

  ja: `あなたは温かくプロフェッショナルな健康コーチです。
ユーザーの健康データを分析し、親しみやすく励ましのフィードバックを提供します。
医療診断は行わず、健康参考のアドバイスのみ提供します。
短く明確に、直接話しかけるように自然に表現してください。`,

  zh: `您是一位温暖专业的健康教练。
分析用户健康数据，提供友好鼓励的反馈。
不做医疗诊断，只提供健康参考建议。
简短清晰，像直接与人交谈一样自然表达。`,

  es: `Eres un coach de salud cálido y profesional.
Analiza los datos de salud del usuario y proporciona comentarios amigables y alentadores.
No hagas diagnósticos médicos, solo proporciona consejos de referencia de salud.
Sé breve, claro y natural como si hablaras directamente con la persona.`,
};

// ─── 피드백 프롬프트 빌더 ─────────────────────────────────────────────────────

function buildFeedbackPrompt(ctx: FeedbackContext): string {
  const parts: string[] = [];

  // 사용자 프로필
  if (ctx.userProfile?.name) {
    parts.push(`사용자 이름: ${ctx.userProfile.name}`);
  }
  if (ctx.userProfile?.personalityType) {
    parts.push(`성격 유형: ${ctx.userProfile.personalityType}`);
  }
  if (ctx.userProfile?.totalFeedbackCount) {
    parts.push(`누적 피드백 횟수: ${ctx.userProfile.totalFeedbackCount}회`);
  }

  // 생체 데이터
  if (ctx.biodata) {
    const b = ctx.biodata;
    const biodataParts: string[] = [];
    if (b.heartRate) biodataParts.push(`심박수: ${b.heartRate}bpm`);
    if (b.breathingRate) biodataParts.push(`호흡수: ${b.breathingRate}회/분`);
    if (b.breathingQuality !== undefined)
      biodataParts.push(`호흡 질: ${b.breathingQuality}/100`);
    if (b.sleepDuration)
      biodataParts.push(
        `수면 시간: ${Math.floor(b.sleepDuration / 60)}시간 ${b.sleepDuration % 60}분`
      );
    if (b.sleepQuality !== undefined)
      biodataParts.push(`수면 질: ${b.sleepQuality}/100`);
    if (b.stressLevel !== undefined)
      biodataParts.push(`스트레스: ${b.stressLevel}/100`);
    if (b.steps) biodataParts.push(`걸음수: ${b.steps.toLocaleString()}보`);
    if (b.energyLevel !== undefined)
      biodataParts.push(`에너지: ${b.energyLevel}/100`);
    if (b.mood !== undefined) biodataParts.push(`기분: ${b.mood}/10`);
    if (biodataParts.length > 0) {
      parts.push(`\n[오늘의 건강 데이터]\n${biodataParts.join(", ")}`);
    }
  }

  // 활동 데이터
  if (ctx.activityData) {
    const a = ctx.activityData;
    parts.push(`\n[활동 정보]\n유형: ${a.type}`);
    if (a.duration) parts.push(`소요 시간: ${a.duration}분`);
    if (a.completionRate !== undefined)
      parts.push(`완료율: ${a.completionRate}%`);
    if (a.score !== undefined) parts.push(`점수: ${a.score}점`);
  }

  // 최근 히스토리
  if (ctx.recentHistory && ctx.recentHistory.length > 0) {
    parts.push(
      `\n[최근 대화 맥락]\n${ctx.recentHistory.slice(-3).join("\n")}`
    );
  }

  // 피드백 유형별 지시
  const typeInstructions: Record<FeedbackType, string> = {
    activity: "방금 완료한 활동에 대한 즉각적인 칭찬과 격려 피드백을 주세요.",
    daily: "오늘 하루 건강 데이터를 종합하여 가볍고 친근한 일일 피드백을 주세요.",
    sleep: "수면 데이터를 분석하여 수면 질에 대한 가벼운 피드백을 주세요. 병원 수준의 분석이 아닌 참고용으로만 표현하세요.",
    breathing: "호흡 데이터를 분석하여 호흡 패턴에 대한 간단한 피드백을 주세요.",
    mission: "미션 완료에 대한 축하와 다음 미션 동기 부여 피드백을 주세요.",
    weekly: "이번 주 건강 데이터를 종합하여 주간 리포트 형식의 피드백을 주세요.",
    vip_coaching: "VIP 회원을 위한 심층적이고 개인화된 1:1 코칭 피드백을 주세요.",
  };

  parts.push(`\n[요청]\n${typeInstructions[ctx.feedbackType]}`);

  // 단계별 추가 지시
  if (ctx.tier === 1) {
    parts.push("2-3문장으로 짧고 임팩트 있게 작성하세요.");
  } else if (ctx.tier === 2) {
    parts.push(
      "5-7문장으로 데이터 기반 분석과 구체적인 개선 방향을 포함하세요."
    );
  } else {
    parts.push(
      "VIP 코칭 수준으로 상세하고 개인화된 피드백을 작성하세요. 구체적인 실천 방법도 포함하세요."
    );
  }

  return parts.join("\n");
}

// ─── 감정 감지 ────────────────────────────────────────────────────────────────

function detectEmotion(biodata?: BiodataSnapshot): EmotionType {
  if (!biodata) return "neutral";
  const { stressLevel, energyLevel, mood, sleepQuality } = biodata;
  const stress = stressLevel ?? 50;
  const energy = energyLevel ?? 50;
  const moodScore = mood ? mood * 10 : 50;
  const sleep = sleepQuality ?? 50;
  const avg = (stress + energy + moodScore + sleep) / 4;

  if (stress > 70) return "anxious";
  if (energy < 30 || sleep < 40) return "tired";
  if (avg > 75) return "positive";
  if (avg > 60) return "excited";
  if (avg < 35) return "negative";
  return "neutral";
}

// ─── 포인트 계산 ──────────────────────────────────────────────────────────────

function calculatePoints(
  tier: FeedbackTier,
  feedbackType: FeedbackType
): number {
  const basePoints: Record<FeedbackType, number> = {
    activity: 10,
    daily: 5,
    sleep: 8,
    breathing: 7,
    mission: 20,
    weekly: 15,
    vip_coaching: 0, // VIP는 포인트 대신 서비스 제공
  };
  const tierMultiplier = { 1: 1, 2: 1.5, 3: 2 };
  return Math.round(basePoints[feedbackType] * tierMultiplier[tier]);
}

// ─── 메인 피드백 생성 함수 ────────────────────────────────────────────────────

export async function generateFeedback(
  ctx: FeedbackContext
): Promise<FeedbackResult> {
  const systemPrompt = SYSTEM_PROMPTS[ctx.language];
  const userPrompt = buildFeedbackPrompt(ctx);

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const rawContent = response.choices?.[0]?.message?.content ?? "피드백을 생성할 수 없습니다.";
    const content = typeof rawContent === "string" ? rawContent : "피드백을 생성할 수 없습니다.";
    const summary = content.slice(0, 100) + (content.length > 100 ? "..." : "");
    const ttsText = content.slice(0, 150); // TTS용 짧은 버전
    const emotion = detectEmotion(ctx.biodata);
    const pointsAwarded = calculatePoints(ctx.tier, ctx.feedbackType);

    // 다음 미션 제안 (1단계 피드백에서만)
    let nextMissionSuggestion: string | undefined;
    if (ctx.tier === 1 && ctx.feedbackType === "activity") {
      const missionSuggestions: Record<string, string> = {
        breathing: "5분 명상 호흡",
        exercise: "10분 스트레칭",
        meditation: "감사 일기 쓰기",
        nutrition: "물 한 잔 마시기",
        sleep: "수면 준비 루틴",
        quiz: "오늘의 건강 퀴즈",
        measurement: "심박수 측정",
      };
      nextMissionSuggestion =
        missionSuggestions[ctx.activityData?.type ?? "breathing"];
    }

    return {
      content,
      summary,
      pointsAwarded,
      emotion,
      nextMissionSuggestion,
      ttsText,
    };
  } catch (error) {
    console.error("[FeedbackEngine] LLM 호출 실패:", error);
    // 폴백 피드백
    return {
      content: "오늘도 건강 관리에 힘써주셨군요! 꾸준함이 최고의 건강 비결입니다. 💪",
      summary: "오늘도 건강 관리에 힘써주셨군요!",
      pointsAwarded: calculatePoints(ctx.tier, ctx.feedbackType),
      emotion: "positive",
      ttsText: "오늘도 건강 관리에 힘써주셨군요!",
    };
  }
}

// ─── 피드백 저장 ──────────────────────────────────────────────────────────────

export async function saveFeedback(
  ctx: FeedbackContext,
  result: FeedbackResult
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("[DB] Database not available");
  const [inserted] = await db.insert(feedbackLogs).values({
    userId: ctx.userId,
    projectId: ctx.projectId,
    feedbackTier: ctx.tier,
    feedbackType: ctx.feedbackType,
    triggerType: ctx.activityData?.type ?? ctx.feedbackType,
    triggerData: ctx.biodata ? JSON.stringify(ctx.biodata) : null,
    feedbackContent: result.content,
    feedbackSummary: result.summary,
    language: ctx.language,
    pointsAwarded: result.pointsAwarded,
    ttsAudioUrl: null,
  });

  // 프로필 업데이트 (피드백 횟수 증가)
  await db
    .update(userFeedbackProfiles)
    .set({
      totalFeedbackCount: db
        .select({ count: userFeedbackProfiles.totalFeedbackCount })
        .from(userFeedbackProfiles)
        .where(eq(userFeedbackProfiles.userId, ctx.userId))
        .then((r) => (r[0]?.count ?? 0) + 1) as unknown as number,
      lastAnalyzedAt: new Date(),
    })
    .where(eq(userFeedbackProfiles.userId, ctx.userId));

  return (inserted as { insertId?: number })?.insertId ?? 0;
}

// ─── 사용자 피드백 프로필 조회/생성 ──────────────────────────────────────────

export async function getOrCreateFeedbackProfile(
  userId: number,
  projectId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("[DB] Database not available");
  const existing = await db
    .select()
    .from(userFeedbackProfiles)
    .where(eq(userFeedbackProfiles.userId, userId))
    .limit(1);

  if (existing.length > 0) return existing[0];

  await db.insert(userFeedbackProfiles).values({
    userId,
    projectId,
    personalityType: "balanced",
    preferredLanguage: "ko",
    feedbackTier: 1,
    totalFeedbackCount: 0,
  });

  const created = await db
    .select()
    .from(userFeedbackProfiles)
    .where(eq(userFeedbackProfiles.userId, userId))
    .limit(1);

  return created[0];
}

// ─── 최근 피드백 히스토리 조회 ────────────────────────────────────────────────

export async function getRecentFeedbackHistory(
  userId: number,
  limit = 5
): Promise<string[]> {
  const db = await getDb();
  if (!db) throw new Error("[DB] Database not available");
  const logs = await db
    .select({
      summary: feedbackLogs.feedbackSummary,
      type: feedbackLogs.feedbackType,
      createdAt: feedbackLogs.createdAt,
    })
    .from(feedbackLogs)
    .where(eq(feedbackLogs.userId, userId))
    .orderBy(desc(feedbackLogs.createdAt))
    .limit(limit);

  return logs.map(
    (l: any) => `[${l.type}] ${l.summary ?? ""} (${new Date(l.createdAt).toLocaleDateString()})`
  );
}

// ─── 오늘의 생체 데이터 스냅샷 조회 ─────────────────────────────────────────

export async function getTodayBiodataSnapshot(
  userId: number
): Promise<BiodataSnapshot> {
  const db = await getDb();
  if (!db) throw new Error("[DB] Database not available");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const records = await db
    .select()
    .from(biodataRecords)
    .where(
      and(
        eq(biodataRecords.userId, userId),
        gte(biodataRecords.measuredAt, today)
      )
    )
    .orderBy(desc(biodataRecords.measuredAt));

  const snapshot: BiodataSnapshot = {};

  for (const record of records) {
    const val = parseFloat(record.value);
    switch (record.dataType) {
      case "heart_rate":
        snapshot.heartRate = snapshot.heartRate ?? val;
        break;
      case "breathing_rate":
        snapshot.breathingRate = snapshot.breathingRate ?? val;
        break;
      case "breathing_quality":
        snapshot.breathingQuality = snapshot.breathingQuality ?? val;
        break;
      case "sleep_duration":
        snapshot.sleepDuration = snapshot.sleepDuration ?? val;
        break;
      case "sleep_quality":
        snapshot.sleepQuality = snapshot.sleepQuality ?? val;
        break;
      case "stress_level":
        snapshot.stressLevel = snapshot.stressLevel ?? val;
        break;
      case "steps":
        snapshot.steps = snapshot.steps ?? val;
        break;
      case "energy_level":
        snapshot.energyLevel = snapshot.energyLevel ?? val;
        break;
      case "mood":
        snapshot.mood = snapshot.mood ?? val;
        break;
      case "voice_stress":
        snapshot.voiceStress = snapshot.voiceStress ?? val;
        break;
    }
  }

  return snapshot;
}
