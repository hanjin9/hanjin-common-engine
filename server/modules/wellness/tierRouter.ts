import { protectedProcedure, publicProcedure, router } from "../../_core/trpc";
import { z } from "zod";
import {
  TEN_TIER_SYSTEM,
  getUserTierLevel,
  getDaysUntilNextTier,
  getTierProgress,
  checkTierUpgrade,
} from "../../../shared/tenTierSystem";

/**
 * 10단계 수련 시스템 tRPC 라우터
 * 사용자의 수련 일수 기반 단계 자동 계산 및 권한 관리
 */
export const tierRouter = router({
  /**
   * 사용자의 현재 단계 및 진행 상태 조회
   */
  getCurrentTier: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    // TODO: 실제 DB 쿼리로 변경
    // const user = await db.user.findUnique({ where: { id: userId } });
    // const daysCompleted = user?.daysCompleted || 0;
    const daysCompleted = 150; // 임시값

    // 현재 단계 계산
    const currentTier = getUserTierLevel(daysCompleted);
    const nextTierId = currentTier.id < 10 ? currentTier.id + 1 : null;
    const nextTier = nextTierId
      ? TEN_TIER_SYSTEM[nextTierId - 1]
      : null;

    // 진행률 계산
    const progressPercentage = getTierProgress(daysCompleted);
    const daysUntilNext = getDaysUntilNextTier(daysCompleted);

    return {
      userId,
      currentTier: {
        id: currentTier.id,
        nameKo: currentTier.nameKo,
        nameEn: currentTier.nameEn,
        coreSubject: currentTier.coreSubject,
        badge: currentTier.badge,
        color: currentTier.color,
        features: currentTier.features,
        permissions: currentTier.permissions,
        rewards: currentTier.rewards,
      },
      nextTier: nextTier
        ? {
            id: nextTier.id,
            nameKo: nextTier.nameKo,
            nameEn: nextTier.nameEn,
            daysUntilUpgrade: daysUntilNext,
          }
        : null,
      daysCompleted,
      progressPercentage,
      isMaxLevel: currentTier.id === 10,
    };
  }),

  /**
   * 사용자의 수련 일수 업데이트
   */
  updateDaysCompleted: protectedProcedure
    .input(
      z.object({
        daysToAdd: z.number().min(1).max(365),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // TODO: 실제 DB 업데이트로 변경
      // const updatedUser = await db.user.update({
      //   where: { id: userId },
      //   data: { daysCompleted: { increment: input.daysToAdd } },
      // });

      const previousDaysCompleted = 150; // 임시값
      const newDaysCompleted = previousDaysCompleted + input.daysToAdd;

      // 단계 업그레이드 감지
      const upgradedTier = checkTierUpgrade(previousDaysCompleted, newDaysCompleted);

      return {
        success: true,
        userId,
        newDaysCompleted,
        tierUpgraded: upgradedTier !== null,
        upgradedTier: upgradedTier
          ? {
              id: upgradedTier.id,
              nameKo: upgradedTier.nameKo,
              nameEn: upgradedTier.nameEn,
              badge: upgradedTier.badge,
              color: upgradedTier.color,
              rewards: upgradedTier.rewards,
            }
          : null,
      };
    }),

  /**
   * 10단계 전체 데이터 조회 (진행 상황 시각화용)
   */
  getAllTiers: publicProcedure.query(() => {
    return TEN_TIER_SYSTEM.map((tier) => ({
      id: tier.id,
      nameKo: tier.nameKo,
      nameEn: tier.nameEn,
      coreSubject: tier.coreSubject,
      daysRequired: tier.daysRequired,
      daysMax: tier.daysMax === Infinity ? 9999 : tier.daysMax,
      badge: tier.badge,
      color: tier.color,
    }));
  }),

  /**
   * 특정 단계의 상세 정보 조회
   */
  getTierDetails: publicProcedure
    .input(z.object({ tierId: z.number().min(1).max(10) }))
    .query(({ input }) => {
      const tier = TEN_TIER_SYSTEM.find((t) => t.id === input.tierId);
      if (!tier) {
        throw new Error(`Tier ID ${input.tierId} not found`);
      }

      return {
        id: tier.id,
        nameKo: tier.nameKo,
        nameEn: tier.nameEn,
        coreSubject: tier.coreSubject,
        boneStructure: tier.boneStructure,
        status: tier.status,
        daysRequired: tier.daysRequired,
        daysMax: tier.daysMax === Infinity ? 9999 : tier.daysMax,
        features: tier.features,
        permissions: tier.permissions,
        rewards: tier.rewards,
        badge: tier.badge,
        color: tier.color,
      };
    }),

  /**
   * 사용자 단계 업그레이드 감지 및 알림
   */
  checkTierUpgrade: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    // TODO: 실제 DB 쿼리로 변경
    // const user = await db.user.findUnique({ where: { id: userId } });
    // const daysCompleted = user?.daysCompleted || 0;
    // const lastNotifiedTierId = user?.lastNotifiedTierId || 0;
    const daysCompleted = 150;
    const lastNotifiedTierId = 5; // 임시값

    const currentTier = getUserTierLevel(daysCompleted);

    const upgraded = currentTier.id > lastNotifiedTierId;

    if (upgraded) {
      // TODO: 알림 저장
      return {
        upgraded: true,
        newTier: {
          id: currentTier.id,
          nameKo: currentTier.nameKo,
          nameEn: currentTier.nameEn,
          coreSubject: currentTier.coreSubject,
          badge: currentTier.badge,
          color: currentTier.color,
          features: currentTier.features,
          permissions: currentTier.permissions,
          rewards: currentTier.rewards,
        },
      };
    }

    return { upgraded: false };
  }),
});
