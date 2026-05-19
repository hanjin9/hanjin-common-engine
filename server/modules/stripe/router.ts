/**
 * Stripe 결제 API 라우터
 * 
 * 한진 공통 엔진의 Stripe 결제 API를 정의합니다.
 * 
 * @author Hanjin Common Engine
 * @version 1.0.0
 */

import { router, publicProcedure, protectedProcedure, adminProcedure } from "../../_core/trpc";
import { z } from "zod";
import Stripe from "stripe";
import { getDb } from "../../db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-04-10",
});

/**
 * Stripe 라우터
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
        currency: z.string().default("USD"),
        description: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(input.amount * 100), // Stripe uses cents
          currency: input.currency.toLowerCase(),
          description: input.description,
          metadata: {
            projectId: input.projectId.toString(),
            userId: ctx.user?.id.toString(),
            ...input.metadata,
          },
        });

        console.log(
          `[Stripe] Payment intent created: ${paymentIntent.id} (${input.amount} ${input.currency})`
        );

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
   * 구독 생성
   */
  createSubscription: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        planId: z.number(),
        stripePriceId: z.string(),
        paymentMethodId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        // 고객 생성 또는 조회
        let customerId = ctx.user?.stripeCustomerId;

        if (!customerId) {
          const customer = await stripe.customers.create({
            email: ctx.user?.email,
            metadata: {
              userId: ctx.user?.id.toString(),
              projectId: input.projectId.toString(),
            },
          });

          customerId = customer.id;

          // 실제 구현에서는 users 테이블 업데이트
          // await db.update(users)
          //   .set({ stripeCustomerId: customerId })
          //   .where(eq(users.id, ctx.user.id));
        }

        // 구독 생성
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [
            {
              price: input.stripePriceId,
            },
          ],
          payment_behavior: "default_incomplete",
          expand: ["latest_invoice.payment_intent"],
        });

        console.log(
          `[Stripe] Subscription created: ${subscription.id} (${input.stripePriceId})`
        );

        return {
          subscriptionId: subscription.id,
          clientSecret:
            (subscription.latest_invoice as any)?.payment_intent?.client_secret ||
            null,
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
        cancellationReason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const subscription = await stripe.subscriptions.update(
          input.subscriptionId,
          {
            metadata: {
              cancellationReason: input.cancellationReason || "User requested",
              canceledAt: new Date().toISOString(),
            },
          }
        );

        // 즉시 취소
        const canceled = await stripe.subscriptions.del(input.subscriptionId);

        console.log(`[Stripe] Subscription canceled: ${input.subscriptionId}`);

        return { success: true };
      } catch (error) {
        console.error("[Stripe] Error canceling subscription:", error);
        throw error;
      }
    }),

  /**
   * 구독 업그레이드
   */
  upgradeSubscription: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
        newPriceId: z.string(),
        prorationBehavior: z.enum(["create_prorations", "none"]).default("create_prorations"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          input.subscriptionId
        );

        const updated = await stripe.subscriptions.update(
          input.subscriptionId,
          {
            items: [
              {
                id: subscription.items.data[0].id,
                price: input.newPriceId,
              },
            ],
            proration_behavior: input.prorationBehavior,
          }
        );

        console.log(
          `[Stripe] Subscription upgraded: ${input.subscriptionId} to ${input.newPriceId}`
        );

        return { success: true };
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
      try {
        const subscription = await stripe.subscriptions.retrieve(
          input.subscriptionId
        );

        return {
          id: subscription.id,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
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
   * 결제 기록 조회
   */
  getPaymentHistory: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        limit: z.number().default(10),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // 실제 구현에서는 payments 테이블에서 조회
        return [];
      } catch (error) {
        console.error("[Stripe] Error getting payment history:", error);
        throw error;
      }
    }),

  /**
   * 청구서 조회
   */
  getInvoices: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      try {
        const invoices = await stripe.invoices.list({
          customer: input.customerId,
          limit: input.limit,
        });

        return invoices.data.map((invoice) => ({
          id: invoice.id,
          number: invoice.number,
          amount: invoice.amount_due / 100,
          status: invoice.status,
          dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
          paidAt: invoice.paid_at ? new Date(invoice.paid_at * 1000) : null,
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
        customerId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // 고객 생성 또는 조회
        let customerId = input.customerId;

        if (!customerId) {
          const customer = await stripe.customers.create({
            email: ctx.user?.email,
          });

          customerId = customer.id;
        }

        // 결제 방법을 고객에게 연결
        await stripe.paymentMethods.attach(input.paymentMethodId, {
          customer: customerId,
        });

        // 기본 결제 방법으로 설정
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: input.paymentMethodId,
          },
        });

        console.log(
          `[Stripe] Payment method saved: ${input.paymentMethodId} for customer ${customerId}`
        );

        return { success: true, customerId };
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
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: input.paymentIntentId,
          amount: input.amount ? Math.round(input.amount * 100) : undefined,
          reason: (input.reason as any) || "requested_by_customer",
        });

        console.log(`[Stripe] Refund created: ${refund.id}`);

        return { success: true, refundId: refund.id };
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
      try {
        const customer = await stripe.customers.retrieve(input.customerId);

        return {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
        };
      } catch (error) {
        console.error("[Stripe] Error getting customer:", error);
        throw error;
      }
    }),
});
