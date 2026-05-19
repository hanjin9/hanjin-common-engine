/**
 * projectMembershipFactory.ts
 * 한진 공통 엔진 — 프로젝트별 멤버십/구독 팩토리
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  GLWA (부모 앱)   : VIP 멤버십 10단계 (+ Black Platinum 예약)   │
 * │  숨호흡 MVP (자식): 유료 구독 레벨 4~6단계 (멤버십 아님)         │
 * │  기타 프로젝트    : 각자 독립 단계 설정                          │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * 설계 원칙:
 * 1. DB(project_membership_tiers)가 단계 정의의 단일 진실 소스
 * 2. 코드 상수는 초기 시드 + 타입 참조용으로만 사용
 * 3. 단계 수는 row 추가/비활성화만으로 변경 가능 (코드 수정 불필요)
 * 4. 숨호흡 ↔ GLWA 연동은 parentProjectSlug 필드로 나중에 연결
 */

import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../../_core/trpc';
import { getDb } from '../../db';
import { projectMembershipTiers, projectUserMemberships, membershipPolicyHistory } from '../../../drizzle/schema';
import { eq, and, asc, desc } from 'drizzle-orm';

// ─── GLWA 10단계 VIP 멤버십 시드 데이터 ──────────────────────────────────────
// Black Platinum(11단계)은 is_active=false 로 예약만 해둠
// ✅ 2026-05-20 확정: GitHub glwa-wellness-app vipTierSystem.ts 원본 수치 기준
export const GLWA_MEMBERSHIP_SEED = [
  {
    tierOrder: 1,  tierKey: "bronze",        tierLabel: "Bronze",
    tierColor: "#CD7F32", pointThreshold: 0,
    annualFeeKrw: 100_000,
    benefits: JSON.stringify(["기본 건강 분석", "월 1회 피드백", "커뮤니티 접근"]),
    autoUpgrade: false, isActive: true,
  },
  {
    tierOrder: 2,  tierKey: "silver",        tierLabel: "Silver",
    tierColor: "#C0C0C0", pointThreshold: 1_000,
    annualFeeKrw: 300_000,
    benefits: JSON.stringify(["주간 건강 분석", "월 2회 피드백", "우선 상담", "실버 배지"]),
    autoUpgrade: false, isActive: true,
  },
  {
    tierOrder: 3,  tierKey: "gold",          tierLabel: "Gold",
    tierColor: "#FFD700", pointThreshold: 5_000,
    annualFeeKrw: 600_000,
    benefits: JSON.stringify(["일일 건강 분석", "주 1회 피드백", "VIP 상담", "골드 배지", "우선 이벤트 초대"]),
    autoUpgrade: false, isActive: true,
  },
  {
    tierOrder: 4,  tierKey: "emerald",       tierLabel: "Emerald",
    tierColor: "#50C878", pointThreshold: 10_000,
    annualFeeKrw: 1_200_000,
    benefits: JSON.stringify(["실시간 건강 분석", "주 2회 피드백", "전담 코치 배정", "에메랄드 배지", "프리미엄 이벤트", "특별 할인 (10%)"]),
    autoUpgrade: false, isActive: true,
  },
  {
    tierOrder: 5,  tierKey: "green_emerald", tierLabel: "Green Emerald",
    tierColor: "#00A86B", pointThreshold: 20_000,
    annualFeeKrw: 2_400_000,
    benefits: JSON.stringify(["24/7 실시간 분석", "주 3회 심화 피드백", "전담 코치 + 영양사", "그린 에메랄드 배지", "럭셔리 이벤트", "특별 할인 (15%)", "1:1 맞춤 프로그램"]),
    autoUpgrade: false, isActive: true,
  },
  {
    tierOrder: 6,  tierKey: "sapphire",      tierLabel: "Sapphire",
    tierColor: "#0F52BA", pointThreshold: 35_000,
    annualFeeKrw: 5_000_000,
    benefits: JSON.stringify(["AI 예측 분석", "주 4회 전문가 피드백", "전담 팀 (코치+영양사+의사)", "사파이어 배지", "국제 이벤트 초대", "특별 할인 (20%)", "맞춤형 건강 프로그램", "우선 신상품 접근"]),
    autoUpgrade: false, isActive: true,
  },
  {
    tierOrder: 7,  tierKey: "blue_sapphire", tierLabel: "Blue Sapphire",
    tierColor: "#0047AB", pointThreshold: 55_000,
    annualFeeKrw: 10_000_000,
    benefits: JSON.stringify(["고급 AI 예측 분석", "주 5회 전문가 피드백", "전담 팀 + 심리 상담사", "블루 사파이어 배지", "글로벌 이벤트 초대", "특별 할인 (25%)", "VIP 라운지 접근", "사장님 직접 상담 (월 1회)"]),
    autoUpgrade: false, isActive: true,
  },
  {
    tierOrder: 8,  tierKey: "diamond",       tierLabel: "Diamond",
    tierColor: "#B9F2FF", pointThreshold: 80_000,
    annualFeeKrw: 20_000_000,
    benefits: JSON.stringify(["최고급 AI 분석", "매일 전문가 피드백", "전담 팀 + 심리 상담사 + 영적 코치", "다이아몬드 배지", "프라이빗 이벤트", "특별 할인 (30%)", "VIP 라운지 24/7 접근", "사장님 주간 상담", "럭셔리 선물 제공"]),
    autoUpgrade: false, isActive: true,
  },
  {
    tierOrder: 9,  tierKey: "blue_diamond",  tierLabel: "Blue Diamond",
    tierColor: "#0000FF", pointThreshold: 120_000,
    annualFeeKrw: 30_000_000,
    benefits: JSON.stringify(["초고급 AI 분석 + 예측", "일일 1:1 전문가 상담", "전담 팀 + 심리 상담사 + 영적 코치 + 의료진", "블루 다이아몬드 배지", "프라이빗 글로벌 이벤트", "특별 할인 (35%)", "프라이빗 라운지 전용", "사장님 주 2회 상담", "럭셔리 선물 + 여행 패키지", "제국 내 특별 권한"]),
    autoUpgrade: false, isActive: true,
  },
  {
    tierOrder: 10, tierKey: "platinum",      tierLabel: "Platinum",
    tierColor: "#E5E4E2", pointThreshold: 200_000,
    annualFeeKrw: 50_000_000,
    benefits: JSON.stringify(["초월적 AI 분석", "24/7 전담 의료진", "최고급 전담 팀", "플래티넘 배지", "프라이빗 글로벌 이벤트 + 여행", "특별 할인 (40%)", "프라이빗 라운지 + 개인 비서", "사장님 일일 상담", "럭셔리 선물 + 맞춤형 여행", "제국 내 최상위 권한", "평생 회원권"]),
    autoUpgrade: false, isActive: true,
  },
  // ── 예약 단계 (비활성 — 추후 초대 전용으로 활성화) ──
  {
    tierOrder: 11, tierKey: "black_platinum", tierLabel: "Black Platinum",
    tierColor: "#1a1a1a", pointThreshold: 500_000,
    annualFeeKrw: 100_000_000,
    benefits: JSON.stringify(["무한 AI 분석 + 예측", "24/7 최고급 의료진 + 심리팀", "사장님 직속 전담팀", "블랙 플래티넘 배지 (최상위)", "글로벌 프라이빗 이벤트 + 여행", "특별 할인 (50%)", "프라이빗 라운지 + 개인 비서 + 운전기사", "사장님 일일 1:1 상담 (무제한)", "럭셔리 선물 + 맞춤형 여행 + 자산관리", "제국 내 절대 권한", "평생 회원권 + 상속 가능", "제국 이사회 참석권", "사장님 특별 초대 (연 4회)"]),
    autoUpgrade: false, isActive: false, // 비활성 예약
  },
] as const;

// ─── 숨호흡 MVP 구독 레벨 시드 데이터 ────────────────────────────────────────
// 멤버십이 아닌 유료 구독 서비스 레벨 (4~6단계 설계, 현재 5단계 운영)
// parentProjectSlug = 'glwa' → 나중에 GLWA와 연동 가능
export const BREATHING_SUBSCRIPTION_SEED = [
  {
    tierOrder: 1, tierKey: "free",     tierLabel: "Free",
    tierColor: "#94a3b8", pointThreshold: 0,
    annualFeeKrw: 0,
    benefits: JSON.stringify(["기본 호흡법 3가지", "일일 1회 세션", "기초 가이드"]),
    autoUpgrade: false, isActive: true,
    parentProjectSlug: "glwa", parentTierKey: null,
  },
  {
    tierOrder: 2, tierKey: "bronze",   tierLabel: "Bronze",
    tierColor: "#cd7f32", pointThreshold: 0,
    annualFeeKrw: 9_900,   // 월 9,900원 (연 환산)
    benefits: JSON.stringify(["호흡법 10가지", "일일 무제한 세션", "수면 분석 기본"]),
    autoUpgrade: false, isActive: true,
    parentProjectSlug: "glwa", parentTierKey: "bronze",
  },
  {
    tierOrder: 3, tierKey: "silver",   tierLabel: "Silver",
    tierColor: "#c0c0c0", pointThreshold: 0,
    annualFeeKrw: 19_900,  // 월 19,900원
    benefits: JSON.stringify(["호흡법 30가지", "AI 피드백", "수면 분석 고급", "미션 시스템"]),
    autoUpgrade: false, isActive: true,
    parentProjectSlug: "glwa", parentTierKey: "silver",
  },
  {
    tierOrder: 4, tierKey: "gold",     tierLabel: "Gold",
    tierColor: "#ffd700", pointThreshold: 0,
    annualFeeKrw: 39_900,  // 월 39,900원
    benefits: JSON.stringify(["전체 호흡법 무제한", "실시간 AI 코칭", "생체 데이터 연동", "1:1 상담 월 1회"]),
    autoUpgrade: false, isActive: true,
    parentProjectSlug: "glwa", parentTierKey: "gold",
  },
  {
    tierOrder: 5, tierKey: "premium",  tierLabel: "Premium",
    tierColor: "#8b5cf6", pointThreshold: 0,
    annualFeeKrw: 79_900,  // 월 79,900원
    benefits: JSON.stringify(["Gold 전체 포함", "전담 코치 배정", "가족 계정 3인", "오프라인 세미나 초대"]),
    autoUpgrade: false, isActive: true,
    parentProjectSlug: "glwa", parentTierKey: "emerald",
  },
  // ── 예약 단계 (비활성, 나중에 활성화 가능) ──
  {
    tierOrder: 6, tierKey: "vip",      tierLabel: "VIP",
    tierColor: "#f59e0b", pointThreshold: 0,
    annualFeeKrw: 150_000, // 월 150,000원
    benefits: JSON.stringify(["Premium 전체 포함", "GLWA 멤버십 연동", "글로벌 커뮤니티 접근"]),
    autoUpgrade: false, isActive: false, // 예약 (GLWA 연동 후 활성화)
    parentProjectSlug: "glwa", parentTierKey: "green_emerald",
  },
] as const;

// ─── 프로젝트 메타 정보 ────────────────────────────────────────────────────────
export const PROJECT_META: Record<string, {
  name: string;
  type: "membership" | "subscription"; // 멤버십 vs 구독 레벨
  parentSlug?: string;
  maxTiers: number;
  description: string;
}> = {
  "glwa": {
    name: "GLWA (글로벌 웰니스 협회)",
    type: "membership",
    maxTiers: 11, // 10단계 운영 + 1단계 예약
    description: "부모 앱 — 10개 건강 카테고리 통합 VIP 멤버십",
  },
  "breathing-app": {
    name: "숨호흡 MVP",
    type: "subscription",
    parentSlug: "glwa",
    maxTiers: 6, // 5단계 운영 + 1단계 예약
    description: "자식 앱 — GLWA 10단계 중 첫 번째 카테고리 (호흡), 빠른 수익화",
  },
  "glwa-community": {
    name: "GLWA 커뮤니티",
    type: "membership",
    parentSlug: "glwa",
    maxTiers: 3,
    description: "협회 회원 등급 (일반/전문가/협회장)",
  },
  "bread-coach": {
    name: "장부관리사",
    type: "subscription",
    maxTiers: 4,
    description: "자격증 등급 기반 구독",
  },
  "sports-recovery": {
    name: "스포츠회복사",
    type: "subscription",
    maxTiers: 3,
    description: "자격증 등급 기반 구독",
  },
  "coin-lotto": {
    name: "로또",
    type: "subscription",
    maxTiers: 1,
    description: "응모권 기반 (등급 없음)",
  },
};

// ─── tRPC 라우터 ───────────────────────────────────────────────────────────────
export const projectMembershipRouter = router({

  /**
   * 프로젝트 메타 정보 조회 (type, maxTiers, parentSlug 등)
   */
  getProjectMeta: protectedProcedure
    .input(z.object({ projectSlug: z.string() }))
    .query(({ input }) => {
      return PROJECT_META[input.projectSlug] ?? null;
    }),

  /**
   * 모든 프로젝트 메타 목록
   */
  listProjectMeta: protectedProcedure.query(() => {
    return Object.entries(PROJECT_META).map(([slug, meta]) => ({ slug, ...meta }));
  }),

  /**
   * 프로젝트의 활성 멤버십/구독 단계 목록 (DB 기반)
   * - is_active = true 인 단계만 반환
   * - includeInactive = true 이면 예약 단계도 포함
   */
  getProjectTiers: protectedProcedure
    .input(z.object({
      projectSlug: z.string(),
      includeInactive: z.boolean().default(false),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const rows = await db
        .select()
        .from(projectMembershipTiers)
        .where(
          input.includeInactive
            ? eq(projectMembershipTiers.projectSlug, input.projectSlug)
            : and(
                eq(projectMembershipTiers.projectSlug, input.projectSlug),
                eq(projectMembershipTiers.isActive, true)
              )
        )
        .orderBy(asc(projectMembershipTiers.tierOrder));

      return rows.map(r => ({
        ...r,
        benefits: r.benefits ? JSON.parse(r.benefits) as string[] : [],
      }));
    }),

  /**
   * 사용자의 특정 프로젝트 멤버십/구독 조회
   */
  getUserProjectMembership: protectedProcedure
    .input(z.object({ projectSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const membership = await db
        .select()
        .from(projectUserMemberships)
        .where(
          and(
            eq(projectUserMemberships.userId, ctx.user.id),
            eq(projectUserMemberships.projectSlug, input.projectSlug),
            eq(projectUserMemberships.isActive, true)
          )
        )
        .limit(1);

      if (membership.length === 0) {
        // 미가입 → 기본 단계 정보 반환
        const firstTier = await db
          .select()
          .from(projectMembershipTiers)
          .where(
            and(
              eq(projectMembershipTiers.projectSlug, input.projectSlug),
              eq(projectMembershipTiers.isActive, true)
            )
          )
          .orderBy(asc(projectMembershipTiers.tierOrder))
          .limit(1);

        return {
          enrolled: false,
          currentTierKey: firstTier[0]?.tierKey ?? "free",
          currentTierLabel: firstTier[0]?.tierLabel ?? "Free",
          currentTierColor: firstTier[0]?.tierColor ?? "#94a3b8",
          currentPoints: 0,
          annualFeePaid: false,
        };
      }

      const m = membership[0];
      const tierInfo = await db
        .select()
        .from(projectMembershipTiers)
        .where(
          and(
            eq(projectMembershipTiers.projectSlug, input.projectSlug),
            eq(projectMembershipTiers.tierKey, m.currentTierKey)
          )
        )
        .limit(1);

      return {
        enrolled: true,
        ...m,
        tierLabel: tierInfo[0]?.tierLabel ?? m.currentTierKey,
        tierColor: tierInfo[0]?.tierColor ?? "#94a3b8",
        benefits: tierInfo[0]?.benefits ? JSON.parse(tierInfo[0].benefits) as string[] : [],
        annualFeeKrw: tierInfo[0]?.annualFeeKrw ?? 0,
      };
    }),

  /**
   * 관리자: 프로젝트 단계 목록 (비활성 포함)
   */
  adminGetAllTiers: adminProcedure
    .input(z.object({ projectSlug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const rows = await db
        .select()
        .from(projectMembershipTiers)
        .where(eq(projectMembershipTiers.projectSlug, input.projectSlug))
        .orderBy(asc(projectMembershipTiers.tierOrder));

      return rows.map(r => ({
        ...r,
        benefits: r.benefits ? JSON.parse(r.benefits) as string[] : [],
      }));
    }),

  /**
   * 관리자: 단계 활성화/비활성화 (Black Platinum 활성화 등)
   */
  adminToggleTierActive: adminProcedure
    .input(z.object({
      tierId: z.number(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db
        .update(projectMembershipTiers)
        .set({ isActive: input.isActive, updatedAt: new Date() })
        .where(eq(projectMembershipTiers.id, input.tierId));

      return { success: true };
    }),

  /**
   * 관리자: 단계 정보 수정 (연회비, 혜택, 색상 등)
   */
  adminUpdateTier: adminProcedure
    .input(z.object({
      tierId: z.number(),
      tierLabel: z.string().optional(),
      tierColor: z.string().optional(),
      annualFeeKrw: z.number().optional(),
      benefits: z.array(z.string()).optional(),
      pointThreshold: z.number().optional(),
      changeNote: z.string().optional(), // 변경 사유/메모
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      type TierUpdate = Partial<{
        tierLabel: string;
        tierColor: string;
        annualFeeKrw: number;
        benefits: string;
        pointThreshold: number;
        updatedAt: Date;
      }>;
      const updateData: TierUpdate = { updatedAt: new Date() };
      if (input.tierLabel !== undefined) updateData.tierLabel = input.tierLabel;
      if (input.tierColor !== undefined) updateData.tierColor = input.tierColor;
      if (input.annualFeeKrw !== undefined) updateData.annualFeeKrw = input.annualFeeKrw;
      if (input.benefits !== undefined) updateData.benefits = JSON.stringify(input.benefits);
      if (input.pointThreshold !== undefined) updateData.pointThreshold = input.pointThreshold;

            // 변경 전 값 조회
      const before = await db
        .select()
        .from(projectMembershipTiers)
        .where(eq(projectMembershipTiers.id, input.tierId))
        .limit(1);
      await db
        .update(projectMembershipTiers)
        .set(updateData)
        .where(eq(projectMembershipTiers.id, input.tierId));
      // 정책 변경 이력 기록
      if (before.length > 0) {
        const prev = before[0];
        await db.insert(membershipPolicyHistory).values({
          projectSlug: prev.projectSlug,
          tierKey: prev.tierKey,
          tierLabel: input.tierLabel ?? prev.tierLabel,
          changedBy: 'admin',
          changeType: 'full_update',
          previousValue: JSON.stringify({
            tierLabel: prev.tierLabel,
            tierColor: prev.tierColor,
            annualFeeKrw: prev.annualFeeKrw,
            benefits: prev.benefits,
            pointThreshold: prev.pointThreshold,
          }),
          newValue: JSON.stringify({
            tierLabel: input.tierLabel ?? prev.tierLabel,
            tierColor: input.tierColor ?? prev.tierColor,
            annualFeeKrw: input.annualFeeKrw ?? prev.annualFeeKrw,
            benefits: input.benefits ?? (prev.benefits ? JSON.parse(prev.benefits) : []),
            pointThreshold: input.pointThreshold ?? prev.pointThreshold,
          }),
          changeNote: input.changeNote ?? null,
        });
      }
      return { success: true };
    }),

  /**
   * 관리자: 사용자 단계 수동 변경
   * (adminOnly 프로젝트는 관리자만 변경 가능)
   */
  adminUpdateUserTier: adminProcedure
    .input(z.object({
      userId: z.number(),
      projectSlug: z.string(),
      newTierKey: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // 유효한 단계인지 확인
      const tier = await db
        .select()
        .from(projectMembershipTiers)
        .where(
          and(
            eq(projectMembershipTiers.projectSlug, input.projectSlug),
            eq(projectMembershipTiers.tierKey, input.newTierKey)
          )
        )
        .limit(1);

      if (tier.length === 0) {
        throw new Error(`프로젝트 "${input.projectSlug}"에 단계 "${input.newTierKey}"가 존재하지 않습니다`);
      }

      // upsert: 없으면 생성, 있으면 업데이트
      const existing = await db
        .select()
        .from(projectUserMemberships)
        .where(
          and(
            eq(projectUserMemberships.userId, input.userId),
            eq(projectUserMemberships.projectSlug, input.projectSlug)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(projectUserMemberships).values({
          userId: input.userId,
          projectSlug: input.projectSlug,
          currentTierKey: input.newTierKey,
          tierChangeReason: input.reason ?? "관리자 수동 설정",
          tierChangedAt: new Date(),
        });
      } else {
        await db
          .update(projectUserMemberships)
          .set({
            currentTierKey: input.newTierKey,
            tierChangeReason: input.reason ?? "관리자 수동 변경",
            tierChangedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(projectUserMemberships.userId, input.userId),
              eq(projectUserMemberships.projectSlug, input.projectSlug)
            )
          );
      }

      return { success: true, newTierKey: input.newTierKey, tierLabel: tier[0].tierLabel };
    }),

  /**
   * 관리자: 프로젝트별 단계 분포 통계
   */
  adminGetTierStats: adminProcedure
    .input(z.object({ projectSlug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const tiers = await db
        .select()
        .from(projectMembershipTiers)
        .where(eq(projectMembershipTiers.projectSlug, input.projectSlug))
        .orderBy(asc(projectMembershipTiers.tierOrder));

      const memberships = await db
        .select()
        .from(projectUserMemberships)
        .where(
          and(
            eq(projectUserMemberships.projectSlug, input.projectSlug),
            eq(projectUserMemberships.isActive, true)
          )
        );

      const tierCounts: Record<string, number> = {};
      for (const m of memberships) {
        tierCounts[m.currentTierKey] = (tierCounts[m.currentTierKey] ?? 0) + 1;
      }

      const meta = PROJECT_META[input.projectSlug];

      return {
        projectSlug: input.projectSlug,
        projectName: meta?.name ?? input.projectSlug,
        projectType: meta?.type ?? "membership",
        totalMembers: memberships.length,
        tierDistribution: tiers.map(t => ({
          tierOrder: t.tierOrder,
          tierKey: t.tierKey,
          tierLabel: t.tierLabel,
          tierColor: t.tierColor,
          isActive: t.isActive,
          annualFeeKrw: t.annualFeeKrw,
          count: tierCounts[t.tierKey] ?? 0,
          percentage: memberships.length > 0
            ? Math.round(((tierCounts[t.tierKey] ?? 0) / memberships.length) * 100)
            : 0,
          benefits: (() => {
            try { return JSON.parse(t.benefits ?? '[]') as string[]; }
            catch { return [] as string[]; }
          })(),
        })),
      };
    }),

  /**
   * 관리자: 정책 변경 이력 조회
   */
  adminGetPolicyHistory: adminProcedure
    .input(z.object({
      projectSlug: z.string(),
      tierKey: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const conditions = [eq(membershipPolicyHistory.projectSlug, input.projectSlug)];
      if (input.tierKey) {
        conditions.push(eq(membershipPolicyHistory.tierKey, input.tierKey));
      }
      const history = await db
        .select()
        .from(membershipPolicyHistory)
        .where(and(...conditions))
        .orderBy(desc(membershipPolicyHistory.createdAt))
        .limit(input.limit);
      return history.map(h => ({
        id: h.id,
        tierKey: h.tierKey,
        tierLabel: h.tierLabel,
        changedBy: h.changedBy,
        changedByName: h.changedByName,
        changeType: h.changeType,
        previousValue: h.previousValue ? (() => { try { return JSON.parse(h.previousValue!); } catch { return null; } })() : null,
        newValue: (() => { try { return JSON.parse(h.newValue); } catch { return h.newValue; } })(),
        changeNote: h.changeNote,
        effectiveDate: h.effectiveDate,
        createdAt: h.createdAt,
      }));
    }),

  /**
   * 시드 데이터 삽입 (최초 1회 실행용, 관리자 전용)
   * GLWA 10단계 + 숨호흡 5단계를 DB에 초기 삽입
   */
  adminSeedTiers: adminProcedure
    .input(z.object({
      projectSlug: z.enum(["glwa", "breathing-app"]),
      force: z.boolean().default(false), // true면 기존 데이터 삭제 후 재삽입
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // 이미 데이터가 있으면 스킵 (force=true가 아닌 경우)
      if (!input.force) {
        const existing = await db
          .select()
          .from(projectMembershipTiers)
          .where(eq(projectMembershipTiers.projectSlug, input.projectSlug))
          .limit(1);

        if (existing.length > 0) {
          return { skipped: true, message: `${input.projectSlug} 단계 데이터가 이미 존재합니다. force=true로 재삽입하세요.` };
        }
      }

      const seedData = input.projectSlug === "glwa"
        ? GLWA_MEMBERSHIP_SEED
        : BREATHING_SUBSCRIPTION_SEED;

      const rows = seedData.map(s => ({
        projectSlug: input.projectSlug,
        tierOrder: s.tierOrder,
        tierKey: s.tierKey,
        tierLabel: s.tierLabel,
        tierColor: s.tierColor,
        pointThreshold: s.pointThreshold,
        annualFeeKrw: s.annualFeeKrw,
        benefits: s.benefits,
        autoUpgrade: s.autoUpgrade,
        isActive: s.isActive,
        parentProjectSlug: "parentProjectSlug" in s ? (s as { parentProjectSlug?: string }).parentProjectSlug ?? null : null,
        parentTierKey: "parentTierKey" in s ? (s as { parentTierKey?: string | null }).parentTierKey ?? null : null,
      }));

      await db.insert(projectMembershipTiers).values(rows);

      return {
        skipped: false,
        inserted: rows.length,
        message: `${input.projectSlug} 단계 ${rows.length}개 삽입 완료`,
      };
    }),
});

export default projectMembershipRouter;
