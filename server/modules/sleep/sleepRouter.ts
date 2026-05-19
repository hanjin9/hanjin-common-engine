/**
 * sleepRouter.ts — 수면 추적 tRPC 라우터
 * 작성자: HanJin
 *
 * 핵심 원칙:
 * - 기본값: autoTrackEnabled = true (자동 체크 ON)
 * - 사용자가 명시적으로 optOut 선택 시에만 비활성화
 * - 첫 접속 시 설정이 없으면 자동으로 기본 설정 생성 (ON 상태)
 */
import { z } from "zod";
import { protectedProcedure, router } from "../../_core/trpc";
import { getDb } from "../../db";
import { sleepTrackingSettings, sleepRecords } from "../../../drizzle/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

// ─── 헬퍼: 사용자 설정 조회 또는 기본값 생성 ─────────────────────────────
async function getOrCreateSleepSettings(userId: string): Promise<typeof sleepTrackingSettings.$inferSelect> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const existing = await db
    .select()
    .from(sleepTrackingSettings)
    .where(eq(sleepTrackingSettings.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // 최초 접속: 기본값(자동 ON)으로 설정 생성
  await db.insert(sleepTrackingSettings).values({
    userId,
    autoTrackEnabled: true,
    optedOut: false,
    sleepStartHour: 22,
    sleepEndHour: 8,
    minSleepMinutes: 30,
    notificationsEnabled: true,
  });

  const created = await db
    .select()
    .from(sleepTrackingSettings)
    .where(eq(sleepTrackingSettings.userId, userId))
    .limit(1);

  return created[0];
}

export const sleepRouter = router({
  // ─── 내 수면 추적 설정 조회 (없으면 기본값 ON으로 자동 생성) ──────────
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const settings = await getOrCreateSleepSettings(ctx.user.openId);
    return {
      ...settings,
      // 실제 추적 활성 상태: autoTrackEnabled=true AND optedOut=false
      isActivelyTracking: settings.autoTrackEnabled && !settings.optedOut,
    };
  }),

  // ─── 수면 추적 설정 업데이트 ──────────────────────────────────────────
  updateSettings: protectedProcedure
    .input(
      z.object({
        autoTrackEnabled: z.boolean().optional(),
        optedOut: z.boolean().optional(),
        sleepStartHour: z.number().min(0).max(23).optional(),
        sleepEndHour: z.number().min(0).max(23).optional(),
        minSleepMinutes: z.number().min(10).max(480).optional(),
        notificationsEnabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await getOrCreateSleepSettings(ctx.user.openId); // 없으면 생성

      const updateData: Partial<typeof sleepTrackingSettings.$inferInsert> = {};
      if (input.autoTrackEnabled !== undefined) updateData.autoTrackEnabled = input.autoTrackEnabled;
      if (input.notificationsEnabled !== undefined) updateData.notificationsEnabled = input.notificationsEnabled;
      if (input.sleepStartHour !== undefined) updateData.sleepStartHour = input.sleepStartHour;
      if (input.sleepEndHour !== undefined) updateData.sleepEndHour = input.sleepEndHour;
      if (input.minSleepMinutes !== undefined) updateData.minSleepMinutes = input.minSleepMinutes;

      // 옵트아웃 처리
      if (input.optedOut !== undefined) {
        updateData.optedOut = input.optedOut;
        updateData.optedOutAt = input.optedOut ? new Date() : null;
      }

      const db2 = await getDb();
      if (!db2) throw new Error("DB not available");
      await db2
        .update(sleepTrackingSettings)
        .set(updateData)
        .where(eq(sleepTrackingSettings.userId, ctx.user.openId));

      return { success: true, message: input.optedOut ? "수면 자동 체크를 비활성화했습니다." : "수면 추적 설정이 업데이트되었습니다." };
    }),

  // ─── 수면 자동 기록 (앱이 감지 후 호출) ──────────────────────────────
  recordAutoSleep: protectedProcedure
    .input(
      z.object({
        sleepStart: z.date(),
        sleepEnd: z.date().optional(),
        durationMinutes: z.number().optional(),
        qualityScore: z.number().min(1).max(10).optional(),
        dataSource: z.enum(["self", "apple_health", "samsung_health", "google_fit"]).default("self"),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const settings = await getOrCreateSleepSettings(ctx.user.openId);

      // 옵트아웃 상태이면 자동 기록 거부
      if (settings.optedOut || !settings.autoTrackEnabled) {
        return { success: false, message: "수면 자동 체크가 비활성화되어 있습니다." };
      }

      const durationMinutes = input.durationMinutes
        ?? (input.sleepEnd
          ? Math.round((input.sleepEnd.getTime() - input.sleepStart.getTime()) / 60000)
          : null);

      // 최소 수면 시간 미달 시 기록 안 함
      if (durationMinutes !== null && durationMinutes < settings.minSleepMinutes) {
        return { success: false, message: `최소 수면 시간(${settings.minSleepMinutes}분) 미달로 기록되지 않았습니다.` };
      }

      // 포인트 계산: 7시간 이상 = 50pt, 6시간 이상 = 30pt, 그 이하 = 10pt
      let pointsAwarded = 10;
      if (durationMinutes !== null) {
        if (durationMinutes >= 420) pointsAwarded = 50;
        else if (durationMinutes >= 360) pointsAwarded = 30;
      }

      const db3 = await getDb();
      if (!db3) throw new Error("DB not available");
      await db3.insert(sleepRecords).values({
        userId: ctx.user.openId,
        sleepStart: input.sleepStart,
        sleepEnd: input.sleepEnd ?? null,
        durationMinutes: durationMinutes ?? null,
        recordType: "auto",
        qualityScore: input.qualityScore ?? null,
        dataSource: input.dataSource,
        notes: input.notes ?? null,
        pointsAwarded,
      });

      // 마지막 자동 기록 시간 업데이트
      await db3
        .update(sleepTrackingSettings)
        .set({ lastAutoRecordedAt: new Date() })
        .where(eq(sleepTrackingSettings.userId, ctx.user.openId));

      return { success: true, pointsAwarded, message: `수면이 기록되었습니다. +${pointsAwarded}pt` };
    }),

  // ─── 수동 수면 기록 ───────────────────────────────────────────────────
  recordManualSleep: protectedProcedure
    .input(
      z.object({
        sleepStart: z.date(),
        sleepEnd: z.date(),
        qualityScore: z.number().min(1).max(10).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const durationMinutes = Math.round(
        (input.sleepEnd.getTime() - input.sleepStart.getTime()) / 60000
      );

      let pointsAwarded = 10;
      if (durationMinutes >= 420) pointsAwarded = 50;
      else if (durationMinutes >= 360) pointsAwarded = 30;

      const db4 = await getDb();
      if (!db4) throw new Error("DB not available");
      await db4.insert(sleepRecords).values({
        userId: ctx.user.openId,
        sleepStart: input.sleepStart,
        sleepEnd: input.sleepEnd,
        durationMinutes,
        recordType: "manual",
        qualityScore: input.qualityScore ?? null,
        dataSource: "self",
        notes: input.notes ?? null,
        pointsAwarded,
      });

      return { success: true, durationMinutes, pointsAwarded };
    }),

  // ─── 내 수면 기록 목록 조회 ───────────────────────────────────────────
  getMyRecords: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(30),
        offset: z.number().default(0),
        fromDate: z.date().optional(),
        toDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(sleepRecords.userId, ctx.user.openId)];
      if (input.fromDate) conditions.push(gte(sleepRecords.sleepStart, input.fromDate));
      if (input.toDate) conditions.push(lte(sleepRecords.sleepStart, input.toDate));

      const db5 = await getDb();
      if (!db5) return [];
      const records = await db5
        .select()
        .from(sleepRecords)
        .where(and(...conditions))
        .orderBy(desc(sleepRecords.sleepStart))
        .limit(input.limit)
        .offset(input.offset);

      return records;
    }),

  // ─── 수면 통계 요약 ───────────────────────────────────────────────────
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db6 = await getDb();
    if (!db6) return { totalRecords: 0, avgDurationMinutes: 0, avgDurationHours: "0.0", totalPoints: 0, avgQuality: null, recentRecords: [] };
    const records = await db6
      .select()
      .from(sleepRecords)
      .where(eq(sleepRecords.userId, ctx.user.openId))
      .orderBy(desc(sleepRecords.sleepStart))
      .limit(30);

    const totalRecords = records.length;
    const avgDuration =
      totalRecords > 0
        ? Math.round(
            records
              .filter((r) => r.durationMinutes !== null)
              .reduce((sum, r) => sum + (r.durationMinutes ?? 0), 0) /
              Math.max(records.filter((r) => r.durationMinutes !== null).length, 1)
          )
        : 0;

    const totalPoints = records.reduce((sum, r) => sum + (r.pointsAwarded ?? 0), 0);
    const avgQuality =
      records.filter((r) => r.qualityScore !== null).length > 0
        ? (
            records
              .filter((r) => r.qualityScore !== null)
              .reduce((sum, r) => sum + (r.qualityScore ?? 0), 0) /
            records.filter((r) => r.qualityScore !== null).length
          ).toFixed(1)
        : null;

    return {
      totalRecords,
      avgDurationMinutes: avgDuration,
      avgDurationHours: (avgDuration / 60).toFixed(1),
      totalPoints,
      avgQuality,
      recentRecords: records.slice(0, 7),
    };
  }),
});
