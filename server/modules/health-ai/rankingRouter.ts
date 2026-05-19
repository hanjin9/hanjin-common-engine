/**
 * rankingRouter.ts — 사용자 % 랭킹 시스템
 * - 전체 사용자 포인트/피드백 기반 백분위 랭킹
 * - top 1% / 5% / 10% / 20% / 하위 20% 분포
 * - 개인 랭킹 조회
 * - TOP 사용자 리더보드
 */
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../../_core/trpc";
import { getDb } from "../../db";
import { feedbackLogs, missionCompletions } from "../../../drizzle/schema";
import { eq, desc, count, sql } from "drizzle-orm";

// ─── 티어 레이블 매핑 ─────────────────────────────────────────────────────────
function getTierLabel(percentile: number): string {
  if (percentile <= 1)  return "top_1";
  if (percentile <= 5)  return "top_5";
  if (percentile <= 10) return "top_10";
  if (percentile <= 20) return "top_20";
  if (percentile >= 80) return "bottom_20";
  return "normal";
}

function getTierDisplayName(tier: string): string {
  const map: Record<string, string> = {
    top_1:    "상위 1% 엘리트",
    top_5:    "상위 5% 챔피언",
    top_10:   "상위 10% 마스터",
    top_20:   "상위 20% 어드밴스드",
    bottom_20:"성장 중",
    normal:   "일반",
  };
  return map[tier] ?? "일반";
}

export const rankingRouter = router({
  /**
   * 전체 % 랭킹 분포 통계 (관리자/공개)
   */
  getRankingStats: publicProcedure
    .input(z.object({ projectSlug: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { totalUsers: 0, top1pct: 0, top5pct: 0, top10pct: 0, top20pct: 0, bottom20pct: 0, avgFeedbackCount: 0, distribution: [] };

      // 사용자별 피드백 수 집계
      const userCounts = await db
        .select({
          userId: feedbackLogs.userId,
          feedbackCount: count(feedbackLogs.id),
        })
        .from(feedbackLogs)
        .groupBy(feedbackLogs.userId)
        .orderBy(desc(count(feedbackLogs.id)));

      const totalUsers = userCounts.length;
      if (totalUsers === 0) {
        return {
          totalUsers: 0,
          top1pct: 0, top5pct: 0, top10pct: 0, top20pct: 0, bottom20pct: 0,
          avgFeedbackCount: 0,
          distribution: [],
        };
      }

      // 각 구간 경계값 계산
      const top1Idx    = Math.ceil(totalUsers * 0.01);
      const top5Idx    = Math.ceil(totalUsers * 0.05);
      const top10Idx   = Math.ceil(totalUsers * 0.10);
      const top20Idx   = Math.ceil(totalUsers * 0.20);
      const bottom20Idx = Math.floor(totalUsers * 0.80);

      const totalFeedback = userCounts.reduce((s, u) => s + Number(u.feedbackCount), 0);

      return {
        totalUsers,
        top1pct:    top1Idx,
        top5pct:    top5Idx,
        top10pct:   top10Idx,
        top20pct:   top20Idx,
        bottom20pct: totalUsers - bottom20Idx,
        avgFeedbackCount: Math.round(totalFeedback / totalUsers),
        distribution: [
          { tier: "top_1",    label: "상위 1%",  count: top1Idx,                         color: "#f59e0b" },
          { tier: "top_5",    label: "상위 5%",  count: top5Idx - top1Idx,               color: "#3b82f6" },
          { tier: "top_10",   label: "상위 10%", count: top10Idx - top5Idx,              color: "#10b981" },
          { tier: "top_20",   label: "상위 20%", count: top20Idx - top10Idx,             color: "#8b5cf6" },
          { tier: "normal",   label: "일반",     count: bottom20Idx - top20Idx,          color: "#6b7280" },
          { tier: "bottom_20",label: "하위 20%", count: totalUsers - bottom20Idx,        color: "#ef4444" },
        ],
      };
    }),

  /**
   * 현재 로그인 사용자의 랭킹 백분위
   */
  getUserRankPercentile: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { percentile: 100, rank: 1, totalUsers: 0, tier: "normal", tierName: "일반", feedbackCount: 0, missionCount: 0 };
      const userId = ctx.user!.id;

      // 전체 사용자 피드백 수 집계
      const allUsers = await db
        .select({
          userId: feedbackLogs.userId,
          feedbackCount: count(feedbackLogs.id),
        })
        .from(feedbackLogs)
        .groupBy(feedbackLogs.userId)
        .orderBy(desc(count(feedbackLogs.id)));

      const totalUsers = allUsers.length;
      if (totalUsers === 0) {
        return { percentile: 100, rank: 1, totalUsers: 0, tier: "normal", tierName: "일반", feedbackCount: 0 };
      }

      // 내 피드백 수
      const myEntry = allUsers.find(u => u.userId === userId);
      const myCount = myEntry ? Number(myEntry.feedbackCount) : 0;

      // 내 순위 (1-based)
      const myRank = allUsers.findIndex(u => u.userId === userId) + 1;
      const rank = myRank > 0 ? myRank : totalUsers;

      // 백분위 (낮을수록 상위)
      const percentile = Math.round((rank / totalUsers) * 100);
      const tier = getTierLabel(percentile);

      // 미션 완료 수도 추가
      const missionRows = await db
        .select({ cnt: count(missionCompletions.id) })
        .from(missionCompletions)
        .where(eq(missionCompletions.userId, String(userId)));
      const missionCount = Number(missionRows[0]?.cnt ?? 0);

      return {
        percentile,
        rank,
        totalUsers,
        tier,
        tierName: getTierDisplayName(tier),
        feedbackCount: myCount,
        missionCount,
      };
    }),

  /**
   * TOP 사용자 리더보드
   */
  getTopUsers: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      projectSlug: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const rows = await db
        .select({
          userId: feedbackLogs.userId,
          feedbackCount: count(feedbackLogs.id),
        })
        .from(feedbackLogs)
        .groupBy(feedbackLogs.userId)
        .orderBy(desc(count(feedbackLogs.id)))
        .limit(input.limit);

      const totalUsers = rows.length;

      return rows.map((row, idx) => {
        const rank = idx + 1;
        const percentile = totalUsers > 0 ? Math.round((rank / totalUsers) * 100) : 100;
        const tier = getTierLabel(percentile);
        return {
          rank,
          userId: String(row.userId),
          feedbackCount: Number(row.feedbackCount),
          tier,
          tierName: getTierDisplayName(tier),
          percentile,
        };
      });
    }),
});
