/**
 * AI 피드백 엔진 tRPC 라우터
 * 모든 AI 기능을 tRPC 엔드포인트로 노출
 */

import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { orchestrate } from "./neuralOrchestrator";
import {
  saveBiodataRecord,
  startSleepSession,
  endSleepSession,
  getActiveSleepSession,
  getHealthPlatformConnections,
  updateHealthPlatformConnection,
} from "./biometricCollector";
import {
  getOrCreateFeedbackProfile,
  getTodayBiodataSnapshot,
  getRecentFeedbackHistory,
} from "./feedbackEngine";
import { getDb } from "../../db";
import { dailyMissions, feedbackLogs, sleepSessions, biodataRecords } from "../../../drizzle/schema";
import { eq, and, desc, gte } from "drizzle-orm";

export const aiRouter = router({
  // ─── 오케스트레이터 (메인 진입점) ─────────────────────────────────────────
  process: protectedProcedure
    .input(
      z.object({
        eventType: z.enum([
          "activity_complete",
          "breathing_sample",
          "voice_sample",
          "sleep_start",
          "sleep_end",
          "daily_checkin",
          "mission_complete",
          "chat_message",
        ]),
        projectId: z.number().optional(),
        data: z
          .object({
            activityType: z.string().optional(),
            duration: z.number().optional(),
            completionRate: z.number().optional(),
            score: z.number().optional(),
            frequencyData: z.array(z.number()).optional(),
            sampleDuration: z.number().optional(),
            amplitudeData: z.array(z.number()).optional(),
            frequencySpectrum: z.array(z.number()).optional(),
            message: z.string().optional(),
            movementCount: z.number().optional(),
          })
          .optional(),
        language: z.enum(["ko", "en", "ja", "zh", "es"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return orchestrate({
        userId: ctx.user.id,
        projectId: input.projectId,
        eventType: input.eventType,
        data: input.data,
        language: input.language ?? "ko",
      });
    }),

  // ─── 생체 데이터 저장 ──────────────────────────────────────────────────────
  saveBiometricData: protectedProcedure
    .input(
      z.object({
        eventType: z.enum(["breathing_sample", "voice_sample"]),
        projectId: z.number().optional(),
        data: z.object({
          frequencyData: z.array(z.number()).optional(),
          sampleDuration: z.number().optional(),
          amplitudeData: z.array(z.number()).optional(),
          frequencySpectrum: z.array(z.number()).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return orchestrate({
        userId: ctx.user.id,
        projectId: input.projectId,
        eventType: input.eventType,
        data: input.data,
        language: "ko",
      });
    }),

  // ─── 수면 세션 시작 ────────────────────────────────────────────────────────
  startSleepSession: protectedProcedure
    .input(
      z.object({
        sleepStart: z.string(),
        detectionMethod: z
          .enum(["accelerometer", "microphone", "both", "manual"])
          .optional(),
        projectId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const sessionId = await startSleepSession({
        userId: ctx.user.id,
        projectId: input.projectId,
        sleepStart: new Date(input.sleepStart),
        detectionMethod: input.detectionMethod ?? "manual",
      });
      return { sessionId, success: true };
    }),

  // ─── 수면 세션 종료 ────────────────────────────────────────────────────────
  endSleepSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        sleepEnd: z.string(),
        avgBreathingRate: z.number().optional(),
        breathingRegularity: z.number().optional(),
        snoringDetected: z.boolean().optional(),
        snoringMinutes: z.number().optional(),
        movementCount: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await endSleepSession(input.sessionId, {
        userId: ctx.user.id,
        sleepEnd: new Date(input.sleepEnd),
        avgBreathingRate: input.avgBreathingRate,
        breathingRegularity: input.breathingRegularity,
        snoringDetected: input.snoringDetected,
        snoringMinutes: input.snoringMinutes,
        movementCount: input.movementCount,
      });
      return { success: true };
    }),

  // ─── 활성 수면 세션 조회 ───────────────────────────────────────────────────
  getActiveSleepSession: protectedProcedure.query(async ({ ctx }) => {
    return getActiveSleepSession(ctx.user.id);
  }),

  // ─── 오늘의 생체 데이터 스냅샷 ────────────────────────────────────────────
  getTodaySnapshot: protectedProcedure
    .input(z.object({ projectId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      return getTodayBiodataSnapshot(ctx.user.id);
    }),

  // ─── 오늘의 미션 목록 ──────────────────────────────────────────────────────
  getTodayMissions: protectedProcedure
    .input(z.object({ projectId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
  if (!db) throw new Error("[DB] Database not available");
      const today = new Date().toISOString().split("T")[0];
      return db
        .select()
        .from(dailyMissions)
        .where(
          and(
            eq(dailyMissions.userId, ctx.user.id),
            eq(dailyMissions.missionDate, today)
          )
        )
        .orderBy(desc(dailyMissions.createdAt));
    }),

  // ─── 미션 완료 처리 ────────────────────────────────────────────────────────
  completeMission: protectedProcedure
    .input(
      z.object({
        missionId: z.number(),
        projectId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
  if (!db) throw new Error("[DB] Database not available");
      await db
        .update(dailyMissions)
        .set({
          status: "completed",
          completedAt: new Date(),
        })
        .where(
          and(
            eq(dailyMissions.id, input.missionId),
            eq(dailyMissions.userId, ctx.user.id)
          )
        );

      return orchestrate({
        userId: ctx.user.id,
        projectId: input.projectId,
        eventType: "mission_complete",
        language: "ko",
      });
    }),

  // ─── 피드백 히스토리 ───────────────────────────────────────────────────────
  getFeedbackHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        projectId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
  if (!db) throw new Error("[DB] Database not available");
      return db
        .select()
        .from(feedbackLogs)
        .where(eq(feedbackLogs.userId, ctx.user.id))
        .orderBy(desc(feedbackLogs.createdAt))
        .limit(input.limit);
    }),

  // ─── 수면 히스토리 ─────────────────────────────────────────────────────────
  getSleepHistory: protectedProcedure
    .input(z.object({ days: z.number().min(1).max(90).default(7) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
  if (!db) throw new Error("[DB] Database not available");
      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
      return db
        .select()
        .from(sleepSessions)
        .where(
          and(
            eq(sleepSessions.userId, ctx.user.id),
            gte(sleepSessions.sleepStart, since)
          )
        )
        .orderBy(desc(sleepSessions.sleepStart));
    }),

  // ─── 피드백 프로필 조회 ────────────────────────────────────────────────────
  getFeedbackProfile: protectedProcedure
    .input(z.object({ projectId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      return getOrCreateFeedbackProfile(ctx.user.id, input.projectId);
    }),

  // ─── 헬스 플랫폼 연동 설정 ────────────────────────────────────────────────
  getHealthConnections: protectedProcedure.query(async ({ ctx }) => {
    return getHealthPlatformConnections(ctx.user.id);
  }),

  updateHealthConnection: protectedProcedure
    .input(
      z.object({
        platform: z.enum([
          "google_fit",
          "apple_health",
          "samsung_health",
          "garmin",
          "fitbit",
        ]),
        status: z.enum(["connected", "disconnected", "pending"]),
        syncDataTypes: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await updateHealthPlatformConnection(
        ctx.user.id,
        input.platform,
        input.status,
        input.syncDataTypes
      );
      return { success: true };
    }),

  // ─── 일일 체크인 ───────────────────────────────────────────────────────────
  dailyCheckin: protectedProcedure
    .input(
      z.object({
        projectId: z.number().optional(),
        language: z.enum(["ko", "en", "ja", "zh", "es"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return orchestrate({
        userId: ctx.user.id,
        projectId: input.projectId,
        eventType: "daily_checkin",
        language: input.language ?? "ko",
      });
    }),

  // ─── AI 채팅 ───────────────────────────────────────────────────────────────
  chat: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(1000),
        projectId: z.number().optional(),
        language: z.enum(["ko", "en", "ja", "zh", "es"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return orchestrate({
        userId: ctx.user.id,
        projectId: input.projectId,
        eventType: "chat_message",
        data: { message: input.message },
        language: input.language ?? "ko",
      });
    }),

  // ─── 생체 데이터 히스토리 ──────────────────────────────────────────────────
  getBiodataHistory: protectedProcedure
    .input(
      z.object({
        dataType: z.string().optional(),
        days: z.number().min(1).max(90).default(7),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
  if (!db) throw new Error("[DB] Database not available");
      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

      const conditions = [
        eq(biodataRecords.userId, ctx.user.id),
        gte(biodataRecords.measuredAt, since),
      ];

      if (input.dataType) {
        conditions.push(eq(biodataRecords.dataType, input.dataType as any));
      }

      return db
        .select()
        .from(biodataRecords)
        .where(and(...conditions))
        .orderBy(desc(biodataRecords.measuredAt))
        .limit(200);
    }),
});
