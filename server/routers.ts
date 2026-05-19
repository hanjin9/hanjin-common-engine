import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
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
  projects: router({
    glwaFranchise: glwaFranchiseRouter,
    glwaCommunity: glwaCommunityRouter,
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
  payment: paymentRouter,

  // 건강 AI 분석 라우터 (생체데이터 분석, 피드백, 관리자 현황)
  healthAi: healthAiRouter,

  // 미션 관리 라우터 (GLWA 10단계 × 단계별 미션 + 슬롯머신 + 즉석발송)
  mission: missionRouter,

  // 이벤트 관리 라우터 (캘린더 연동 + 즉석발송 + 미션 연동)
  event: eventRouter,
});

export type AppRouter = typeof appRouter;
