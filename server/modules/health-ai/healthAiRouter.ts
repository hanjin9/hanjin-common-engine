/**
 * 건강 AI 분석/피드백 tRPC 라우터
 *
 * glwa-wellness-check 엔진 복사 + hanjin-common-engine 스키마에 맞게 통합
 *
 * 기능:
 * - 생체 데이터 분석 (심박수, 수면, 걸음수, 칼로리, 혈압, 산소포화도)
 * - 3단계 AI 피드백 (격려 → 경고 → 프리미엄 전문 분석)
 * - feedbackLogs DB 저장
 * - 관리자용 전체 현황 (최소 탭)
 */
import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../../_core/trpc";
import { invokeLLM } from "../../_core/llm";
import { getDb } from "../../db";
import { feedbackLogs, biodataRecords } from "../../../drizzle/schema";
import { eq, desc, gte, and, count, avg, sql } from "drizzle-orm";

// ─── 생체 데이터 입력 스키마 ─────────────────────────────────────────────
const BiodataInputSchema = z.object({
  heartRate: z.number().min(0).max(300).optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  steps: z.number().min(0).optional(),
  caloriesBurned: z.number().min(0).optional(),
  exerciseMinutes: z.number().min(0).optional(),
  breathingRate: z.number().min(0).max(60).optional(),
  bloodPressureSystolic: z.number().min(0).max(300).optional(),
  bloodPressureDiastolic: z.number().min(0).max(200).optional(),
  oxygenSaturation: z.number().min(0).max(100).optional(),
  stressLevel: z.number().min(1).max(10).optional(),
  mealScore: z.number().min(1).max(10).optional(),
  language: z.enum(["ko", "en", "ja", "zh", "es"]).default("ko"),
  projectId: z.number().optional(),
});

// ─── 건강 점수 계산 ──────────────────────────────────────────────────────
function calculateHealthScore(data: z.infer<typeof BiodataInputSchema>): number {
  let score = 0;
  let factors = 0;

  if (data.heartRate) {
    factors++;
    if (data.heartRate >= 60 && data.heartRate <= 100) score += 90;
    else if (data.heartRate >= 50 && data.heartRate <= 110) score += 70;
    else score += 40;
  }
  if (data.sleepHours) {
    factors++;
    if (data.sleepHours >= 7 && data.sleepHours <= 9) score += 95;
    else if (data.sleepHours >= 6 && data.sleepHours <= 10) score += 75;
    else score += 45;
  }
  if (data.steps) {
    factors++;
    if (data.steps >= 10000) score += 100;
    else if (data.steps >= 7000) score += 80;
    else if (data.steps >= 5000) score += 65;
    else score += 40;
  }
  if (data.oxygenSaturation) {
    factors++;
    if (data.oxygenSaturation >= 98) score += 100;
    else if (data.oxygenSaturation >= 95) score += 80;
    else score += 50;
  }
  if (data.breathingRate) {
    factors++;
    if (data.breathingRate >= 12 && data.breathingRate <= 20) score += 90;
    else score += 55;
  }
  if (data.stressLevel) {
    factors++;
    score += Math.max(0, 100 - (data.stressLevel - 1) * 11);
  }
  if (data.mealScore) {
    factors++;
    score += data.mealScore * 10;
  }

  return factors > 0 ? Math.round(score / factors) : 50;
}

// ─── 경고 체크 ───────────────────────────────────────────────────────────
function checkHealthWarnings(data: z.infer<typeof BiodataInputSchema>): string[] {
  const warnings: string[] = [];
  if (data.heartRate && (data.heartRate < 50 || data.heartRate > 110))
    warnings.push(`심박수 이상 (${data.heartRate}bpm)`);
  if (data.sleepHours && data.sleepHours < 6)
    warnings.push(`수면 부족 (${data.sleepHours}시간)`);
  if (data.oxygenSaturation && data.oxygenSaturation < 95)
    warnings.push(`산소포화도 낮음 (${data.oxygenSaturation}%)`);
  if (data.bloodPressureSystolic && data.bloodPressureSystolic > 140)
    warnings.push(`혈압 높음 (${data.bloodPressureSystolic}/${data.bloodPressureDiastolic}mmHg)`);
  if (data.stressLevel && data.stressLevel >= 8)
    warnings.push(`스트레스 매우 높음 (${data.stressLevel}/10)`);
  if (data.steps && data.steps < 3000)
    warnings.push(`활동량 부족 (${data.steps}걸음)`);
  return warnings;
}

// ─── HanJin 레벨 ─────────────────────────────────────────────────────────
function scoreToHanJinLevel(score: number): string {
  if (score >= 95) return "DIAMOND";
  if (score >= 85) return "PLATINUM";
  if (score >= 75) return "GOLD";
  if (score >= 60) return "SILVER";
  if (score >= 45) return "BRONZE";
  return "STARTER";
}

export const healthAiRouter = router({
  // ─── 생체 데이터 분석 + AI 피드백 생성 ──────────────────────────────────
  analyzeAndFeedback: protectedProcedure
    .input(BiodataInputSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const score = calculateHealthScore(input);
      const warnings = checkHealthWarnings(input);
      const hanJinLevel = scoreToHanJinLevel(score);

      // 1차 피드백: 격려 (즉시, 무료)
      let encouragementText = `오늘 건강 점수 ${score}점! ${hanJinLevel} 레벨을 유지하고 있습니다. 계속 화이팅!`;
      let warningText = "";

      try {
        const langMap: Record<string, string> = {
          ko: "한국어", en: "English", ja: "日本語", zh: "中文", es: "Español"
        };
        const lang = langMap[input.language] || "한국어";

        const encourageRes = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `당신은 따뜻하고 격려하는 건강 코치입니다. 사용자의 건강 데이터를 보고 긍정적이고 구체적인 격려 메시지를 1-2문장으로 작성하세요. ${lang}로 답하세요.`,
            },
            {
              role: "user",
              content: `건강 점수: ${score}점 (${hanJinLevel} 레벨)\n심박수: ${input.heartRate || "미측정"}bpm, 수면: ${input.sleepHours || "미측정"}시간, 걸음수: ${input.steps || "미측정"}걸음\n칼로리: ${input.caloriesBurned || "미측정"}kcal, 산소포화도: ${input.oxygenSaturation || "미측정"}%`,
            },
          ],
        });
        const c = encourageRes.choices[0]?.message?.content;
        encouragementText = typeof c === "string" ? c : encouragementText;
      } catch { /* fallback 사용 */ }

      // 2차 피드백: 경고 (조건부)
      if (warnings.length > 0) {
        try {
          const warnRes = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `당신은 전문 건강 어드바이저입니다. 경고 지표에 대해 직접적이지만 지지적인 개선 방안을 2-3문장으로 제시하세요. 한국어로 답하세요.`,
              },
              {
                role: "user",
                content: `경고 지표: ${warnings.join(", ")}\n개선 방안을 구체적으로 알려주세요.`,
              },
            ],
          });
          const c = warnRes.choices[0]?.message?.content;
          warningText = typeof c === "string" ? c : `주의 지표: ${warnings.join(", ")}. 전문가 상담을 권장합니다.`;
        } catch {
          warningText = `주의 지표: ${warnings.join(", ")}. 생활 습관 개선이 필요합니다.`;
        }
      }

      const fullFeedback = encouragementText + (warningText ? "\n\n⚠️ " + warningText : "");

      // feedbackLogs DB 저장
      if (db) {
        try {
          await db.insert(feedbackLogs).values({
            userId: parseInt(ctx.user.openId) || 0,
            projectId: input.projectId,
            feedbackTier: warnings.length > 0 ? 2 : 1,
            feedbackType: "daily",
            triggerType: "biodata_analysis",
            triggerData: JSON.stringify({
              heartRate: input.heartRate,
              sleepHours: input.sleepHours,
              steps: input.steps,
              score,
              hanJinLevel,
            }),
            feedbackContent: fullFeedback,
            feedbackSummary: encouragementText.substring(0, 200),
            language: input.language,
            pointsAwarded: Math.floor(score / 10),
          });
        } catch (e) {
          console.error("[HealthAI] feedbackLogs save error:", e);
        }

        // biodataRecords에 심박수 저장 (있는 경우)
        if (input.heartRate) {
          try {
            await db.insert(biodataRecords).values({
              userId: parseInt(ctx.user.openId) || 0,
              projectId: input.projectId,
              dataSource: "self",
              dataType: "heart_rate",
              value: String(input.heartRate),
              unit: "bpm",
              accuracy: 80,
            });
          } catch { /* ignore */ }
        }
      }

      return {
        score,
        hanJinLevel,
        warnings,
        feedback: {
          encouragement: encouragementText,
          warning: warningText || null,
          hasWarning: warnings.length > 0,
        },
        pointsEarned: Math.floor(score / 10),
        timestamp: new Date().toISOString(),
      };
    }),

  // ─── 개인 피드백 이력 조회 ────────────────────────────────────────────
  getMyFeedbackHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select()
        .from(feedbackLogs)
        .where(eq(feedbackLogs.userId, parseInt(ctx.user.openId) || 0))
        .orderBy(desc(feedbackLogs.createdAt))
        .limit(input.limit);
    }),

  // ─── 관리자: 전체 AI 분석 현황 (최소 탭) ─────────────────────────────
  getAdminOverview: adminProcedure
    .input(z.object({
      period: z.enum(["today", "week", "month"]).default("week"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const dateFrom = new Date();
      if (input.period === "today") dateFrom.setHours(0, 0, 0, 0);
      else if (input.period === "week") dateFrom.setDate(dateFrom.getDate() - 7);
      else dateFrom.setDate(dateFrom.getDate() - 30);

      const [totalFeedbacks, typeDist] = await Promise.all([
        db.select({ cnt: count() })
          .from(feedbackLogs)
          .where(gte(feedbackLogs.createdAt, dateFrom)),
        db.select({
          type: feedbackLogs.feedbackType,
          cnt: count(),
        })
          .from(feedbackLogs)
          .where(gte(feedbackLogs.createdAt, dateFrom))
          .groupBy(feedbackLogs.feedbackType),
      ]);

      return {
        totalFeedbacks: Number(totalFeedbacks[0]?.cnt ?? 0),
        typeDistribution: typeDist,
        period: input.period,
      };
    }),

  // ─── 관리자: 피드백 목록 (페이지네이션) ────────────────────────────────
  getFeedbackList: adminProcedure
    .input(z.object({
      period: z.enum(["today", "week", "month", "all"]).default("week"),
      projectSlug: z.string().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(100),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { items: [], total: 0 };
      const conditions: any[] = [];
      if (input.period !== "all") {
        const dateFrom = new Date();
        if (input.period === "today") dateFrom.setHours(0, 0, 0, 0);
        else if (input.period === "week") dateFrom.setDate(dateFrom.getDate() - 7);
        else dateFrom.setDate(dateFrom.getDate() - 30);
        conditions.push(gte(feedbackLogs.createdAt, dateFrom));
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const [items, totalRows] = await Promise.all([
        db.select().from(feedbackLogs).where(whereClause)
          .orderBy(desc(feedbackLogs.createdAt))
          .limit(input.pageSize)
          .offset((input.page - 1) * input.pageSize),
        db.select({ count: count() }).from(feedbackLogs).where(whereClause),
      ]);
      return { items, total: totalRows[0]?.count ?? 0 };
    }),

  // ─── 관리자: 피드백 통계 ─────────────────────────────────────────────
  getFeedbackStats: adminProcedure
    .input(z.object({
      period: z.enum(["today", "week", "month", "all"]).default("week"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { total: 0, criticalCount: 0, uniqueUsers: 0, avgResponseMs: null };
      const conditions: any[] = [];
      if (input.period !== "all") {
        const dateFrom = new Date();
        if (input.period === "today") dateFrom.setHours(0, 0, 0, 0);
        else if (input.period === "week") dateFrom.setDate(dateFrom.getDate() - 7);
        else dateFrom.setDate(dateFrom.getDate() - 30);
        conditions.push(gte(feedbackLogs.createdAt, dateFrom));
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const [totalRows, criticalRows] = await Promise.all([
        db.select({ cnt: count() }).from(feedbackLogs).where(whereClause),
        db.select({ cnt: count() }).from(feedbackLogs)
          .where(whereClause ? and(whereClause, eq(feedbackLogs.feedbackTier, 3)) : eq(feedbackLogs.feedbackTier, 3)),
      ]);
      return {
        total: Number(totalRows[0]?.cnt ?? 0),
        criticalCount: Number(criticalRows[0]?.cnt ?? 0),
        uniqueUsers: 0,
        avgResponseMs: null,
      };
    }),

  // ─── 관리자: 최근 피드백 목록 ────────────────────────────────────────
  getRecentFeedbacks: adminProcedure
    .input(z.object({
      limit: z.number().default(50),
      period: z.enum(["today", "week", "month", "all"]).default("week"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions: any[] = [];
      if (input.period !== "all") {
        const dateFrom = new Date();
        if (input.period === "today") dateFrom.setHours(0, 0, 0, 0);
        else if (input.period === "week") dateFrom.setDate(dateFrom.getDate() - 7);
        else dateFrom.setDate(dateFrom.getDate() - 30);
        conditions.push(gte(feedbackLogs.createdAt, dateFrom));
      }

      return db.select()
        .from(feedbackLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(feedbackLogs.createdAt))
        .limit(input.limit);
    }),

  // ─── 프리미엄 심화 분석 ───────────────────────────────────────────────
  getPremiumAnalysis: protectedProcedure
    .input(BiodataInputSchema)
    .mutation(async ({ input }) => {
      try {
        const analysisRes = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `당신은 어의(Royal Physician)입니다. 사용자의 생체 데이터를 분석하여 건강 상태를 진단하세요.
분석 항목: 1.호흡 분석 2.심박수 분석 3.수면 분석 4.운동 분석 5.종합 진단 및 개인 맞춤형 생활 처방`,
            },
            {
              role: "user",
              content: `생체 데이터:
- 심박수: ${input.heartRate || "미측정"}bpm
- 수면: ${input.sleepHours || "미측정"}시간
- 걸음수: ${input.steps || "미측정"}걸음
- 칼로리: ${input.caloriesBurned || "미측정"}kcal
- 운동: ${input.exerciseMinutes || "미측정"}분
- 호흡률: ${input.breathingRate || "미측정"}회/분
- 산소포화도: ${input.oxygenSaturation || "미측정"}%
- 혈압: ${input.bloodPressureSystolic || "미측정"}/${input.bloodPressureDiastolic || "미측정"}mmHg
- 스트레스: ${input.stressLevel || "미측정"}/10

종합 분석과 개인 맞춤형 생활 처방을 상세히 제시해주세요.`,
            },
          ],
        });
        const content = analysisRes.choices[0]?.message?.content;
        return {
          analysis: typeof content === "string" ? content : "분석을 완료했습니다.",
          creditsUsed: 50,
          timestamp: new Date().toISOString(),
        };
      } catch {
        return {
          analysis: `심박수 ${input.heartRate}bpm, 수면 ${input.sleepHours}시간 기준 분석: 오늘은 수분 섭취를 늘리고 20분 가벼운 유산소 운동 후 취침 1시간 전 전자기기 사용을 줄이세요.`,
          creditsUsed: 50,
          timestamp: new Date().toISOString(),
        };
      }
    }),
});
