/**
 * Stripe 결제 API 라우터
 *
 * 한진 공통 엔진의 Stripe 결제 처리 API를 정의합니다.
 * - 결제 인텐트 생성/확인
 * - 구독 생성/취소/업그레이드
 * - 고객 관리
 * - 결제 이력 조회
 *
 * @author Hanjin Common Engine
 * @version 1.6.0
 */

import Stripe from "stripe";
import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../../_core/trpc";
import { getDb } from "../../db";

// Stripe 인스턴스 (최신 API 버전 - 런타임에서 생성)
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

/**
 * Stripe 결제 라우터
 */
export const stripeRouter = router({
  /**
   * 결제 인텐트 생성
   */
  createPaymentIntent: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        amount: z.number().positive(),
        currency: z.string().default("usd"),
        description: z.string().optional(),
        metadata: z.record(z.string(), z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const stripe = getStripe();
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(input.amount * 100),
          currency: input.currency.toLowerCase(),
          description: input.description,
          metadata: {
            projectId: input.projectId.toString(),
            userId: ctx.user.id.toString(),
            ...input.metadata,
          },
        });

        console.log(`[Stripe] Payment intent created: ${paymentIntent.id}`);

        return {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        };
      } catch (error) {
        console.error("[Stripe] Error creating payment intent:", error);
        throw error;
      }
    }),

  /**
   * 고객 생성 또는 조회
   */
  getOrCreateCustomer: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const stripe = getStripe();
      try {
        const existing = await stripe.customers.list({
          email: ctx.user.email ?? undefined,
          limit: 1,
        });

        if (existing.data.length > 0) {
          const c = existing.data[0];
          return { customerId: c.id, email: c.email };
        }

        const customer = await stripe.customers.create({
          email: ctx.user.email ?? undefined,
          name: ctx.user.name ?? undefined,
          metadata: {
            userId: ctx.user.id.toString(),
            projectId: input.projectId.toString(),
          },
        });

        return { customerId: customer.id, email: customer.email };
      } catch (error) {
        console.error("[Stripe] Error getting/creating customer:", error);
        throw error;
      }
    }),

  /**
   * 구독 생성
   */
  createSubscription: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        stripePriceId: z.string(),
        customerId: z.string(),
        trialDays: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const stripe = getStripe();
      try {
        const params: Stripe.SubscriptionCreateParams = {
          customer: input.customerId,
          items: [{ price: input.stripePriceId }],
          payment_behavior: "default_incomplete",
          payment_settings: {
            save_default_payment_method: "on_subscription",
          },
          expand: ["latest_invoice.payment_intent"],
          metadata: {
            userId: ctx.user.id.toString(),
            projectId: input.projectId.toString(),
          },
        };

        if (input.trialDays) {
          params.trial_period_days = input.trialDays;
        }

        const subscription = await stripe.subscriptions.create(params);
        const invoice = subscription.latest_invoice as Stripe.Invoice & { payment_intent?: Stripe.PaymentIntent | null };
        const pi = invoice?.payment_intent as Stripe.PaymentIntent | null;

        console.log(`[Stripe] Subscription created: ${subscription.id}`);

        return {
          subscriptionId: subscription.id,
          status: subscription.status,
          clientSecret: pi?.client_secret ?? null,
          currentPeriodStart: new Date(
            ((subscription as any).current_period_start as number) * 1000
          ),
          currentPeriodEnd: new Date(
            ((subscription as any).current_period_end as number) * 1000
          ),
        };
      } catch (error) {
        console.error("[Stripe] Error creating subscription:", error);
        throw error;
      }
    }),

  /**
   * 구독 취소
   */
  cancelSubscription: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
        immediately: z.boolean().default(false),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const stripe = getStripe();
      try {
        let subscription: Stripe.Subscription;

        if (input.immediately) {
          subscription = await stripe.subscriptions.cancel(input.subscriptionId);
        } else {
          subscription = await stripe.subscriptions.update(input.subscriptionId, {
            cancel_at_period_end: true,
            metadata: { cancellationReason: input.reason ?? "User requested" },
          });
        }

        console.log(`[Stripe] Subscription canceled: ${input.subscriptionId}`);

        return {
          success: true,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        };
      } catch (error) {
        console.error("[Stripe] Error canceling subscription:", error);
        throw error;
      }
    }),

  /**
   * 구독 업그레이드/다운그레이드
   */
  upgradeSubscription: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
        newPriceId: z.string(),
        prorationBehavior: z
          .enum(["create_prorations", "none"])
          .default("create_prorations"),
      })
    )
    .mutation(async ({ input }) => {
      const stripe = getStripe();
      try {
        const subscription = await stripe.subscriptions.retrieve(
          input.subscriptionId
        );
        const itemId = subscription.items.data[0]?.id;
        if (!itemId) throw new Error("Subscription item not found");

        const updated = await stripe.subscriptions.update(input.subscriptionId, {
          items: [{ id: itemId, price: input.newPriceId }],
          proration_behavior: input.prorationBehavior,
        });

        console.log(
          `[Stripe] Subscription upgraded: ${input.subscriptionId} → ${input.newPriceId}`
        );

        return { success: true, status: updated.status };
      } catch (error) {
        console.error("[Stripe] Error upgrading subscription:", error);
        throw error;
      }
    }),

  /**
   * 구독 조회
   */
  getSubscription: protectedProcedure
    .input(z.object({ subscriptionId: z.string() }))
    .query(async ({ input }) => {
      const stripe = getStripe();
      try {
        const subscription = await stripe.subscriptions.retrieve(
          input.subscriptionId
        );

        return {
          id: subscription.id,
          status: subscription.status,
          currentPeriodStart: new Date(
            ((subscription as any).current_period_start as number) * 1000
          ),
          currentPeriodEnd: new Date(
            ((subscription as any).current_period_end as number) * 1000
          ),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          items: subscription.items.data.map((item) => ({
            id: item.id,
            priceId: item.price.id,
            quantity: item.quantity,
          })),
        };
      } catch (error) {
        console.error("[Stripe] Error getting subscription:", error);
        throw error;
      }
    }),

  /**
   * 청구서 목록 조회
   */
  getInvoices: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const stripe = getStripe();
      try {
        const invoices = await stripe.invoices.list({
          customer: input.customerId,
          limit: input.limit,
        });

        return invoices.data.map((invoice) => ({
          id: invoice.id,
          number: invoice.number,
          amount: (invoice.amount_due ?? 0) / 100,
          status: invoice.status,
          dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
          paidAt: invoice.status_transitions?.paid_at
            ? new Date(invoice.status_transitions.paid_at * 1000)
            : null,
          invoiceUrl: invoice.hosted_invoice_url,
          invoicePdf: invoice.invoice_pdf,
        }));
      } catch (error) {
        console.error("[Stripe] Error getting invoices:", error);
        throw error;
      }
    }),

  /**
   * 결제 방법 저장
   */
  savePaymentMethod: protectedProcedure
    .input(
      z.object({
        paymentMethodId: z.string(),
        customerId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const stripe = getStripe();
      try {
        await stripe.paymentMethods.attach(input.paymentMethodId, {
          customer: input.customerId,
        });

        await stripe.customers.update(input.customerId, {
          invoice_settings: {
            default_payment_method: input.paymentMethodId,
          },
        });

        console.log(
          `[Stripe] Payment method saved: ${input.paymentMethodId}`
        );

        return { success: true };
      } catch (error) {
        console.error("[Stripe] Error saving payment method:", error);
        throw error;
      }
    }),

  /**
   * 환불 처리 (관리자만)
   */
  refundPayment: adminProcedure
    .input(
      z.object({
        paymentIntentId: z.string(),
        amount: z.number().optional(),
        reason: z
          .enum(["duplicate", "fraudulent", "requested_by_customer"])
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const stripe = getStripe();
      try {
        const refundData: Stripe.RefundCreateParams = {
          payment_intent: input.paymentIntentId,
        };
        if (input.amount) refundData.amount = Math.round(input.amount * 100);
        if (input.reason) refundData.reason = input.reason;

        const refund = await stripe.refunds.create(refundData);

        console.log(`[Stripe] Refund created: ${refund.id}`);

        return {
          success: true,
          refundId: refund.id,
          amount: (refund.amount ?? 0) / 100,
          status: refund.status,
        };
      } catch (error) {
        console.error("[Stripe] Error refunding payment:", error);
        throw error;
      }
    }),

  /**
   * 고객 정보 조회
   */
  getCustomer: protectedProcedure
    .input(z.object({ customerId: z.string() }))
    .query(async ({ input }) => {
      const stripe = getStripe();
      try {
        const customer = await stripe.customers.retrieve(input.customerId);

        if ((customer as any).deleted) return null;

        const c = customer as Stripe.Customer;
        return {
          id: c.id,
          email: c.email,
          name: c.name,
          phone: c.phone,
          address: c.address,
        };
      } catch (error) {
        console.error("[Stripe] Error getting customer:", error);
        throw error;
      }
    }),

  /**
   * 상품 및 가격 목록 조회 (관리자)
   */
  getProducts: adminProcedure.query(async () => {
    const stripe = getStripe();
    try {
      const [products, prices] = await Promise.all([
        stripe.products.list({ active: true }),
        stripe.prices.list({ active: true }),
      ]);

      return products.data.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        prices: prices.data
          .filter((price) => price.product === product.id)
          .map((price) => ({
            id: price.id,
            amount: (price.unit_amount ?? 0) / 100,
            currency: price.currency,
            interval: price.recurring?.interval,
          })),
      }));
    } catch (error) {
      console.error("[Stripe] Error getting products:", error);
      throw error;
    }
  }),
});
