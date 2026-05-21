import { router, protectedProcedure } from "../../_core/trpc";
import { z } from "zod";
import { getDb } from "../../db";
import { users } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const adminRouter = router({
  // 모든 사용자 조회
  getUsers: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "관리자 권한이 필요합니다." });
    }
    const db = await getDb();
    if (!db) return [];
    return await db.query.users.findMany();
  }),

  // 사용자 역할 변경
  updateUserRole: protectedProcedure
    .input(z.object({ userId: z.number(), role: z.enum(["admin", "user"]) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "관리자 권한이 필요합니다." });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "데이터베이스 연결 실패" });
      await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  // 시스템 통계
  getSystemStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "관리자 권한이 필요합니다." });
    }
    return {
      activeUsers: 234,
      totalRequests: 5678,
      errorRate: 0.5,
      avgResponseTime: 145,
    };
  }),

  // 분석 데이터
  getAnalytics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "관리자 권한이 필요합니다." });
    }
    return {
      totalMembers: 1234,
      monthlyRevenue: 5600000,
      activeRate: 68,
      avgScore: 78.5,
    };
  }),

  // 설정 업데이트
  updateSettings: protectedProcedure
    .input(
      z.object({
        appName: z.string(),
        appDescription: z.string(),
        maintenanceMode: z.boolean(),
        emailNotifications: z.boolean(),
        smsNotifications: z.boolean(),
        maxUploadSize: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "관리자 권한이 필요합니다." });
      }
      // 설정 저장 로직 (실제 구현 필요)
      return { success: true };
    }),
});
