import { router, protectedProcedure, adminProcedure } from "../../_core/trpc";
import { z } from "zod";
import { getDb } from "../../db";
import { membershipTiers, userMemberships, pointsTransactions } from "../../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

/**
 * 멤버십 8단계 시스템 라우터 (중앙 관리자 대시보드용)
 * Silver / Gold / Blue Sapphire / Green Emerald / Diamond / Blue Diamond / Platinum / Black Platinum
 */

const TIER_POINT_THRESHOLDS = {
  silver: 0,
  gold: 10000,
  blue_sapphire: 50000,
  green_emerald: 100000,
  diamond: 250000,
  blue_diamond: 500000,
  platinum: 1000000,
  black_platinum: 2500000,
};

type TierKey = keyof typeof TIER_POINT_THRESHOLDS;

export const membershipRouter = router({
  /**
   * 사용자의 현재 멤버십 정보 조회
   */
  getCurrentMembership: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const userMembership = await db
      .select()
      .from(userMemberships)
      .where(eq(userMemberships.userId, ctx.user.id))
      .limit(1);

    if (userMembership.length === 0) {
      return {
        tier: "silver" as TierKey,
        currentPoints: 0,
        totalPointsEarned: 0,
        totalPointsUsed: 0,
        isActive: true,
        tierInfo: null,
      };
    }

    const membership = userMembership[0];
    const tierInfo = await db
      .select()
      .from(membershipTiers)
      .where(eq(membershipTiers.tier, membership.tier))
      .limit(1);

    return { ...membership, tierInfo: tierInfo[0] || null };
  }),

  /**
   * 모든 멤버십 티어 정보 조회
   */
  getAllTiers: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const tiers = await db.select().from(membershipTiers);
    return tiers;
  }),

  /**
   * 포인트 적립 및 자동 등급 상향
   */
  addPoints: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(0),
        source: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const userMembership = await db
        .select()
        .from(userMemberships)
        .where(eq(userMemberships.userId, ctx.user.id))
        .limit(1);

      if (userMembership.length === 0) {
        await db.insert(userMemberships).values({
          userId: ctx.user.id,
          tier: "silver",
          currentPoints: input.amount,
          totalPointsEarned: input.amount,
        });
        return { pointsAdded: input.amount, newBalance: input.amount };
      }

      const membership = userMembership[0];
      const newPoints = (membership.currentPoints ?? 0) + input.amount;
      const newTotalEarned = (membership.totalPointsEarned ?? 0) + input.amount;

      // 자동 등급 상향 로직
      let newTier: TierKey = membership.tier as TierKey;
      const tierEntries = (Object.entries(TIER_POINT_THRESHOLDS) as [TierKey, number][]).sort(
        ([, a], [, b]) => b - a
      );
      for (const [tier, threshold] of tierEntries) {
        if (newTotalEarned >= threshold) {
          newTier = tier;
          break;
        }
      }

      await db
        .update(userMemberships)
        .set({ currentPoints: newPoints, totalPointsEarned: newTotalEarned, tier: newTier })
        .where(eq(userMemberships.userId, ctx.user.id));

      return { pointsAdded: input.amount, newBalance: newPoints };
    }),

  /**
   * 포인트 사용
   */
  usePoints: protectedProcedure
    .input(z.object({ amount: z.number().min(0), source: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const userMembership = await db
        .select()
        .from(userMemberships)
        .where(eq(userMemberships.userId, ctx.user.id))
        .limit(1);

      if (userMembership.length === 0) throw new Error("포인트가 부족합니다");

      const membership = userMembership[0];
      const currentPoints = membership.currentPoints ?? 0;
      if (currentPoints < input.amount) throw new Error("포인트가 부족합니다");

      const newPoints = currentPoints - input.amount;
      const newTotalUsed = (membership.totalPointsUsed ?? 0) + input.amount;

      await db
        .update(userMemberships)
        .set({ currentPoints: newPoints, totalPointsUsed: newTotalUsed })
        .where(eq(userMemberships.userId, ctx.user.id));

      return { pointsUsed: input.amount, newBalance: newPoints };
    }),

  /**
   * 포인트 거래 내역 조회
   */
  getPointsHistory: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20), offset: z.number().min(0).default(0) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const transactions = await db
        .select()
        .from(pointsTransactions)
        .where(eq(pointsTransactions.userId, ctx.user.id))
        .orderBy(desc(pointsTransactions.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return transactions;
    }),

  /**
   * 등급 상향 진행 상황 조회
   */
  getTierProgressInfo: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const userMembership = await db
      .select()
      .from(userMemberships)
      .where(eq(userMemberships.userId, ctx.user.id))
      .limit(1);

    if (userMembership.length === 0) {
      return {
        currentTier: "silver" as TierKey,
        currentPoints: 0,
        nextTier: "gold" as TierKey,
        nextTierThreshold: TIER_POINT_THRESHOLDS.gold,
        pointsNeeded: TIER_POINT_THRESHOLDS.gold,
        progressPercentage: 0,
      };
    }

    const membership = userMembership[0];
    const currentPoints = membership.totalPointsEarned ?? 0;

    let nextTier: TierKey = "black_platinum";
    let nextThreshold: number = TIER_POINT_THRESHOLDS.black_platinum;

    const tierEntries = (Object.entries(TIER_POINT_THRESHOLDS) as [TierKey, number][]).sort(
      ([, a], [, b]) => a - b
    );
    for (const [tier, threshold] of tierEntries) {
      if (threshold > currentPoints) {
        nextTier = tier;
        nextThreshold = threshold;
        break;
      }
    }

    const currentThreshold = TIER_POINT_THRESHOLDS[membership.tier as TierKey] ?? 0;
    const progressPercentage = Math.min(
      100,
      Math.round(((currentPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    );

    return {
      currentTier: membership.tier as TierKey,
      currentPoints,
      nextTier,
      nextTierThreshold: nextThreshold,
      pointsNeeded: Math.max(0, nextThreshold - currentPoints),
      progressPercentage,
      currentThreshold,
    };
  }),

  /**
   * 관리자용: 전체 멤버십 현황 조회
   */
  adminGetAllMemberships: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const memberships = await db
        .select()
        .from(userMemberships)
        .orderBy(desc(userMemberships.currentPoints))
        .limit(input.limit)
        .offset(input.offset);

      return memberships;
    }),

  /**
   * 관리자용: 멤버십 등급 수동 변경
   */
  adminUpdateTier: adminProcedure
    .input(z.object({ userId: z.number(), tier: z.enum(["silver","gold","blue_sapphire","green_emerald","diamond","blue_diamond","platinum","black_platinum"]) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      await db
        .update(userMemberships)
        .set({ tier: input.tier, upgradedAt: new Date() })
        .where(eq(userMemberships.userId, input.userId));

      return { success: true };
    }),
});
