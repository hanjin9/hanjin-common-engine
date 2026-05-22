import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { getDb } from "../../db";
import {
  wearableConnections,
  realtimeBioData,
  exerciseSessions,
} from "../../../drizzle/schema";
import { eq, desc, and, gte } from "drizzle-orm";

export const wearableRouter = router({
  // 연동된 기기 목록 조회
  getConnections: protectedProcedure.query(async ({ ctx }) => {
    return await (await getDb())!
      .select()
      .from(wearableConnections)
      .where(eq(wearableConnections.userId, ctx.user.id))
      .orderBy(desc(wearableConnections.createdAt));
  }),

  // 기기 연동 추가
  addConnection: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["apple_watch", "galaxy_watch", "fitbit", "garmin", "polar", "whoop"]),
        deviceId: z.string().optional(),
        deviceName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [connection] = await (await getDb())!
        .insert(wearableConnections)
        .values({
          userId: ctx.user.id,
          platform: input.platform,
          deviceId: input.deviceId,
          deviceName: input.deviceName,
          isActive: true,
        })
        .$returningId();
      return connection;
    }),

  // 기기 연동 해제
  removeConnection: protectedProcedure
    .input(z.object({ connectionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await (await getDb())!
        .update(wearableConnections)
        .set({ isActive: false })
        .where(
          and(
            eq(wearableConnections.id, input.connectionId),
            eq(wearableConnections.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  // 실시간 바이오 데이터 조회 (최근 24시간)
  getBioData: protectedProcedure
    .input(z.object({ hours: z.number().default(24) }))
    .query(async ({ ctx, input }) => {
      const since = new Date(Date.now() - input.hours * 60 * 60 * 1000);
      return await (await getDb())!
        .select()
        .from(realtimeBioData)
        .where(
          and(
            eq(realtimeBioData.userId, ctx.user.id),
            gte(realtimeBioData.measuredAt, since)
          )
        )
        .orderBy(desc(realtimeBioData.measuredAt))
        .limit(100);
    }),

  // 바이오 데이터 기록
  recordBioData: protectedProcedure
    .input(
      z.object({
        heartRate: z.number().optional(),
        bloodOxygen: z.string().optional(),
        bloodPressureSystolic: z.number().optional(),
        bloodPressureDiastolic: z.number().optional(),
        stressLevel: z.number().min(0).max(100).optional(),
        caloriesBurned: z.number().optional(),
        steps: z.number().optional(),
        activeMinutes: z.number().optional(),
        wearableConnectionId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [record] = await (await getDb())!
        .insert(realtimeBioData)
        .values({
          userId: ctx.user.id,
          ...input,
        })
        .$returningId();
      return record;
    }),

  // 운동 세션 목록
  getExerciseSessions: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      return await (await getDb())!
        .select()
        .from(exerciseSessions)
        .where(eq(exerciseSessions.userId, ctx.user.id))
        .orderBy(desc(exerciseSessions.startedAt))
        .limit(input.limit);
    }),

  // 운동 세션 기록
  recordExerciseSession: protectedProcedure
    .input(
      z.object({
        activityType: z.enum(["walking", "running", "cycling", "swimming", "yoga", "strength", "hiit", "other"]),
        startedAt: z.date(),
        endedAt: z.date().optional(),
        durationMinutes: z.number().optional(),
        caloriesBurned: z.number().optional(),
        distanceMeters: z.string().optional(),
        avgHeartRate: z.number().optional(),
        maxHeartRate: z.number().optional(),
        isAutoDetected: z.boolean().default(false),
        source: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [session] = await (await getDb())!
        .insert(exerciseSessions)
        .values({
          userId: ctx.user.id,
          ...input,
        })
        .$returningId();
      return session;
    }),

  // 최신 바이오 데이터 요약 (대시보드용)
  getBioSummary: protectedProcedure.query(async ({ ctx }) => {
    const latest = await (await getDb())!
      .select()
      .from(realtimeBioData)
      .where(eq(realtimeBioData.userId, ctx.user.id))
      .orderBy(desc(realtimeBioData.measuredAt))
      .limit(1);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todaySessions = await (await getDb())!
      .select()
      .from(exerciseSessions)
      .where(
        and(
          eq(exerciseSessions.userId, ctx.user.id),
          gte(exerciseSessions.startedAt, todayStart)
        )
      );

    return {
      latestBio: latest[0] ?? null,
      todayExerciseCount: todaySessions.length,
      todayCalories: todaySessions.reduce((sum, s) => sum + (s.caloriesBurned ?? 0), 0),
      todaySteps: latest[0]?.steps ?? 0,
    };
  }),
});
