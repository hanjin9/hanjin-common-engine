/**
 * schedulerRouter.ts — Heartbeat 크론 관리 tRPC 라우터
 * - 일일 미션 발송 크론 등록
 * - 주간 리포트 크론 등록
 * - 등록된 크론 목록 조회
 */
import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import {
  createHeartbeatJob,
  listHeartbeatJobs,
  deleteHeartbeatJob,
} from "../../_core/heartbeat";
import { COOKIE_NAME } from "@shared/const";

// 쿠키에서 app_session_id 추출 헬퍼
function getSessionFromReq(req: any): string {
  const cookieHeader: string = req.headers?.cookie ?? "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export const schedulerRouter = router({
  /**
   * 일일 미션 발송 크론 등록 (매일 KST 10:00 = UTC 01:00)
   */
  setupDailyMissionCron: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userSession = getSessionFromReq(ctx.req);
      const result = await createHeartbeatJob(
        {
          name: "daily-mission-push",
          cron: "0 0 1 * * *",
          path: "/api/scheduled/daily-mission",
          method: "POST",
          payload: { source: "heartbeat" },
          description: "매일 오전 10시(KST) 미션 자동 발송",
        },
        userSession
      );
      return {
        taskUid: result.taskUid,
        nextExecutionAt: result.nextExecutionAt ?? null,
        message: "일일 미션 발송 크론 등록 완료",
      };
    }),

  /**
   * 주간 미션 리포트 크론 등록 (매주 월요일 KST 09:00 = UTC 00:00)
   */
  setupWeeklyReportCron: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userSession = getSessionFromReq(ctx.req);
      const result = await createHeartbeatJob(
        {
          name: "weekly-mission-report",
          cron: "0 0 0 * * 1",
          path: "/api/scheduled/weekly-mission-report",
          method: "POST",
          payload: { source: "heartbeat" },
          description: "매주 월요일 오전 9시(KST) 주간 미션 리포트",
        },
        userSession
      );
      return {
        taskUid: result.taskUid,
        nextExecutionAt: result.nextExecutionAt ?? null,
        message: "주간 리포트 크론 등록 완료",
      };
    }),

  /**
   * 등록된 크론 목록 조회
   */
  listCronJobs: protectedProcedure
    .query(async ({ ctx }) => {
      const userSession = getSessionFromReq(ctx.req);
      const result = await listHeartbeatJobs(userSession);
      return {
        total: result.total,
        jobs: result.jobs.map(j => ({
          taskUid: j.taskUid,
          name: j.name,
          description: j.description,
          cronExpression: j.cronExpression,
          callbackPath: j.callbackPath,
          isEnable: j.isEnable,
          lastExecutedAt: j.lastExecutedAt ?? null,
          nextExecutionAt: j.nextExecutionAt ?? null,
        })),
      };
    }),

  /**
   * 크론 삭제
   */
  deleteCronJob: protectedProcedure
    .input(z.object({ taskUid: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userSession = getSessionFromReq(ctx.req);
      await deleteHeartbeatJob(input.taskUid, userSession);
      return { success: true };
    }),
});
