import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { glwaFranchiseRouter } from "./modules/projects/glwa-franchise";
import { glwaCommunityRouter } from "./modules/projects/glwa-community";
import { membershipRouter } from "./modules/wellness/membershipRouter";
import { operatorRouter } from "./modules/wellness/operatorRouter";
import { tierRouter } from "./modules/wellness/tierRouter";

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
});

export type AppRouter = typeof appRouter;
