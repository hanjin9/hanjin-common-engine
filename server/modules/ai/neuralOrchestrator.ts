/**
 * 신경망 연결 레이어 (Neural Orchestrator)
 * 모든 AI 모듈을 완전 통합하여 하나의 지능형 시스템으로 연결
 *
 * 연결 구조:
 * BiometricCollector → FeedbackEngine → DailyMissionEngine → NotificationEngine
 *       ↑                    ↓                  ↓                    ↓
 *  UserProfile ←──── PersonalMemory ←──── ConversationAI ←──── TTS Engine
 */

import {
  generateFeedback,
  saveFeedback,
  getOrCreateFeedbackProfile,
  getRecentFeedbackHistory,
  getTodayBiodataSnapshot,
  type FeedbackContext,
  type FeedbackTier,
  type Language,
} from "./feedbackEngine";
import {
  analyzeBreathingData,
  analyzeVoiceCondition,
  saveBiodataRecord,
  saveBiodataBatch,
  getActiveSleepSession,
  type RawBiodataInput,
  type BreathingAnalysisResult,
} from "./biometricCollector";
import { getDb } from "../../db";
import {
  dailyMissions,
  conversationHistory,
  userFeedbackProfiles,
} from "../../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { invokeLLM } from "../../_core/llm";
import { notifyOwner } from "../../_core/notification";

// ─── 타입 정의 ────────────────────────────────────────────────────────────────

export interface OrchestratorInput {
  userId: number;
  projectId?: number;
  eventType:
    | "activity_complete"
    | "breathing_sample"
    | "voice_sample"
    | "sleep_start"
    | "sleep_end"
    | "daily_checkin"
    | "mission_complete"
    | "chat_message";
  data?: {
    // 활동 완료
    activityType?: string;
    duration?: number;
    completionRate?: number;
    score?: number;
    // 호흡 샘플
    frequencyData?: number[];
    sampleDuration?: number;
    // 목소리 샘플
    amplitudeData?: number[];
    frequencySpectrum?: number[];
    // 채팅 메시지
    message?: string;
    // 수면
    movementCount?: number;
  };
  language?: Language;
}

export interface OrchestratorResult {
  success: boolean;
  feedbackContent?: string;
  feedbackSummary?: string;
  ttsText?: string;
  pointsAwarded?: number;
  nextMission?: {
    type: string;
    title: string;
    description: string;
    estimatedMinutes: number;
  };
  biometricAnalysis?: {
    breathing?: BreathingAnalysisResult;
    voiceCondition?: ReturnType<typeof analyzeVoiceCondition>;
  };
  conversationReply?: string;
  error?: string;
}

// ─── 일일 미션 생성 ───────────────────────────────────────────────────────────

async function generateDailyMission(
  userId: number,
  projectId: number | undefined,
  biodata: Awaited<ReturnType<typeof getTodayBiodataSnapshot>>,
  language: Language
): Promise<{
  type: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  rewardPoints: number;
}> {
  // 생체 데이터 기반 미션 유형 결정
  let missionType = "breathing";
  let priority = "normal";

  if (biodata.stressLevel && biodata.stressLevel > 65) {
    missionType = "meditation";
    priority = "high";
  } else if (biodata.sleepQuality && biodata.sleepQuality < 50) {
    missionType = "sleep";
    priority = "high";
  } else if (biodata.steps && biodata.steps < 3000) {
    missionType = "exercise";
    priority = "medium";
  } else if (biodata.breathingQuality && biodata.breathingQuality < 60) {
    missionType = "breathing";
    priority = "medium";
  }

  const missionPrompts: Record<string, string> = {
    ko: `사용자의 건강 상태에 맞는 ${missionType} 미션을 하나 생성해주세요.
건강 데이터: ${JSON.stringify(biodata)}
미션은 5-15분 내에 완료할 수 있어야 하며, 구체적이고 실천 가능해야 합니다.
JSON 형식으로 응답: {"title": "미션 제목", "description": "상세 설명", "instructions": "단계별 방법", "estimatedMinutes": 10, "rewardPoints": 15}`,
    en: `Generate a ${missionType} mission suitable for the user's health status.
Health data: ${JSON.stringify(biodata)}
The mission should be completable in 5-15 minutes and be specific and actionable.
Respond in JSON: {"title": "Mission Title", "description": "Details", "instructions": "Step-by-step", "estimatedMinutes": 10, "rewardPoints": 15}`,
  };

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "당신은 건강 미션 설계 전문가입니다. 항상 JSON 형식으로만 응답하세요.",
        },
        {
          role: "user",
          content: missionPrompts[language] ?? missionPrompts["ko"],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "mission",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              instructions: { type: "string" },
              estimatedMinutes: { type: "integer" },
              rewardPoints: { type: "integer" },
            },
            required: [
              "title",
              "description",
              "instructions",
              "estimatedMinutes",
              "rewardPoints",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response.choices?.[0]?.message?.content;
    const content = typeof rawContent === "string" ? rawContent : null;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        type: missionType,
        title: parsed.title,
        description: parsed.description,
        estimatedMinutes: parsed.estimatedMinutes,
        rewardPoints: parsed.rewardPoints,
      };
    }
  } catch (e) {
    console.error("[Orchestrator] 미션 생성 실패:", e);
  }

  // 폴백 미션
  const fallbackMissions: Record<string, { title: string; description: string }> = {
    breathing: {
      title: "4-7-8 호흡법 5분",
      description: "4초 들숨, 7초 정지, 8초 날숨으로 스트레스를 해소하세요.",
    },
    meditation: {
      title: "마음 챙김 명상 10분",
      description: "조용한 곳에서 눈을 감고 호흡에 집중하세요.",
    },
    exercise: {
      title: "가벼운 스트레칭 10분",
      description: "목, 어깨, 허리 스트레칭으로 몸을 풀어주세요.",
    },
    sleep: {
      title: "수면 준비 루틴",
      description: "취침 1시간 전 화면을 끄고 가벼운 독서나 명상을 하세요.",
    },
    nutrition: {
      title: "물 2잔 마시기",
      description: "지금 바로 물 한 잔, 30분 후 또 한 잔을 마시세요.",
    },
  };

  const fallback = fallbackMissions[missionType] ?? fallbackMissions["breathing"];
  return {
    type: missionType,
    title: fallback.title,
    description: fallback.description,
    estimatedMinutes: 10,
    rewardPoints: 15,
  };
}

// ─── 대화 AI 응답 생성 ────────────────────────────────────────────────────────

async function generateConversationReply(
  userId: number,
  message: string,
  language: Language,
  biodata: Awaited<ReturnType<typeof getTodayBiodataSnapshot>>,
  recentHistory: string[]
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("[DB] Database not available");

  // 최근 대화 히스토리 조회 (최근 10개)
  const history = await db
    .select()
    .from(conversationHistory)
    .where(eq(conversationHistory.userId, userId))
    .orderBy(desc(conversationHistory.createdAt))
    .limit(10);

  const messages: { role: "system" | "user" | "assistant"; content: string }[] =
    [
      {
        role: "system",
        content: `당신은 따뜻하고 친근한 개인 건강 코치입니다.
사용자의 오늘 건강 데이터: ${JSON.stringify(biodata)}
최근 피드백 요약: ${recentHistory.join(", ")}
의료적 진단은 하지 않으며, 건강 참고용 조언만 제공합니다.
짧고 자연스럽게 대화하세요. 이모지를 적절히 사용하세요.`,
      },
    ];

  // 대화 히스토리 추가 (역순으로 정렬)
  history.reverse().forEach((h: any) => {
    messages.push({
      role: h.role as "user" | "assistant",
      content: typeof h.content === "string" ? h.content : "",
    });
  });

  messages.push({ role: "user", content: message });

  try {
    const response = await invokeLLM({ messages });
    const rawReply = response.choices?.[0]?.message?.content ?? "죄송해요, 잠시 후 다시 시도해주세요.";
    const reply = typeof rawReply === "string" ? rawReply : "죄송해요, 잠시 후 다시 시도해주세요.";

    // 대화 히스토리 저장
    const sessionId = `session_${userId}_${Date.now()}`;
    await db.insert(conversationHistory).values([
      {
        userId,
        role: "user",
        content: message,
        sessionId,
        language,
      },
      {
        userId,
        role: "assistant",
        content: reply,
        sessionId,
        language,
      },
    ]);

    const replyStr = typeof reply === "string" ? reply : "죄송해요, 잠시 후 다시 시도해주세요.";
    return replyStr;
  } catch (e) {
    console.error("[Orchestrator] 대화 AI 실패:", e);
    return "지금은 응답이 어렵습니다. 잠시 후 다시 시도해주세요. 😊";
  }
}

// ─── 메인 오케스트레이터 ──────────────────────────────────────────────────────

export async function orchestrate(
  input: OrchestratorInput
): Promise<OrchestratorResult> {
  const { userId, projectId, eventType, data, language = "ko" } = input;

  try {
    // 1. 사용자 프로필 조회
    const profile = await getOrCreateFeedbackProfile(userId, projectId);
    const tier = (profile?.feedbackTier ?? 1) as FeedbackTier;

    // 2. 오늘의 생체 데이터 스냅샷
    const biodata = await getTodayBiodataSnapshot(userId);

    // 3. 최근 피드백 히스토리
    const recentHistory = await getRecentFeedbackHistory(userId, 3);

    // 4. 이벤트 유형별 처리
    switch (eventType) {
      // ── 활동 완료 ──────────────────────────────────────────────────────────
      case "activity_complete": {
        const ctx: FeedbackContext = {
          userId,
          projectId,
          feedbackType: "activity",
          tier,
          language,
          biodata,
          activityData: {
            type: data?.activityType ?? "general",
            duration: data?.duration,
            completionRate: data?.completionRate,
            score: data?.score,
          },
          userProfile: {
            personalityType: profile?.personalityType ?? "balanced",
            totalFeedbackCount: profile?.totalFeedbackCount ?? 0,
          },
          recentHistory,
        };

        const result = await generateFeedback(ctx);
        await saveFeedback(ctx, result);

        // 다음 미션 생성
        const nextMission = await generateDailyMission(
          userId,
          projectId,
          biodata,
          language
        );

        // DB에 미션 저장
        const db = await getDb();
  if (!db) throw new Error("[DB] Database not available");
        const today = new Date().toISOString().split("T")[0];
        await db.insert(dailyMissions).values({
          userId,
          projectId,
          missionDate: today,
          missionType: nextMission.type as any,
          title: nextMission.title,
          description: nextMission.description,
          estimatedMinutes: nextMission.estimatedMinutes,
          rewardPoints: nextMission.rewardPoints,
        });

        return {
          success: true,
          feedbackContent: result.content,
          feedbackSummary: result.summary,
          ttsText: result.ttsText,
          pointsAwarded: result.pointsAwarded,
          nextMission,
        };
      }

      // ── 호흡 샘플 ──────────────────────────────────────────────────────────
      case "breathing_sample": {
        const breathingAnalysis = analyzeBreathingData(
          data?.frequencyData ?? [],
          data?.sampleDuration ?? 30
        );

        // 생체 데이터 저장
        await saveBiodataBatch([
          {
            userId,
            projectId,
            dataType: "breathing_rate",
            value: breathingAnalysis.breathingRate,
            unit: "breaths/min",
            accuracy: 75,
            durationSeconds: data?.sampleDuration,
          },
          {
            userId,
            projectId,
            dataType: "breathing_quality",
            value: breathingAnalysis.breathingQuality,
            unit: "score",
            accuracy: 70,
          },
          {
            userId,
            projectId,
            dataType: "stress_level",
            value: breathingAnalysis.stressIndicator,
            unit: "score",
            accuracy: 65,
          },
        ]);

        // 스트레스가 높으면 즉시 피드백
        if (breathingAnalysis.stressIndicator > 60) {
          const ctx: FeedbackContext = {
            userId,
            projectId,
            feedbackType: "breathing",
            tier: 1,
            language,
            biodata: {
              ...biodata,
              breathingRate: breathingAnalysis.breathingRate,
              breathingQuality: breathingAnalysis.breathingQuality,
              stressLevel: breathingAnalysis.stressIndicator,
            },
            recentHistory,
          };
          const result = await generateFeedback(ctx);
          await saveFeedback(ctx, result);

          return {
            success: true,
            feedbackContent: result.content,
            ttsText: result.ttsText,
            biometricAnalysis: { breathing: breathingAnalysis },
          };
        }

        return {
          success: true,
          biometricAnalysis: { breathing: breathingAnalysis },
        };
      }

      // ── 목소리 샘플 ────────────────────────────────────────────────────────
      case "voice_sample": {
        const voiceAnalysis = analyzeVoiceCondition(
          data?.amplitudeData ?? [],
          data?.frequencySpectrum ?? []
        );

        // 신뢰도가 충분할 때만 저장
        if (voiceAnalysis.confidence > 40) {
          await saveBiodataBatch([
            {
              userId,
              projectId,
              dataType: "voice_energy",
              value: voiceAnalysis.energyLevel,
              unit: "score",
              accuracy: voiceAnalysis.confidence,
            },
            {
              userId,
              projectId,
              dataType: "voice_stress",
              value: voiceAnalysis.stressLevel,
              unit: "score",
              accuracy: voiceAnalysis.confidence,
            },
          ]);
        }

        return {
          success: true,
          biometricAnalysis: { voiceCondition: voiceAnalysis },
        };
      }

      // ── 일일 체크인 ────────────────────────────────────────────────────────
      case "daily_checkin": {
        const ctx: FeedbackContext = {
          userId,
          projectId,
          feedbackType: "daily",
          tier,
          language,
          biodata,
          userProfile: {
            personalityType: profile?.personalityType ?? "balanced",
            totalFeedbackCount: profile?.totalFeedbackCount ?? 0,
          },
          recentHistory,
        };

        const result = await generateFeedback(ctx);
        await saveFeedback(ctx, result);

        const nextMission = await generateDailyMission(
          userId,
          projectId,
          biodata,
          language
        );

        return {
          success: true,
          feedbackContent: result.content,
          feedbackSummary: result.summary,
          ttsText: result.ttsText,
          pointsAwarded: result.pointsAwarded,
          nextMission,
        };
      }

      // ── 미션 완료 ──────────────────────────────────────────────────────────
      case "mission_complete": {
        const ctx: FeedbackContext = {
          userId,
          projectId,
          feedbackType: "mission",
          tier,
          language,
          biodata,
          activityData: {
            type: data?.activityType ?? "mission",
            completionRate: 100,
          },
          recentHistory,
        };

        const result = await generateFeedback(ctx);
        await saveFeedback(ctx, result);

        return {
          success: true,
          feedbackContent: result.content,
          ttsText: result.ttsText,
          pointsAwarded: result.pointsAwarded,
        };
      }

      // ── 채팅 메시지 ────────────────────────────────────────────────────────
      case "chat_message": {
        if (!data?.message) {
          return { success: false, error: "메시지가 없습니다." };
        }

        const reply = await generateConversationReply(
          userId,
          data.message,
          language,
          biodata,
          recentHistory
        );

        return {
          success: true,
          conversationReply: reply,
        };
      }

      default:
        return { success: false, error: `알 수 없는 이벤트 유형: ${eventType}` };
    }
  } catch (error) {
    console.error("[Orchestrator] 처리 실패:", error);
    return {
      success: false,
      error: "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    };
  }
}

// ─── 주간 피드백 생성 (배치 작업용) ──────────────────────────────────────────

export async function generateWeeklyFeedback(
  userId: number,
  projectId?: number,
  language: Language = "ko"
): Promise<string> {
  const profile = await getOrCreateFeedbackProfile(userId, projectId);
  const tier = (profile?.feedbackTier ?? 1) as FeedbackTier;
  const biodata = await getTodayBiodataSnapshot(userId);
  const recentHistory = await getRecentFeedbackHistory(userId, 7);

  const ctx: FeedbackContext = {
    userId,
    projectId,
    feedbackType: "weekly",
    tier,
    language,
    biodata,
    userProfile: {
      personalityType: profile?.personalityType ?? "balanced",
      totalFeedbackCount: profile?.totalFeedbackCount ?? 0,
    },
    recentHistory,
  };

  const result = await generateFeedback(ctx);
  await saveFeedback(ctx, result);

  return result.content;
}
