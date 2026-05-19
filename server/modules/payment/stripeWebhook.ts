/**
 * Stripe 웹훅 핸들러
 * jangbu-quantum-assoc + hanjin-common-engine 통합 버전
 *
 * 처리 이벤트:
 * - checkout.session.completed → 결제 완료, DB 저장
 * - customer.subscription.updated → 구독 상태 업데이트
 * - customer.subscription.deleted → 구독 취소
 * - invoice.payment_succeeded → 청구서 결제 완료 (갱신)
 * - invoice.payment_failed → 결제 실패
 * - payment_intent.succeeded → 단건 결제 완료
 */
import type { Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "../../db";
import { stripePayments, stripeSubscriptions } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

export async function handleStripeWebhook(req: Request, res: Response) {
  const stripe = getStripe();
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }

  // ✅ 테스트 이벤트 처리 (필수)
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Stripe Webhook] Processing event: ${event.type} (${event.id})`);

  try {
    const db = await getDb();

    switch (event.type) {
      // ─── 결제 완료 (체크아웃 세션) ────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.user_id || "";
        const projectSlug = session.metadata?.project_slug || "glwa";
        const tierKey = session.metadata?.tier_key || "";

        if (db && userId) {
          // 결제 이력 저장
          await db.insert(stripePayments).values({
            userId,
            projectSlug,
            stripePaymentIntentId: typeof session.payment_intent === "string"
              ? session.payment_intent
              : undefined,
            amountKrw: session.amount_total ? Math.round(session.amount_total) : undefined,
            currency: session.currency || "krw",
            status: "succeeded",
            description: `${projectSlug} 멤버십 결제 완료`,
          });

          // 구독 정보 저장 (구독 모드인 경우)
          if (session.subscription) {
            const subId = typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;

            const existing = await db.select()
              .from(stripeSubscriptions)
              .where(eq(stripeSubscriptions.stripeSubscriptionId, subId))
              .limit(1);

            if (existing.length === 0) {
              await db.insert(stripeSubscriptions).values({
                userId,
                projectSlug,
                stripeCustomerId: typeof session.customer === "string"
                  ? session.customer
                  : undefined,
                stripeSubscriptionId: subId,
                status: "active",
                tierKey,
              });
            }
          }
        }

        console.log(`[Stripe Webhook] ✓ Checkout completed: ${session.id} | user: ${userId}`);
        break;
      }

      // ─── 구독 업데이트 ────────────────────────────────────────────────────
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        if (db) {
          await db.update(stripeSubscriptions)
            .set({
              status: subscription.status as any,
              currentPeriodStart: subscription.items?.data[0] ? new Date((subscription.items.data[0] as any).current_period?.start * 1000 || Date.now()) : new Date(),
              currentPeriodEnd: subscription.items?.data[0] ? new Date((subscription.items.data[0] as any).current_period?.end * 1000 || Date.now()) : new Date(),
              updatedAt: new Date(),
            })
            .where(eq(stripeSubscriptions.stripeSubscriptionId, subscription.id));
        }

        console.log(`[Stripe Webhook] ✓ Subscription updated: ${subscription.id}`);
        break;
      }

      // ─── 구독 취소 ────────────────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        if (db) {
          await db.update(stripeSubscriptions)
            .set({ status: "canceled", updatedAt: new Date() })
            .where(eq(stripeSubscriptions.stripeSubscriptionId, subscription.id));
        }

        console.log(`[Stripe Webhook] ✓ Subscription canceled: ${subscription.id}`);
        break;
      }

      // ─── 청구서 결제 완료 (구독 갱신) ────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : "";

        if (db && customerId) {
          // 구독 정보에서 userId 조회
          const subRecords = await db.select()
            .from(stripeSubscriptions)
            .where(eq(stripeSubscriptions.stripeCustomerId, customerId))
            .limit(1);

          const userId = subRecords[0]?.userId || "";
          const projectSlug = subRecords[0]?.projectSlug || "glwa";

          if (userId) {
            await db.insert(stripePayments).values({
              userId,
              projectSlug,
              stripeInvoiceId: invoice.id,
              amountKrw: invoice.amount_paid ? Math.round(invoice.amount_paid) : undefined,
              currency: invoice.currency || "krw",
              status: "succeeded",
              description: `구독 갱신 결제`,
            });
          }
        }

        console.log(`[Stripe Webhook] ✓ Invoice paid: ${invoice.id}`);
        break;
      }

      // ─── 결제 실패 ────────────────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : "";

        if (db && customerId) {
          const subRecords = await db.select()
            .from(stripeSubscriptions)
            .where(eq(stripeSubscriptions.stripeCustomerId, customerId))
            .limit(1);

          const userId = subRecords[0]?.userId || "";
          const projectSlug = subRecords[0]?.projectSlug || "glwa";

          if (userId) {
            await db.insert(stripePayments).values({
              userId,
              projectSlug,
              stripeInvoiceId: invoice.id,
              amountKrw: invoice.amount_due ? Math.round(invoice.amount_due) : undefined,
              currency: invoice.currency || "krw",
              status: "failed",
              description: `결제 실패 - ${invoice.last_finalization_error?.message || "카드 오류"}`,
            });

            // 구독 상태를 past_due로 업데이트
            const invoiceSub = (invoice as any).subscription;
            if (invoiceSub) {
              const subId = typeof invoiceSub === "string"
                ? invoiceSub
                : (invoiceSub?.id || "");
              if (subId) {
                await db.update(stripeSubscriptions)
                  .set({ status: "past_due", updatedAt: new Date() })
                  .where(eq(stripeSubscriptions.stripeSubscriptionId, subId));
              }
            }
          }
        }

        console.log(`[Stripe Webhook] ⚠ Invoice payment failed: ${invoice.id}`);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("[Stripe Webhook] Processing error:", err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}
