import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { getDb } from "../../db";
import { feedbackQueue, fcmTokens, users } from "../../../drizzle/schema";
import { eq, desc, and, count, inArray } from "drizzle-orm";
import { invokeLLM } from "../../_core/llm";

export const feedbackAdvancedRouter = router({
  // 피드백 큐 조회 (관리자)
  getFeedbackQueue: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "approved", "sent", "failed", "cancelled"]).optional(),
        feedbackType: z.enum(["auto_1st", "auto_2nd", "manual_3rd"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const conditions = [];
      if (input.status) conditions.push(eq(feedbackQueue.status, input.status));
      if (input.feedbackType) conditions.push(eq(feedbackQueue.feedbackType, input.feedbackType));

      const items = await (await getDb())!
        .select()
        .from(feedbackQueue)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(feedbackQueue.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return items;
    }),

  // 피드백 통계
  getFeedbackStats: protectedProcedure.query(async () => {
    const stats = await (await getDb())!
      .select({
        status: feedbackQueue.status,
        count: count(),
      })
      .from(feedbackQueue)
      .groupBy(feedbackQueue.status);

    const channelStats = await (await getDb())!
      .select({
        channel: feedbackQueue.channel,
        count: count(),
      })
      .from(feedbackQueue)
      .groupBy(feedbackQueue.channel);

    return { statusStats: stats, channelStats };
  }),

  // AI 피드백 생성 (1차/2차 자동)
  createAutoFeedback: protectedProcedure
    .input(
      z.object({
        targetUserId: z.number(),
        feedbackType: z.enum(["auto_1st", "auto_2nd"]),
        channel: z.enum(["push", "sms", "email", "voice", "in_app"]),
        rankTier: z.string().optional(),
        triggerReason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tierMessages: Record<string, { title: string; prompt: string }> = {
        top5: { title: "🏆 최상위 수련자 피드백", prompt: "상위 5% 수련자에게 격려와 도전 메시지" },
        top10: { title: "⭐ 상위 10% 수련자 피드백", prompt: "상위 10% 수련자에게 격려 메시지" },
        top20: { title: "👍 상위 20% 수련자 피드백", prompt: "상위 20% 수련자에게 긍정적 피드백" },
        middle: { title: "💪 중위 수련자 피드백", prompt: "중위 수련자에게 동기부여 메시지" },
        bottom20: { title: "🌱 하위 20% 수련자 피드백", prompt: "하위 20% 수련자에게 격려와 개선 방향 제시" },
        bottom10: { title: "💙 하위 10% 수련자 피드백", prompt: "하위 10% 수련자에게 따뜻한 격려와 쉬운 미션 제안" },
      };

      const tier = input.rankTier ?? "middle";
      const tierInfo = tierMessages[tier] ?? tierMessages.middle;

      const isSecondFeedback = input.feedbackType === "auto_2nd";
      const intensity = isSecondFeedback ? "더 구체적이고 심층적으로" : "가볍고 친근하게";

      const aiResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `당신은 평생 건강수련 프로그램의 전문 코치입니다. 회원에게 ${intensity} 피드백을 제공합니다. 한국어로 작성하세요. 100자 이내로 간결하게 작성하세요.`,
          },
          {
            role: "user",
            content: `${tierInfo.prompt}. 트리거 이유: ${input.triggerReason ?? "정기 피드백"}. ${isSecondFeedback ? "1차 피드백 이후 더 심층적인 2차 피드백을 작성하세요." : ""}`,
          },
        ],
      });

      const content = (aiResponse as { choices: Array<{ message: { content: string } }> }).choices[0]?.message?.content ?? "오늘도 건강한 하루 보내세요!";

      const [feedback] = await (await getDb())!
        .insert(feedbackQueue)
        .values({
          userId: input.targetUserId,
          feedbackType: input.feedbackType,
          channel: input.channel,
          status: "pending",
          title: tierInfo.title,
          content,
          rankTier: input.rankTier,
          triggerReason: input.triggerReason,
          approvedBy: ctx.user.id,
        })
        .$returningId();

      return { id: feedback.id, content };
    }),

  // 3차 수동 피드백 생성 (매니저)
  createManualFeedback: protectedProcedure
    .input(
      z.object({
        targetUserId: z.number(),
        channel: z.enum(["push", "sms", "email", "voice", "in_app"]),
        title: z.string(),
        content: z.string(),
        scheduledAt: z.date().optional(),
        rankTier: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [feedback] = await (await getDb())!
        .insert(feedbackQueue)
        .values({
          userId: input.targetUserId,
          feedbackType: "manual_3rd",
          channel: input.channel,
          status: "approved",
          title: input.title,
          content: input.content,
          scheduledAt: input.scheduledAt,
          rankTier: input.rankTier,
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
        })
        .$returningId();

      return feedback;
    }),

  // 피드백 승인
  approveFeedback: protectedProcedure
    .input(z.object({ feedbackId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await (await getDb())!
        .update(feedbackQueue)
        .set({
          status: "approved",
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
        })
        .where(eq(feedbackQueue.id, input.feedbackId));
      return { success: true };
    }),

  // 피드백 거절
  rejectFeedback: protectedProcedure
    .input(z.object({ feedbackId: z.number() }))
    .mutation(async ({ input }) => {
      await (await getDb())!
        .update(feedbackQueue)
        .set({ status: "cancelled" })
        .where(eq(feedbackQueue.id, input.feedbackId));
      return { success: true };
    }),

  // 피드백 발송 처리 (상태 업데이트)
  markFeedbackSent: protectedProcedure
    .input(z.object({ feedbackId: z.number() }))
    .mutation(async ({ input }) => {
      await (await getDb())!
        .update(feedbackQueue)
        .set({ status: "sent", sentAt: new Date() })
        .where(eq(feedbackQueue.id, input.feedbackId));
      return { success: true };
    }),

  // FCM 토큰 등록
  registerFcmToken: protectedProcedure
    .input(
      z.object({
        token: z.string(),
        platform: z.enum(["ios", "android", "web"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 기존 토큰 비활성화
      await (await getDb())!
        .update(fcmTokens)
        .set({ isActive: false })
        .where(
          and(
            eq(fcmTokens.userId, ctx.user.id),
            eq(fcmTokens.platform, input.platform)
          )
        );

      // 새 토큰 등록
      const [token] = await (await getDb())!
        .insert(fcmTokens)
        .values({
          userId: ctx.user.id,
          token: input.token,
          platform: input.platform,
          isActive: true,
        })
        .$returningId();

      return token;
    }),

  // 사용자 FCM 토큰 목록
  getUserFcmTokens: protectedProcedure.query(async ({ ctx }) => {
    return await (await getDb())!
      .select()
      .from(fcmTokens)
      .where(
        and(
          eq(fcmTokens.userId, ctx.user.id),
          eq(fcmTokens.isActive, true)
        )
      );
  }),
});
