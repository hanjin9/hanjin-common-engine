/**
 * Operator Monitoring Router (운영자 모니터링 라우터)
 * 중앙 관리자 대시보드 - 운영자 모니터링 기능
 */

import { router, protectedProcedure, adminProcedure } from '../../_core/trpc';
import { operatorMonitoring, tieredProgress } from '../../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '../../db';

export const operatorRouter = router({
  /**
   * 운영자용: 모든 실시간 알림 조회
   */
  getAlerts: adminProcedure
    .input(
      z.object({
        severity: z.enum(['low', 'medium', 'high']).optional(),
        resolved: z.boolean().optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const conditions: ReturnType<typeof eq>[] = [];
      if (input.severity) {
        conditions.push(eq(operatorMonitoring.severity, input.severity));
      }
      if (input.resolved !== undefined) {
        conditions.push(eq(operatorMonitoring.resolved, input.resolved));
      }

      const alerts = await db
        .select()
        .from(operatorMonitoring)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(operatorMonitoring.createdAt))
        .limit(input.limit);

      return alerts;
    }),

  /**
   * 운영자용: 특정 사용자의 진행도 조회
   */
  getUserProgress: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const progress = await db
        .select()
        .from(tieredProgress)
        .where(eq(tieredProgress.userId, input.userId));

      return progress[0] || null;
    }),

  /**
   * 운영자용: 모든 사용자의 진행도 조회 (대시보드용)
   */
  getAllUserProgress: adminProcedure
    .input(
      z.object({
        limit: z.number().default(100),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const progress = await db
        .select()
        .from(tieredProgress)
        .orderBy(desc(tieredProgress.lastUpdated))
        .limit(input.limit)
        .offset(input.offset);

      return progress;
    }),

  /**
   * 운영자용: 알림 해결 표시
   */
  resolveAlert: adminProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db
        .update(operatorMonitoring)
        .set({
          resolved: true,
          resolvedBy: ctx.user.id,
          resolvedAt: new Date(),
        })
        .where(eq(operatorMonitoring.id, input.alertId));

      return { success: true };
    }),

  /**
   * 운영자용: 사용자에게 피드백 메시지 전송
   */
  sendFeedback: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        title: z.string(),
        message: z.string(),
        type: z.enum(['warning', 'info', 'recommendation']),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db.insert(operatorMonitoring).values({
        userId: input.userId,
        alertType: input.type,
        title: input.title,
        message: input.message,
        severity: input.type === 'warning' ? 'high' : input.type === 'info' ? 'low' : 'medium',
        actionRequired: input.type === 'warning',
        resolved: false,
      });

      return { success: true };
    }),

  /**
   * 운영자용: 대시보드 통계
   */
  getDashboardStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const totalUsers = await db.select().from(tieredProgress);
    const highSeverityAlerts = await db
      .select()
      .from(operatorMonitoring)
      .where(
        and(
          eq(operatorMonitoring.severity, 'high'),
          eq(operatorMonitoring.resolved, false)
        )
      );

    const actionRequiredAlerts = await db
      .select()
      .from(operatorMonitoring)
      .where(
        and(
          eq(operatorMonitoring.actionRequired, true),
          eq(operatorMonitoring.resolved, false)
        )
      );

    const avgWellness =
      totalUsers.length > 0
        ? Math.round(
            totalUsers.reduce((sum, u) => sum + (u.overallWellness ?? 0), 0) / totalUsers.length
          )
        : 0;

    return {
      totalUsers: totalUsers.length,
      highSeverityAlerts: highSeverityAlerts.length,
      actionRequiredAlerts: actionRequiredAlerts.length,
      averageWellness: avgWellness,
    };
  }),
});

export default operatorRouter;
