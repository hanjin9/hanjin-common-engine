import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { getDb } from "../../db";
import {
  lifecycleStages,
  emailCampaigns,
  anomalyAlerts,
  missionCurations,
  missions,
  users,
} from "../../../drizzle/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";
import { invokeLLM } from "../../_core/llm";

export const operationsRouter = router({
  // 라이프사이클 단계 조회
  getLifecycleStages: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        stage: z.enum(["new", "onboarding", "active", "at_risk", "churned", "reactivated"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const conditions = [];
      if (input.userId) conditions.push(eq(lifecycleStages.userId, input.userId));
      if (input.stage) conditions.push(eq(lifecycleStages.stage, input.stage));

      return await (await getDb())!
        .select()
        .from(lifecycleStages)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(lifecycleStages.enteredAt));
    }),

  // 라이프사이클 단계별 회원 수 통계
  getLifecycleStats: protectedProcedure.query(async () => {
    return await (await getDb())!
      .select({
        stage: lifecycleStages.stage,
        count: count(),
      })
      .from(lifecycleStages)
      .groupBy(lifecycleStages.stage);
  }),

  // 라이프사이클 단계 업데이트
  updateLifecycleStage: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        stage: z.enum(["new", "onboarding", "active", "at_risk", "churned", "reactivated"]),
        transitionReason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [stage] = await (await getDb())!
        .insert(lifecycleStages)
        .values({
          userId: input.userId,
          stage: input.stage,
          transitionReason: input.transitionReason,
          automationTriggered: false,
        })
        .$returningId();
      return stage;
    }),

  // 이메일 캠페인 목록
  getEmailCampaigns: protectedProcedure
    .input(
      z.object({
        status: z.enum(["draft", "scheduled", "sending", "sent", "paused"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const conditions = [];
      if (input.status) conditions.push(eq(emailCampaigns.status, input.status));

      return await (await getDb())!
        .select()
        .from(emailCampaigns)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(emailCampaigns.createdAt));
    }),

  // 이메일 캠페인 생성
  createEmailCampaign: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        campaignType: z.enum(["drip", "broadcast", "trigger", "reengagement"]),
        subject: z.string(),
        htmlContent: z.string(),
        targetSegment: z.record(z.string(), z.unknown()).optional(),
        scheduledAt: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [campaign] = await (await getDb())!
        .insert(emailCampaigns)
        .values({ ...input, status: "draft" })
        .$returningId();
      return campaign;
    }),

  // 이메일 캠페인 발송
  sendEmailCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ input }) => {
      await (await getDb())!
        .update(emailCampaigns)
        .set({ status: "sent", sentAt: new Date() })
        .where(eq(emailCampaigns.id, input.campaignId));
      return { success: true };
    }),

  // 이상 감지 알림 목록
  getAnomalyAlerts: protectedProcedure
    .input(
      z.object({
        severity: z.enum(["low", "medium", "high", "critical"]).optional(),
        isResolved: z.boolean().optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const conditions = [];
      if (input.severity) conditions.push(eq(anomalyAlerts.severity, input.severity));
      if (input.isResolved !== undefined) conditions.push(eq(anomalyAlerts.isResolved, input.isResolved));

      return await (await getDb())!
        .select()
        .from(anomalyAlerts)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(anomalyAlerts.createdAt))
        .limit(input.limit);
    }),

  // 이상 감지 알림 해결
  resolveAlert: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await (await getDb())!
        .update(anomalyAlerts)
        .set({
          isResolved: true,
          resolvedAt: new Date(),
          resolvedBy: ctx.user.id,
        })
        .where(eq(anomalyAlerts.id, input.alertId));
      return { success: true };
    }),

  // AI 미션 큐레이션 목록
  getMissionCurations: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        status: z.enum(["pending", "accepted", "rejected", "expired"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const targetUserId = input.userId ?? ctx.user.id;
      const conditions = [eq(missionCurations.userId, targetUserId)];
      if (input.status) conditions.push(eq(missionCurations.status, input.status));

      return await (await getDb())!
        .select()
        .from(missionCurations)
        .where(and(...conditions))
        .orderBy(desc(missionCurations.createdAt));
    }),

  // AI 미션 큐레이션 생성
  generateMissionCuration: protectedProcedure
    .input(
      z.object({
        targetUserId: z.number(),
        weekStartDate: z.date(),
      })
    )
    .mutation(async ({ input }) => {
      const availableMissions = await (await getDb())!
        .select({ id: missions.id, name: missions.title, category: missions.category })
        .from(missions)
        .where(eq(missions.isActive, true))
        .limit(20);

      const missionList = availableMissions.map((m) => `ID:${m.id} - ${m.name} (${m.category})`).join("\n");

      const aiResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "당신은 건강 미션 큐레이터입니다. 사용자에게 최적의 주간 미션을 추천합니다. JSON 형식으로만 응답하세요.",
          },
          {
            role: "user",
            content: `다음 미션 목록에서 이번 주에 적합한 미션 3~5개를 추천하세요:\n${missionList}\n\n{"recommended_mission_ids": [1, 2, 3], "reason": "추천 이유"} 형식으로 반환`,
          },
        ],
        response_format: { type: "json_object" } as { type: "json_object" },
      });

      let parsed: { recommended_mission_ids: number[]; reason: string };
      try {
        parsed = JSON.parse((aiResponse as { choices: Array<{ message: { content: string } }> }).choices[0]?.message?.content ?? "{}");
      } catch {
        parsed = { recommended_mission_ids: availableMissions.slice(0, 3).map((m) => m.id), reason: "기본 추천" };
      }

      const [curation] = await (await getDb())!
        .insert(missionCurations)
        .values({
          userId: input.targetUserId,
          weekStartDate: input.weekStartDate,
          recommendedMissions: parsed.recommended_mission_ids,
          aiReason: parsed.reason,
          status: "pending",
        })
        .$returningId();

      return { id: curation.id, ...parsed };
    }),

  // 미션 큐레이션 수락/거절
  respondToCuration: protectedProcedure
    .input(
      z.object({
        curationId: z.number(),
        action: z.enum(["accepted", "rejected"]),
        acceptedMissions: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      await (await getDb())!
        .update(missionCurations)
        .set({
          status: input.action,
          acceptedMissions: input.acceptedMissions,
        })
        .where(eq(missionCurations.id, input.curationId));
      return { success: true };
    }),

  // 운영 센터 요약 (대시보드용)
  getOperationsSummary: protectedProcedure.query(async () => {
    const [unresolvedAlerts] = await (await getDb())!
      .select({ count: count() })
      .from(anomalyAlerts)
      .where(eq(anomalyAlerts.isResolved, false));

    const [criticalAlerts] = await (await getDb())!
      .select({ count: count() })
      .from(anomalyAlerts)
      .where(and(eq(anomalyAlerts.severity, "critical"), eq(anomalyAlerts.isResolved, false)));

    const [pendingCurations] = await (await getDb())!
      .select({ count: count() })
      .from(missionCurations)
      .where(eq(missionCurations.status, "pending"));

    const [activeCampaigns] = await (await getDb())!
      .select({ count: count() })
      .from(emailCampaigns)
      .where(eq(emailCampaigns.status, "sending"));

    return {
      unresolvedAlerts: unresolvedAlerts.count,
      criticalAlerts: criticalAlerts.count,
      pendingCurations: pendingCurations.count,
      activeCampaigns: activeCampaigns.count,
    };
  }),
});
