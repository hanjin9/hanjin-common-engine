import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { getDb } from "../../db";
import {
  communityPosts,
  communityComments,
  communityLikes,
  teamChallenges,
  teamChallengeParticipants,
  badges,
  userBadges,
  users,
  tieredProgress,
} from "../../../drizzle/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";

export const communityRouter = router({
  // 커뮤니티 게시글 목록
  getPosts: protectedProcedure
    .input(
      z.object({
        postType: z.enum(["workout_cert", "achievement", "tip", "question", "general"]).optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const conditions = [eq(communityPosts.isPublic, true)];
      if (input.postType) conditions.push(eq(communityPosts.postType, input.postType));

      return await (await getDb())!
        .select()
        .from(communityPosts)
        .where(and(...conditions))
        .orderBy(desc(communityPosts.isPinned), desc(communityPosts.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  // 게시글 작성
  createPost: protectedProcedure
    .input(
      z.object({
        postType: z.enum(["workout_cert", "achievement", "tip", "question", "general"]).default("general"),
        content: z.string().min(1).max(2000),
        imageUrls: z.array(z.string()).optional(),
        projectId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [post] = await (await getDb())!
        .insert(communityPosts)
        .values({
          userId: ctx.user.id,
          postType: input.postType,
          content: input.content,
          imageUrls: input.imageUrls,
          projectId: input.projectId,
        })
        .$returningId();
      return post;
    }),

  // 좋아요 토글
  toggleLike: protectedProcedure
    .input(
      z.object({
        targetType: z.enum(["post", "comment"]),
        targetId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await (await getDb())!
        .select()
        .from(communityLikes)
        .where(
          and(
            eq(communityLikes.userId, ctx.user.id),
            eq(communityLikes.targetType, input.targetType),
            eq(communityLikes.targetId, input.targetId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await (await getDb())!
          .delete(communityLikes)
          .where(eq(communityLikes.id, existing[0].id));

        if (input.targetType === "post") {
          await (await getDb())!
            .update(communityPosts)
            .set({ likeCount: sql`${communityPosts.likeCount} - 1` })
            .where(eq(communityPosts.id, input.targetId));
        }
        return { liked: false };
      } else {
        await (await getDb())!.insert(communityLikes).values({
          userId: ctx.user.id,
          targetType: input.targetType,
          targetId: input.targetId,
        });

        if (input.targetType === "post") {
          await (await getDb())!
            .update(communityPosts)
            .set({ likeCount: sql`${communityPosts.likeCount} + 1` })
            .where(eq(communityPosts.id, input.targetId));
        }
        return { liked: true };
      }
    }),

  // 댓글 조회
  getComments: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ input }) => {
      return await (await getDb())!
        .select()
        .from(communityComments)
        .where(eq(communityComments.postId, input.postId))
        .orderBy(communityComments.createdAt);
    }),

  // 댓글 작성
  addComment: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        content: z.string().min(1).max(500),
        parentId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [comment] = await (await getDb())!
        .insert(communityComments)
        .values({
          postId: input.postId,
          userId: ctx.user.id,
          content: input.content,
          parentId: input.parentId,
        })
        .$returningId();

      await (await getDb())!
        .update(communityPosts)
        .set({ commentCount: sql`${communityPosts.commentCount} + 1` })
        .where(eq(communityPosts.id, input.postId));

      return comment;
    }),

  // 팀 챌린지 목록
  getChallenges: protectedProcedure
    .input(
      z.object({
        status: z.enum(["upcoming", "active", "completed", "cancelled"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const conditions = [];
      if (input.status) conditions.push(eq(teamChallenges.status, input.status));

      return await (await getDb())!
        .select()
        .from(teamChallenges)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(teamChallenges.createdAt));
    }),

  // 챌린지 참가
  joinChallenge: protectedProcedure
    .input(
      z.object({
        challengeId: z.number(),
        teamName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [participant] = await (await getDb())!
        .insert(teamChallengeParticipants)
        .values({
          challengeId: input.challengeId,
          userId: ctx.user.id,
          teamName: input.teamName,
        })
        .$returningId();
      return participant;
    }),

  // 배지 목록
  getBadges: protectedProcedure.query(async () => {
    return await (await getDb())!
      .select()
      .from(badges)
      .where(eq(badges.isActive, true))
      .orderBy(badges.category);
  }),

  // 사용자 획득 배지
  getUserBadges: protectedProcedure.query(async ({ ctx }) => {
    return await (await getDb())!
      .select({
        userBadge: userBadges,
        badge: badges,
      })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, ctx.user.id))
      .orderBy(desc(userBadges.earnedAt));
  }),

  // 글로벌 리더보드 (상위 50명)
  getLeaderboard: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input }) => {
      return await (await getDb())!
        .select({
          userId: tieredProgress.userId,
          totalScore: tieredProgress.overallWellness,
          currentTier: tieredProgress.currentStage,
          streakDays: tieredProgress.daysCompleted,
        })
        .from(tieredProgress)
        .orderBy(desc(tieredProgress.overallWellness))
        .limit(input.limit);
    }),

  // 챌린지 생성 (관리자)
  createChallenge: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        projectId: z.number().optional(),
        missionId: z.number().optional(),
        maxTeamSize: z.number().default(5),
        targetValue: z.number(),
        startDate: z.date(),
        endDate: z.date(),
        rewardPoints: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const [challenge] = await (await getDb())!
        .insert(teamChallenges)
        .values({
          ...input,
          status: "upcoming",
        })
        .$returningId();
      return challenge;
    }),
});
