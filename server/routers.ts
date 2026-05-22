import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { glwaFranchiseRouter } from "./modules/projects/glwa-franchise";
import { glwaCommunityRouter } from "./modules/projects/glwa-community";
import { membershipRouter } from "./modules/wellness/membershipRouter";
import { operatorRouter } from "./modules/wellness/operatorRouter";
import { tierRouter } from "./modules/wellness/tierRouter";
import { aiRouter } from "./modules/ai/aiRouter";
import { projectMembershipRouter } from './modules/membership/projectMembershipFactory';
import copyRouter from './modules/copy/copyRouter';
import { sleepRouter } from './modules/sleep/sleepRouter';
import { paymentRouter } from './modules/payment/paymentRouter';
import { healthAiRouter } from './modules/health-ai/healthAiRouter';
import { missionRouter } from './modules/mission/missionRouter';
import { eventRouter } from './modules/event/eventRouter';
import { rankingRouter } from './modules/health-ai/rankingRouter';
import { schedulerRouter } from './modules/scheduler/schedulerRouter';
import { adminRouter } from './modules/admin/adminRouter';
import { wearableRouter } from './modules/wearable/wearableRouter';
import { feedbackAdvancedRouter } from './modules/feedbackAdvanced/feedbackAdvancedRouter';
import { communityRouter } from './modules/community/communityRouter';
import { analyticsRouter } from './modules/analytics/analyticsRouter';
import { paymentAdvancedRouter } from './modules/paymentAdvanced/paymentAdvancedRouter';
import { operationsRouter } from './modules/operations/operationsRouter';
import { globalRouter } from './modules/global/globalRouter';
import { googleFitRouter } from './modules/googleFit/googleFitRouter';
import { z } from 'zod';

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // 프로젝트 관리 라우터
  // ─── 🔵 PROJECT-SPECIFIC ────────────────────────────────────────────────
  projects: router({
    glwaFranchise: glwaFranchiseRouter,
    glwaCommunity: glwaCommunityRouter,
    list: protectedProcedure.query(async () => {
      return [
        { id: 1, name: 'GLWA 프랜차이즈', description: '프랜차이즈 관리 시스템', status: 'active' },
        { id: 2, name: 'GLWA 커뮤니티', description: '커뮤니티 협회 관리', status: 'active' },
        { id: 3, name: '웰니스 체크', description: '건강 체크 시스템', status: 'active' },
        { id: 4, name: '미션 시스템', description: '일일 미션 관리', status: 'active' },
        { id: 5, name: '이벤트 관리', description: '이벤트 캘린더', status: 'active' },
        { id: 6, name: '결제 시스템', description: '결제 및 정산', status: 'active' },
      ];
    }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(['active', 'inactive']) }))
      .mutation(async ({ input }) => {
        return { success: true, projectId: input.id, newStatus: input.status };
      }),
  }),

  // 웰니스/멤버십 관리 라우터 (glwa-wellness-app에서 이식)
  wellness: router({
    membership: membershipRouter,
    operator: operatorRouter,
    tier: tierRouter,
  }),

  // 프로젝트별 멤버십 분리 관리 라우터 (팩토리 패턴)
  projectMembership: projectMembershipRouter,

  // 멤버십 카피라이팅 문구 관리
  copy: copyRouter,

  // 수면 추적 라우터 (자동 체크 ON 기본값, 옵트아웃 지원)
  sleep: sleepRouter,

  // AI 피드백 엔진 라우터 (3단계 피드백 + 실시간 코칭 + 개인 메모리 + 생체 데이터)
  ai: aiRouter,

  // 결제/정산 관리자 라우터 (입금명단, 환불, 구독갱신, 정산, CSV)
  // ─── 🔴 CORE ────────────────────────────────────────────────────────────
  payment: paymentRouter,

  // 건강 AI 분석 라우터 (생체데이터 분석, 피드백, 관리자 현황)
  healthAi: healthAiRouter,

  // 미션 관리 라우터 (GLWA 10단계 × 단계별 미션 + 슬롯머신 + 즉석발송)
  // ─── 🟡 PLUGINS ─────────────────────────────────────────────────────────
  mission: missionRouter,

  // 이벤트 관리 라우터 (캘린더 연동 + 즉석발송 + 미션 연동)
  event: eventRouter,

  // % 랭킹 시스템 라우터 (top1%/5%/10%/20% 분포 + 개인 백분위)
  ranking: rankingRouter,

  // Heartbeat 스케줄러 관리 라우터 (일일 미션 발송 + 주간 리포트)
  scheduler: schedulerRouter,

  // 관리자 라우터 (사용자 관리, 시스템 통계, 설정)
  admin: adminRouter, // CORE

  // P1: 웨어러블 연동 라우터
  wearable: wearableRouter,

  // P2: AI 피드백 고도화 라우터
  feedbackAdvanced: feedbackAdvancedRouter,

  // P3: 커뮤니티 & 소셜 라우터
  community: communityRouter,

  // P4: 고급 분석 & 리포트 라우터
  analytics: analyticsRouter,

  // P5: 결제 고도화 라우터
  paymentAdvanced: paymentAdvancedRouter,

  // P6: 운영 자동화 라우터
  operations: operationsRouter,

  // P7: 글로벌 확장 라우터
  global: globalRouter,

  // Google Fit 연동 라우터
  googleFit: googleFitRouter,
});

export type AppRouter = typeof appRouter;
