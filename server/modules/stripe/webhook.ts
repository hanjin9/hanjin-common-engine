/**
 * Stripe Webhook 엔드포인트
 * 
 * 한진 공통 엔진의 Stripe 웹훅 처리 시스템을 구현합니다.
 * - 결제 성공/실패 처리
 * - 구독 생성/취소 처리
 * - 청구서 생성 처리
 * - 웹훅 서명 검증
 * 
 * @author Hanjin Common Engine
 * @version 1.0.0
 */

import Stripe from "stripe";
import { getDb } from "../../db";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

/**
 * Stripe 웹훅 서명 검증
 * 
 * @param body 요청 본문
 * @param signature 서명
 * @returns 검증된 이벤트 또는 null
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): Stripe.Event | null {
  const stripe = getStripe();
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );

    console.log(`[Stripe Webhook] Event verified: ${event.type}`);
    return event;
  } catch (error) {
    console.error("[Stripe Webhook] Signature verification failed:", error);
    return null;
  }
}

/**
 * 결제 성공 처리
 * 
 * @param event Stripe 이벤트
 */
export async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const db = await getDb();
  if (!db) {
    console.warn("[Stripe Webhook] Database not available");
    return;
  }

  try {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    console.log(
      `[Stripe Webhook] Payment succeeded: ${paymentIntent.id} (${paymentIntent.amount})`
    );

    // 실제 구현에서는 payments 테이블 업데이트
    // await db.update(payments)
    //   .set({ status: "succeeded" })
    //   .where(eq(payments.stripePaymentIntentId, paymentIntent.id));

    // 사용자에게 결제 완료 이메일 발송
    // await sendPaymentConfirmationEmail(...)

    return { success: true };
  } catch (error) {
    console.error("[Stripe Webhook] Error handling payment succeeded:", error);
    throw error;
  }
}

/**
 * 결제 실패 처리
 * 
 * @param event Stripe 이벤트
 */
export async function handlePaymentIntentFailed(event: Stripe.Event) {
  const db = await getDb();
  if (!db) {
    console.warn("[Stripe Webhook] Database not available");
    return;
  }

  try {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    console.log(
      `[Stripe Webhook] Payment failed: ${paymentIntent.id} - ${paymentIntent.last_payment_error?.message}`
    );

    // 실제 구현에서는 payments 테이블 업데이트
    // await db.update(payments)
    //   .set({
    //     status: "failed",
    //     failureReason: paymentIntent.last_payment_error?.message,
    //     failureCode: paymentIntent.last_payment_error?.code,
    //   })
    //   .where(eq(payments.stripePaymentIntentId, paymentIntent.id));

    // 사용자에게 결제 실패 이메일 발송
    // await sendPaymentFailureEmail(...)

    return { success: true };
  } catch (error) {
    console.error("[Stripe Webhook] Error handling payment failed:", error);
    throw error;
  }
}

/**
 * 구독 생성 처리
 * 
 * @param event Stripe 이벤트
 */
export async function handleCustomerSubscriptionCreated(event: Stripe.Event) {
  const db = await getDb();
  if (!db) {
    console.warn("[Stripe Webhook] Database not available");
    return;
  }

  try {
    const subscription = event.data.object as Stripe.Subscription;

    console.log(
      `[Stripe Webhook] Subscription created: ${subscription.id} (${subscription.customer})`
    );

    // 실제 구현에서는 subscriptions 테이블에 삽입
    // await db.insert(subscriptions).values({
    //   stripeSubscriptionId: subscription.id,
    //   stripeCustomerId: subscription.customer as string,
    //   status: subscription.status,
    //   currentPeriodStart: new Date(subscription.current_period_start * 1000),
    //   currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    // });

    // 사용자에게 구독 시작 이메일 발송
    // await sendSubscriptionCreatedEmail(...)

    return { success: true };
  } catch (error) {
    console.error(
      "[Stripe Webhook] Error handling subscription created:",
      error
    );
    throw error;
  }
}

/**
 * 구독 업데이트 처리
 * 
 * @param event Stripe 이벤트
 */
export async function handleCustomerSubscriptionUpdated(event: Stripe.Event) {
  const db = await getDb();
  if (!db) {
    console.warn("[Stripe Webhook] Database not available");
    return;
  }

  try {
    const subscription = event.data.object as Stripe.Subscription;

    console.log(
      `[Stripe Webhook] Subscription updated: ${subscription.id} (${subscription.status})`
    );

    // 실제 구현에서는 subscriptions 테이블 업데이트
    // await db.update(subscriptions)
    //   .set({
    //     status: subscription.status,
    //     currentPeriodStart: new Date(subscription.current_period_start * 1000),
    //     currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    //   })
    //   .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

    return { success: true };
  } catch (error) {
    console.error(
      "[Stripe Webhook] Error handling subscription updated:",
      error
    );
    throw error;
  }
}

/**
 * 구독 삭제 처리
 * 
 * @param event Stripe 이벤트
 */
export async function handleCustomerSubscriptionDeleted(event: Stripe.Event) {
  const db = await getDb();
  if (!db) {
    console.warn("[Stripe Webhook] Database not available");
    return;
  }

  try {
    const subscription = event.data.object as Stripe.Subscription;

    console.log(
      `[Stripe Webhook] Subscription deleted: ${subscription.id}`
    );

    // 실제 구현에서는 subscriptions 테이블 업데이트
    // await db.update(subscriptions)
    //   .set({
    //     status: "canceled",
    //     canceledAt: new Date(),
    //   })
    //   .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

    // 사용자에게 구독 취소 확인 이메일 발송
    // await sendSubscriptionCanceledEmail(...)

    return { success: true };
  } catch (error) {
    console.error(
      "[Stripe Webhook] Error handling subscription deleted:",
      error
    );
    throw error;
  }
}

/**
 * 청구서 생성 처리
 * 
 * @param event Stripe 이벤트
 */
export async function handleInvoiceCreated(event: Stripe.Event) {
  const db = await getDb();
  if (!db) {
    console.warn("[Stripe Webhook] Database not available");
    return;
  }

  try {
    const invoice = event.data.object as Stripe.Invoice;

    console.log(
      `[Stripe Webhook] Invoice created: ${invoice.id} (${invoice.amount_due})`
    );

    // 실제 구현에서는 invoices 테이블에 삽입
    // await db.insert(invoices).values({
    //   stripeInvoiceId: invoice.id,
    //   stripeCustomerId: invoice.customer as string,
    //   amount: invoice.amount_due,
    //   status: invoice.status,
    // });

    return { success: true };
  } catch (error) {
    console.error("[Stripe Webhook] Error handling invoice created:", error);
    throw error;
  }
}

/**
 * 청구서 결제 성공 처리
 * 
 * @param event Stripe 이벤트
 */
export async function handleInvoicePaid(event: Stripe.Event) {
  const db = await getDb();
  if (!db) {
    console.warn("[Stripe Webhook] Database not available");
    return;
  }

  try {
    const invoice = event.data.object as Stripe.Invoice;

    console.log(
      `[Stripe Webhook] Invoice paid: ${invoice.id} (${invoice.amount_paid})`
    );

    // 실제 구현에서는 invoices 테이블 업데이트
    // await db.update(invoices)
    //   .set({ status: "paid" })
    //   .where(eq(invoices.stripeInvoiceId, invoice.id));

    // 사용자에게 청구서 결제 완료 이메일 발송
    // await sendInvoicePaidEmail(...)

    return { success: true };
  } catch (error) {
    console.error("[Stripe Webhook] Error handling invoice paid:", error);
    throw error;
  }
}

/**
 * 청구서 결제 실패 처리
 * 
 * @param event Stripe 이벤트
 */
export async function handleInvoicePaymentFailed(event: Stripe.Event) {
  const db = await getDb();
  if (!db) {
    console.warn("[Stripe Webhook] Database not available");
    return;
  }

  try {
    const invoice = event.data.object as Stripe.Invoice;

    console.log(
      `[Stripe Webhook] Invoice payment failed: ${invoice.id}`
    );

    // 실제 구현에서는 invoices 테이블 업데이트
    // await db.update(invoices)
    //   .set({ status: "failed" })
    //   .where(eq(invoices.stripeInvoiceId, invoice.id));

    // 사용자에게 청구서 결제 실패 이메일 발송
    // await sendInvoicePaymentFailedEmail(...)

    return { success: true };
  } catch (error) {
    console.error(
      "[Stripe Webhook] Error handling invoice payment failed:",
      error
    );
    throw error;
  }
}

/**
 * 고객 생성 처리
 * 
 * @param event Stripe 이벤트
 */
export async function handleCustomerCreated(event: Stripe.Event) {
  const db = await getDb();
  if (!db) {
    console.warn("[Stripe Webhook] Database not available");
    return;
  }

  try {
    const customer = event.data.object as Stripe.Customer;

    console.log(
      `[Stripe Webhook] Customer created: ${customer.id} (${customer.email})`
    );

    // 실제 구현에서는 users 테이블에 Stripe 고객 ID 저장
    // await db.update(users)
    //   .set({ stripeCustomerId: customer.id })
    //   .where(eq(users.email, customer.email));

    return { success: true };
  } catch (error) {
    console.error("[Stripe Webhook] Error handling customer created:", error);
    throw error;
  }
}

/**
 * 웹훅 이벤트 라우터
 * 
 * @param event Stripe 이벤트
 */
export async function handleWebhookEvent(event: Stripe.Event) {
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        return await handlePaymentIntentSucceeded(event);

      case "payment_intent.payment_failed":
        return await handlePaymentIntentFailed(event);

      case "customer.subscription.created":
        return await handleCustomerSubscriptionCreated(event);

      case "customer.subscription.updated":
        return await handleCustomerSubscriptionUpdated(event);

      case "customer.subscription.deleted":
        return await handleCustomerSubscriptionDeleted(event);

      case "invoice.created":
        return await handleInvoiceCreated(event);

      case "invoice.paid":
        return await handleInvoicePaid(event);

      case "invoice.payment_failed":
        return await handleInvoicePaymentFailed(event);

      case "customer.created":
        return await handleCustomerCreated(event);

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        return { success: true };
    }
  } catch (error) {
    console.error("[Stripe Webhook] Error handling event:", error);
    throw error;
  }
}
