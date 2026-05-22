import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { getDb } from "../../db";
import {
  predictionResults,
  monthlyReports,
  abExperiments,
  abParticipants,
  tieredProgress,
  users,
} from "../../../drizzle/schema";
import { eq, desc, and, count, avg, sql } from "drizzle-orm";
import { invokeLLM } from "../../_core/llm";

export const analyticsRouter = router({
  // 예측 분석 결과 조회
  getPredictions: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        predictionType: z.enum(["churn_risk", "health_risk", "engagement_score", "upgrade_probability"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const targetUserId = input.userId ?? ctx.user.id;
      const conditions = [eq(predictionResults.userId, targetUserId)];
      if (input.predictionType) conditions.push(eq(predictionResults.predictionType, input.predictionType));

      return await (await getDb())!
        .select()
        .from(predictionResults)
        .where(and(...conditions))
        .orderBy(desc(predictionResults.predictedAt))
        .limit(10);
    }),

  // AI 예측 분석 실행
  runPrediction: protectedProcedure
    .input(
      z.object({
        targetUserId: z.number(),
        predictionType: z.enum(["churn_risk", "health_risk", "engagement_score", "upgrade_probability"]),
      })
    )
    .mutation(async ({ input }) => {
      const userProgress = await (await getDb())!
        .select()
        .from(tieredProgress)
        .where(eq(tieredProgress.userId, input.targetUserId))
        .limit(1);

      const progress = userProgress[0];
      const contextData = progress
        ? `총 점수: ${progress.overallWellness}, 연속 달성: ${progress.daysCompleted}일, 현재 티어: ${progress.currentStage}`
        : "데이터 없음";

      const prompts: Record<string, string> = {
        churn_risk: `다음 사용자 데이터를 기반으로 이탈 위험도를 0~1 사이 점수로 예측하세요. ${contextData}. JSON 형식으로 {"score": 0.X, "confidence": 0.X, "factors": {"reason1": "...", "reason2": "..."}, "recommendation": "..."} 반환`,
        health_risk: `다음 사용자 데이터를 기반으로 건강 위험도를 0~1 사이 점수로 예측하세요. ${contextData}. JSON 형식으로 {"score": 0.X, "confidence": 0.X, "factors": {"reason1": "...", "reason2": "..."}, "recommendation": "..."} 반환`,
        engagement_score: `다음 사용자 데이터를 기반으로 참여도 점수를 0~1 사이로 예측하세요. ${contextData}. JSON 형식으로 {"score": 0.X, "confidence": 0.X, "factors": {"reason1": "...", "reason2": "..."}, "recommendation": "..."} 반환`,
        upgrade_probability: `다음 사용자 데이터를 기반으로 업그레이드 확률을 0~1 사이로 예측하세요. ${contextData}. JSON 형식으로 {"score": 0.X, "confidence": 0.X, "factors": {"reason1": "...", "reason2": "..."}, "recommendation": "..."} 반환`,
      };

      const aiResponse = await invokeLLM({
        messages: [
          { role: "system", content: "당신은 건강 데이터 분석 전문가입니다. JSON 형식으로만 응답하세요." },
          { role: "user", content: prompts[input.predictionType] },
        ],
        response_format: { type: "json_object" } as { type: "json_object" },
      });

      let parsed: { score: number; confidence: number; factors: Record<string, unknown>; recommendation: string };
      try {
        parsed = JSON.parse((aiResponse as { choices: Array<{ message: { content: string } }> }).choices[0]?.message?.content ?? "{}");
      } catch {
        parsed = { score: 0.5, confidence: 0.5, factors: {}, recommendation: "데이터 부족" };
      }

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7일 후 만료

      const [prediction] = await (await getDb())!
        .insert(predictionResults)
        .values({
          userId: input.targetUserId,
          predictionType: input.predictionType,
          score: parsed.score.toFixed(4),
          confidence: parsed.confidence?.toFixed(4),
          factors: parsed.factors,
          recommendation: parsed.recommendation,
          expiresAt,
        })
        .$returningId();

      return { id: prediction.id, ...parsed };
    }),

  // 월간 리포트 조회
  getMonthlyReport: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        year: z.number(),
        month: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const targetUserId = input.userId ?? ctx.user.id;
      const reports = await (await getDb())!
        .select()
        .from(monthlyReports)
        .where(
          and(
            eq(monthlyReports.userId, targetUserId),
            eq(monthlyReports.year, input.year),
            eq(monthlyReports.month, input.month)
          )
        )
        .limit(1);
      return reports[0] ?? null;
    }),

  // 월간 리포트 생성
  generateReport: protectedProcedure
    .input(
      z.object({
        targetUserId: z.number(),
        year: z.number(),
        month: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const progress = await (await getDb())!
        .select()
        .from(tieredProgress)
        .where(eq(tieredProgress.userId, input.targetUserId))
        .limit(1);

      const reportData = {
        userId: input.targetUserId,
        period: `${input.year}년 ${input.month}월`,
        totalScore: progress[0]?.overallWellness ?? 0,
        streakDays: progress[0]?.daysCompleted ?? 0,
        currentTier: progress[0]?.currentStage ?? "bronze",
        generatedAt: new Date().toISOString(),
      };

      const [report] = await (await getDb())!
        .insert(monthlyReports)
        .values({
          userId: input.targetUserId,
          year: input.year,
          month: input.month,
          reportData,
        })
        .$returningId();

      return { id: report.id, reportData };
    }),

  // A/B 테스트 목록
  getExperiments: protectedProcedure.query(async () => {
    return await (await getDb())!
      .select()
      .from(abExperiments)
      .orderBy(desc(abExperiments.createdAt));
  }),

  // A/B 테스트 생성
  createExperiment: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        experimentType: z.enum(["mission", "feedback", "ui", "notification"]),
        variantA: z.record(z.string(), z.unknown()),
        variantB: z.record(z.string(), z.unknown()),
        trafficSplit: z.string().default("50.00"),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [experiment] = await (await getDb())!
        .insert(abExperiments)
        .values({
          ...input,
          status: "draft",
        })
        .$returningId();
      return experiment;
    }),

  // A/B 테스트 상태 변경
  updateExperimentStatus: protectedProcedure
    .input(
      z.object({
        experimentId: z.number(),
        status: z.enum(["draft", "running", "paused", "completed"]),
        winnerVariant: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await (await getDb())!
        .update(abExperiments)
        .set({ status: input.status, winnerVariant: input.winnerVariant })
        .where(eq(abExperiments.id, input.experimentId));
      return { success: true };
    }),

  // A/B 테스트 결과 조회
  getExperimentResults: protectedProcedure
    .input(z.object({ experimentId: z.number() }))
    .query(async ({ input }) => {
      const results = await (await getDb())!
        .select({
          variant: abParticipants.variant,
          total: count(),
          converted: sql<number>`SUM(CASE WHEN ${abParticipants.converted} = 1 THEN 1 ELSE 0 END)`,
        })
        .from(abParticipants)
        .where(eq(abParticipants.experimentId, input.experimentId))
        .groupBy(abParticipants.variant);

      return results.map((r) => ({
        variant: r.variant,
        total: r.total,
        converted: Number(r.converted),
        conversionRate: r.total > 0 ? (Number(r.converted) / r.total * 100).toFixed(2) : "0.00",
      }));
    }),

  // 전체 분석 요약 (대시보드용)
  getAnalyticsSummary: protectedProcedure.query(async () => {
    const [totalUsers] = await (await getDb())!.select({ count: count() }).from(users);
    const [activeExperiments] = await (await getDb())!
      .select({ count: count() })
      .from(abExperiments)
      .where(eq(abExperiments.status, "running"));
    const [pendingPredictions] = await (await getDb())!
      .select({ count: count() })
      .from(predictionResults);

    return {
      totalUsers: totalUsers.count,
      activeExperiments: activeExperiments.count,
      totalPredictions: pendingPredictions.count,
    };
  }),
});
