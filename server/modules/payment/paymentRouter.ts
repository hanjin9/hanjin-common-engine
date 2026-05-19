/**
 * 결제/정산 관리자 tRPC 라우터
 * 
 * 기능:
 * - 입금 명단 조회 (프로젝트별, 기간별)
 * - 환불 처리 + 이력
 * - 구독 갱신 현황
 * - 금액 정산 요약
 * - CSV 내보내기 데이터
 * - Stripe 체크아웃 세션 생성
 */
import Stripe from "stripe";
import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../../_core/trpc";
import { getDb } from "../../db";
import { stripePayments, stripeSubscriptions, users } from "../../../drizzle/schema";
import { eq, and, gte, lte, desc, sql, count, sum } from "drizzle-orm";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

// 날짜 범위 필터 헬퍼
function getDateRange(period: "today" | "week" | "month" | "all") {
  const now = new Date();
  const start = new Date();
  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start.setDate(now.getDate() - 7);
      break;
    case "month":
      start.setDate(now.getDate() - 30);
      break;
    case "all":
      return null;
  }
  return start;
}

export const paymentRouter = router({
  // ─── 입금 명단 조회 ──────────────────────────────────────────────────────
  getPaymentList: adminProcedure
    .input(z.object({
      period: z.enum(["today", "week", "month", "all"]).default("month"),
      projectSlug: z.string().optional(),
      status: z.enum(["succeeded", "pending", "failed", "refunded", "all"]).default("all"),
      page: z.number().default(1),
      pageSize: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { items: [], total: 0, summary: null };

      const conditions: any[] = [];
      const dateFrom = getDateRange(input.period);
      if (dateFrom) conditions.push(gte(stripePayments.createdAt, dateFrom));
      if (input.projectSlug) conditions.push(eq(stripePayments.projectSlug, input.projectSlug));
      if (input.status !== "all") conditions.push(eq(stripePayments.status, input.status as any));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, totalRows] = await Promise.all([
        db.select({
          id: stripePayments.id,
          userId: stripePayments.userId,
          projectSlug: stripePayments.projectSlug,
          stripePaymentIntentId: stripePayments.stripePaymentIntentId,
          stripeInvoiceId: stripePayments.stripeInvoiceId,
          amountKrw: stripePayments.amountKrw,
          currency: stripePayments.currency,
          status: stripePayments.status,
          description: stripePayments.description,
          createdAt: stripePayments.createdAt,
          // 사용자 이름 조인
          userName: users.name,
          userEmail: users.email,
        })
          .from(stripePayments)
          .leftJoin(users, eq(stripePayments.userId, users.openId))
          .where(whereClause)
          .orderBy(desc(stripePayments.createdAt))
          .limit(input.pageSize)
          .offset((input.page - 1) * input.pageSize),
        db.select({ count: count() })
          .from(stripePayments)
          .where(whereClause),
      ]);

      // 정산 요약
      const summaryRows = await db.select({
        totalAmount: sum(stripePayments.amountKrw),
        succeededCount: count(),
      })
        .from(stripePayments)
        .where(whereClause ? and(whereClause, eq(stripePayments.status, "succeeded")) : eq(stripePayments.status, "succeeded"));

      const refundRows = await db.select({
        refundAmount: sum(stripePayments.amountKrw),
        refundCount: count(),
      })
        .from(stripePayments)
        .where(whereClause ? and(whereClause, eq(stripePayments.status, "refunded")) : eq(stripePayments.status, "refunded"));

      return {
        items,
        total: totalRows[0]?.count ?? 0,
        summary: {
          totalAmount: Number(summaryRows[0]?.totalAmount ?? 0),
          succeededCount: Number(summaryRows[0]?.succeededCount ?? 0),
          refundAmount: Number(refundRows[0]?.refundAmount ?? 0),
          refundCount: Number(refundRows[0]?.refundCount ?? 0),
          netAmount: Number(summaryRows[0]?.totalAmount ?? 0) - Number(refundRows[0]?.refundAmount ?? 0),
        },
      };
    }),

  // ─── 구독 현황 조회 ──────────────────────────────────────────────────────
  getSubscriptionList: adminProcedure
    .input(z.object({
      period: z.enum(["today", "week", "month", "all"]).default("month"),
      projectSlug: z.string().optional(),
      status: z.enum(["active", "canceled", "past_due", "trialing", "incomplete", "all"]).default("all"),
      page: z.number().default(1),
      pageSize: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { items: [], total: 0 };

      const conditions: any[] = [];
      const dateFrom = getDateRange(input.period);
      if (dateFrom) conditions.push(gte(stripeSubscriptions.createdAt, dateFrom));
      if (input.projectSlug) conditions.push(eq(stripeSubscriptions.projectSlug, input.projectSlug));
      if (input.status !== "all") conditions.push(eq(stripeSubscriptions.status, input.status as any));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, totalRows] = await Promise.all([
        db.select({
          id: stripeSubscriptions.id,
          userId: stripeSubscriptions.userId,
          projectSlug: stripeSubscriptions.projectSlug,
          stripeSubscriptionId: stripeSubscriptions.stripeSubscriptionId,
          status: stripeSubscriptions.status,
          tierKey: stripeSubscriptions.tierKey,
          currentPeriodStart: stripeSubscriptions.currentPeriodStart,
          currentPeriodEnd: stripeSubscriptions.currentPeriodEnd,
          createdAt: stripeSubscriptions.createdAt,
          userName: users.name,
          userEmail: users.email,
        })
          .from(stripeSubscriptions)
          .leftJoin(users, eq(stripeSubscriptions.userId, users.openId))
          .where(whereClause)
          .orderBy(desc(stripeSubscriptions.createdAt))
          .limit(input.pageSize)
          .offset((input.page - 1) * input.pageSize),
        db.select({ count: count() })
          .from(stripeSubscriptions)
          .where(whereClause),
      ]);

      return { items, total: totalRows[0]?.count ?? 0 };
    }),

  // ─── 환불 처리 (관리자) ──────────────────────────────────────────────────
  refundPayment: adminProcedure
    .input(z.object({
      paymentId: z.number(),
      reason: z.enum(["duplicate", "fraudulent", "requested_by_customer"]).optional(),
      amount: z.number().optional(), // 부분 환불 금액 (원)
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const stripe = getStripe();

      // DB에서 결제 정보 조회
      const [payment] = await db.select()
        .from(stripePayments)
        .where(eq(stripePayments.id, input.paymentId))
        .limit(1);

      if (!payment) throw new Error("결제 정보를 찾을 수 없습니다.");
      if (!payment.stripePaymentIntentId) throw new Error("Stripe Payment Intent ID가 없습니다.");

      // Stripe 환불 처리
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: payment.stripePaymentIntentId,
      };
      if (input.amount) refundParams.amount = input.amount; // 원화 단위 (KRW는 최소 단위가 1원)
      if (input.reason) refundParams.reason = input.reason;

      const refund = await stripe.refunds.create(refundParams);

      // DB 상태 업데이트
      await db.update(stripePayments)
        .set({ status: "refunded" })
        .where(eq(stripePayments.id, input.paymentId));

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status,
      };
    }),

  // ─── 구독 취소 (관리자) ──────────────────────────────────────────────────
  cancelSubscription: adminProcedure
    .input(z.object({
      subscriptionId: z.number(),
      cancelAtPeriodEnd: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const stripe = getStripe();

      const [sub] = await db.select()
        .from(stripeSubscriptions)
        .where(eq(stripeSubscriptions.id, input.subscriptionId))
        .limit(1);

      if (!sub?.stripeSubscriptionId) throw new Error("구독 정보를 찾을 수 없습니다.");

      if (input.cancelAtPeriodEnd) {
        await stripe.subscriptions.update(sub.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      } else {
        await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
        await db.update(stripeSubscriptions)
          .set({ status: "canceled", updatedAt: new Date() })
          .where(eq(stripeSubscriptions.id, input.subscriptionId));
      }

      return { success: true };
    }),

  // ─── 정산 요약 (KPI) ─────────────────────────────────────────────────────
  getSettlementSummary: adminProcedure
    .input(z.object({
      period: z.enum(["today", "week", "month", "all"]).default("month"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const dateFrom = getDateRange(input.period);
      const cond = dateFrom ? gte(stripePayments.createdAt, dateFrom) : undefined;

      const [succeeded, refunded, failed, activeSubCount] = await Promise.all([
        db.select({ total: sum(stripePayments.amountKrw), cnt: count() })
          .from(stripePayments)
          .where(cond ? and(cond, eq(stripePayments.status, "succeeded")) : eq(stripePayments.status, "succeeded")),
        db.select({ total: sum(stripePayments.amountKrw), cnt: count() })
          .from(stripePayments)
          .where(cond ? and(cond, eq(stripePayments.status, "refunded")) : eq(stripePayments.status, "refunded")),
        db.select({ cnt: count() })
          .from(stripePayments)
          .where(cond ? and(cond, eq(stripePayments.status, "failed")) : eq(stripePayments.status, "failed")),
        db.select({ cnt: count() })
          .from(stripeSubscriptions)
          .where(eq(stripeSubscriptions.status, "active")),
      ]);

      const totalIn = Number(succeeded[0]?.total ?? 0);
      const totalRefund = Number(refunded[0]?.total ?? 0);

      return {
        totalRevenue: totalIn,
        totalRefund,
        netRevenue: totalIn - totalRefund,
        succeededCount: Number(succeeded[0]?.cnt ?? 0),
        refundCount: Number(refunded[0]?.cnt ?? 0),
        failedCount: Number(failed[0]?.cnt ?? 0),
        activeSubscriptions: Number(activeSubCount[0]?.cnt ?? 0),
      };
    }),

  // ─── CSV 내보내기 데이터 ─────────────────────────────────────────────────
  exportPaymentsCsv: adminProcedure
    .input(z.object({
      period: z.enum(["today", "week", "month", "all"]).default("month"),
      projectSlug: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { rows: [] };

      const conditions: any[] = [];
      const dateFrom = getDateRange(input.period);
      if (dateFrom) conditions.push(gte(stripePayments.createdAt, dateFrom));
      if (input.projectSlug) conditions.push(eq(stripePayments.projectSlug, input.projectSlug));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await db.select({
        id: stripePayments.id,
        userId: stripePayments.userId,
        userName: users.name,
        userEmail: users.email,
        projectSlug: stripePayments.projectSlug,
        amountKrw: stripePayments.amountKrw,
        status: stripePayments.status,
        description: stripePayments.description,
        stripePaymentIntentId: stripePayments.stripePaymentIntentId,
        createdAt: stripePayments.createdAt,
      })
        .from(stripePayments)
        .leftJoin(users, eq(stripePayments.userId, users.openId))
        .where(whereClause)
        .orderBy(desc(stripePayments.createdAt))
        .limit(5000);

      return { rows };
    }),

  // ─── 체크아웃 세션 생성 (사용자용) ──────────────────────────────────────
  createCheckoutSession: protectedProcedure
    .input(z.object({
      projectSlug: z.string(),
      tierKey: z.string(),
      tierName: z.string(),
      amountKrw: z.number().positive(),
      mode: z.enum(["subscription", "payment"]).default("subscription"),
    }))
    .mutation(async ({ input, ctx }) => {
      const stripe = getStripe();
      const origin = (ctx.req.headers.origin as string) || "http://localhost:3000";

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "krw",
            product_data: {
              name: input.tierName,
              description: `${input.projectSlug.toUpperCase()} ${input.tierName} 멤버십`,
            },
            unit_amount: input.amountKrw,
            ...(input.mode === "subscription" ? {
              recurring: { interval: "year", interval_count: 1 },
            } : {}),
          },
          quantity: 1,
        }],
        mode: input.mode,
        success_url: `${origin}/admin/payment?session_id={CHECKOUT_SESSION_ID}&status=success`,
        cancel_url: `${origin}/admin/payment?status=cancel`,
        customer_email: ctx.user.email ?? undefined,
        client_reference_id: ctx.user.openId,
        metadata: {
          user_id: ctx.user.openId,
          project_slug: input.projectSlug,
          tier_key: input.tierKey,
        },
        allow_promotion_codes: true,
      });

      return { checkoutUrl: session.url, sessionId: session.id };
    }),

  // ─── 프로젝트별 수익 차트 데이터 ────────────────────────────────────────
  getRevenueChart: adminProcedure
    .input(z.object({
      period: z.enum(["week", "month"]).default("month"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { data: [] };

      const days = input.period === "week" ? 7 : 30;
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);

      const rows = await db.select({
        projectSlug: stripePayments.projectSlug,
        date: sql<string>`DATE(${stripePayments.createdAt})`,
        total: sum(stripePayments.amountKrw),
        count: count(),
      })
        .from(stripePayments)
        .where(and(
          gte(stripePayments.createdAt, dateFrom),
          eq(stripePayments.status, "succeeded")
        ))
        .groupBy(stripePayments.projectSlug, sql`DATE(${stripePayments.createdAt})`)
        .orderBy(sql`DATE(${stripePayments.createdAt})`);

      return { data: rows };
    }),
});
