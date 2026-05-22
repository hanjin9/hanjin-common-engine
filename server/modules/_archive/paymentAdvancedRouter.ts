import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { getDb } from "../../db";
import {
  rewardRules,
  premiumProducts,
  premiumPurchases,
  franchiseSettlements,
  userWallets,
  walletTransactions,
} from "../../../drizzle/schema";
import { eq, desc, and, count, sum, sql } from "drizzle-orm";

export const paymentAdvancedRouter = router({
  // 포인트 리워드 규칙 목록
  getRewardRules: protectedProcedure.query(async () => {
    return await (await getDb())!
      .select()
      .from(rewardRules)
      .orderBy(desc(rewardRules.createdAt));
  }),

  // 포인트 리워드 규칙 생성
  createRewardRule: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        triggerEvent: z.string(),
        pointsAmount: z.number(),
        multiplier: z.string().default("1.00"),
        maxPerDay: z.number().optional(),
        validFrom: z.date().optional(),
        validUntil: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [rule] = await (await getDb())!
        .insert(rewardRules)
        .values({ ...input, isActive: true })
        .$returningId();
      return rule;
    }),

  // 포인트 리워드 규칙 수정
  updateRewardRule: protectedProcedure
    .input(
      z.object({
        ruleId: z.number(),
        isActive: z.boolean().optional(),
        pointsAmount: z.number().optional(),
        multiplier: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { ruleId, ...updates } = input;
      await (await getDb())!
        .update(rewardRules)
        .set(updates)
        .where(eq(rewardRules.id, ruleId));
      return { success: true };
    }),

  // 프리미엄 상품 목록
  getPremiumProducts: protectedProcedure
    .input(z.object({ activeOnly: z.boolean().default(true) }))
    .query(async ({ input }) => {
      const conditions = input.activeOnly ? [eq(premiumProducts.isActive, true)] : [];
      return await (await getDb())!
        .select()
        .from(premiumProducts)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(premiumProducts.salesCount));
    }),

  // 프리미엄 상품 생성
  createPremiumProduct: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        productType: z.enum(["mission_pack", "coaching_session", "report", "course", "tool"]),
        priceKrw: z.number(),
        pricePoints: z.number().optional(),
        contentUrl: z.string().optional(),
        thumbnailUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [product] = await (await getDb())!
        .insert(premiumProducts)
        .values({ ...input, isActive: true })
        .$returningId();
      return product;
    }),

  // 프리미엄 상품 구매
  purchaseProduct: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        paymentMethod: z.enum(["stripe", "points", "mixed"]),
        pointsToUse: z.number().optional(),
        stripePaymentIntentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const product = await (await getDb())!
        .select()
        .from(premiumProducts)
        .where(eq(premiumProducts.id, input.productId))
        .limit(1);

      if (!product[0]) throw new Error("상품을 찾을 수 없습니다.");

      const [purchase] = await (await getDb())!
        .insert(premiumPurchases)
        .values({
          userId: ctx.user.id,
          productId: input.productId,
          paymentMethod: input.paymentMethod,
          amountKrw: product[0].priceKrw,
          pointsUsed: input.pointsToUse,
          stripePaymentIntentId: input.stripePaymentIntentId,
          status: "completed",
        })
        .$returningId();

      // 판매 수 증가
      await (await getDb())!
        .update(premiumProducts)
        .set({ salesCount: sql`${premiumProducts.salesCount} + 1` })
        .where(eq(premiumProducts.id, input.productId));

      return purchase;
    }),

  // B2B 프랜차이즈 정산 목록
  getSettlements: protectedProcedure
    .input(
      z.object({
        projectId: z.number().optional(),
        year: z.number().optional(),
        month: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const conditions = [];
      if (input.projectId) conditions.push(eq(franchiseSettlements.projectId, input.projectId));
      if (input.year) conditions.push(eq(franchiseSettlements.year, input.year));
      if (input.month) conditions.push(eq(franchiseSettlements.month, input.month));

      return await (await getDb())!
        .select()
        .from(franchiseSettlements)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(franchiseSettlements.createdAt));
    }),

  // 정산 생성
  createSettlement: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        year: z.number(),
        month: z.number(),
        totalRevenue: z.string(),
        platformFeeRate: z.string(),
        memberCount: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const totalRevenue = parseFloat(input.totalRevenue);
      const feeRate = parseFloat(input.platformFeeRate);
      const platformFee = (totalRevenue * feeRate).toFixed(2);
      const franchiseeAmount = (totalRevenue - parseFloat(platformFee)).toFixed(2);

      const [settlement] = await (await getDb())!
        .insert(franchiseSettlements)
        .values({
          ...input,
          platformFee,
          franchiseeAmount,
          status: "pending",
        })
        .$returningId();
      return settlement;
    }),

  // 정산 처리
  processSettlement: protectedProcedure
    .input(
      z.object({
        settlementId: z.number(),
        status: z.enum(["processing", "completed", "disputed"]),
      })
    )
    .mutation(async ({ input }) => {
      await (await getDb())!
        .update(franchiseSettlements)
        .set({
          status: input.status,
          settledAt: input.status === "completed" ? new Date() : undefined,
        })
        .where(eq(franchiseSettlements.id, input.settlementId));
      return { success: true };
    }),

  // 결제 고도화 요약 (대시보드용)
  getPaymentAdvancedSummary: protectedProcedure.query(async () => {
    const [activeRules] = await (await getDb())!
      .select({ count: count() })
      .from(rewardRules)
      .where(eq(rewardRules.isActive, true));

    const [activeProducts] = await (await getDb())!
      .select({ count: count() })
      .from(premiumProducts)
      .where(eq(premiumProducts.isActive, true));

    const [pendingSettlements] = await (await getDb())!
      .select({ count: count() })
      .from(franchiseSettlements)
      .where(eq(franchiseSettlements.status, "pending"));

    return {
      activeRewardRules: activeRules.count,
      activePremiumProducts: activeProducts.count,
      pendingSettlements: pendingSettlements.count,
    };
  }),
});
