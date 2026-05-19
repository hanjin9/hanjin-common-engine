/**
 * Stripe 결제 모듈
 * 
 * 한진 공통 엔진의 글로벌 결제 시스템을 Stripe를 통해 구현합니다.
 * - 고객 관리
 * - 상품 및 가격 관리
 * - 구독 생성/취소/업그레이드
 * - 결제 처리
 * - 웹훅 처리
 * 
 * @author Hanjin Common Engine
 * @version 1.0.0
 */

import Stripe from "stripe";

// Stripe 클라이언트 초기화
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
  typescript: true,
});

export default stripe;

/**
 * 고객 관리
 */
export const customers = {
  /**
   * 고객 생성
   * @param email 이메일
   * @param userId 사용자 ID
   * @param metadata 메타데이터
   */
  async create(
    email: string,
    userId: number,
    metadata?: Record<string, string>
  ) {
    return await stripe.customers.create({
      email,
      metadata: {
        userId: userId.toString(),
        ...metadata,
      },
    });
  },

  /**
   * 고객 조회
   * @param customerId 고객 ID
   */
  async retrieve(customerId: string) {
    return await stripe.customers.retrieve(customerId);
  },

  /**
   * 고객 업데이트
   * @param customerId 고객 ID
   * @param params 업데이트 파라미터
   */
  async update(customerId: string, params: Stripe.CustomerUpdateParams) {
    return await stripe.customers.update(customerId, params);
  },

  /**
   * 고객 삭제
   * @param customerId 고객 ID
   */
  async delete(customerId: string) {
    return await stripe.customers.del(customerId);
  },
};

/**
 * 상품 및 가격 관리
 */
export const products = {
  /**
   * 상품 생성
   * @param name 상품명
   * @param description 설명
   * @param metadata 메타데이터
   */
  async create(
    name: string,
    description?: string,
    metadata?: Record<string, string>
  ) {
    return await stripe.products.create({
      name,
      description,
      metadata,
    });
  },

  /**
   * 상품 조회
   * @param productId 상품 ID
   */
  async retrieve(productId: string) {
    return await stripe.products.retrieve(productId);
  },

  /**
   * 상품 목록
   */
  async list() {
    return await stripe.products.list({ limit: 100 });
  },
};

/**
 * 가격 관리
 */
export const prices = {
  /**
   * 가격 생성
   * @param productId 상품 ID
   * @param amount 금액 (센트 단위)
   * @param currency 통화
   * @param interval 청구 주기 (month, year)
   */
  async create(
    productId: string,
    amount: number,
    currency: string = "usd",
    interval: "month" | "year" = "month"
  ) {
    return await stripe.prices.create({
      product: productId,
      unit_amount: amount,
      currency,
      recurring: {
        interval,
      },
    });
  },

  /**
   * 가격 조회
   * @param priceId 가격 ID
   */
  async retrieve(priceId: string) {
    return await stripe.prices.retrieve(priceId);
  },

  /**
   * 상품의 가격 목록
   * @param productId 상품 ID
   */
  async listByProduct(productId: string) {
    return await stripe.prices.list({
      product: productId,
      limit: 100,
    });
  },
};

/**
 * 구독 관리
 */
export const subscriptions = {
  /**
   * 구독 생성
   * @param customerId 고객 ID
   * @param priceId 가격 ID
   * @param metadata 메타데이터
   */
  async create(
    customerId: string,
    priceId: string,
    metadata?: Record<string, string>
  ) {
    return await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata,
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });
  },

  /**
   * 구독 조회
   * @param subscriptionId 구독 ID
   */
  async retrieve(subscriptionId: string) {
    return await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["latest_invoice.payment_intent"],
    });
  },

  /**
   * 구독 목록
   * @param customerId 고객 ID
   */
  async listByCustomer(customerId: string) {
    return await stripe.subscriptions.list({
      customer: customerId,
      limit: 100,
    });
  },

  /**
   * 구독 업그레이드/다운그레이드
   * @param subscriptionId 구독 ID
   * @param newPriceId 새 가격 ID
   */
  async update(subscriptionId: string, newPriceId: string) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    return await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0]!.id,
          price: newPriceId,
        },
      ],
      proration_behavior: "create_prorations",
    });
  },

  /**
   * 구독 취소
   * @param subscriptionId 구독 ID
   * @param cancelAtPeriodEnd 청구 주기 끝에 취소 여부
   */
  async cancel(subscriptionId: string, cancelAtPeriodEnd: boolean = false) {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd,
    });
  },

  /**
   * 구독 삭제
   * @param subscriptionId 구독 ID
   */
  async delete(subscriptionId: string) {
    return await stripe.subscriptions.del(subscriptionId);
  },
};

/**
 * 결제 의도 관리
 */
export const paymentIntents = {
  /**
   * 결제 의도 생성
   * @param amount 금액 (센트 단위)
   * @param currency 통화
   * @param customerId 고객 ID
   * @param metadata 메타데이터
   */
  async create(
    amount: number,
    currency: string = "usd",
    customerId?: string,
    metadata?: Record<string, string>
  ) {
    return await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      metadata,
    });
  },

  /**
   * 결제 의도 조회
   * @param paymentIntentId 결제 의도 ID
   */
  async retrieve(paymentIntentId: string) {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  },

  /**
   * 결제 의도 확인
   * @param paymentIntentId 결제 의도 ID
   * @param clientSecret 클라이언트 시크릿
   */
  async confirm(paymentIntentId: string, clientSecret: string) {
    return await stripe.paymentIntents.confirm(paymentIntentId, {
      client_secret: clientSecret,
    });
  },
};

/**
 * 환불 관리
 */
export const refunds = {
  /**
   * 환불 생성
   * @param chargeId 결제 ID
   * @param amount 환불 금액 (선택사항)
   * @param reason 환불 사유
   */
  async create(
    chargeId: string,
    amount?: number,
    reason?: "duplicate" | "fraudulent" | "requested_by_customer"
  ) {
    return await stripe.refunds.create({
      charge: chargeId,
      amount,
      reason,
    });
  },

  /**
   * 환불 조회
   * @param refundId 환불 ID
   */
  async retrieve(refundId: string) {
    return await stripe.refunds.retrieve(refundId);
  },

  /**
   * 환불 목록
   */
  async list(limit: number = 100) {
    return await stripe.refunds.list({ limit });
  },
};

/**
 * 웹훅 처리
 */
export const webhooks = {
  /**
   * 웹훅 서명 검증
   * @param body 요청 본문
   * @param signature 서명
   */
  constructEvent(body: string | Buffer, signature: string) {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  },
};

/**
 * 청구서 관리
 */
export const invoices = {
  /**
   * 청구서 조회
   * @param invoiceId 청구서 ID
   */
  async retrieve(invoiceId: string) {
    return await stripe.invoices.retrieve(invoiceId);
  },

  /**
   * 고객의 청구서 목록
   * @param customerId 고객 ID
   */
  async listByCustomer(customerId: string) {
    return await stripe.invoices.list({
      customer: customerId,
      limit: 100,
    });
  },

  /**
   * 청구서 PDF 다운로드
   * @param invoiceId 청구서 ID
   */
  async getPdfUrl(invoiceId: string) {
    const invoice = await stripe.invoices.retrieve(invoiceId);
    return invoice.pdf;
  },
};

/**
 * 결제 기록 조회
 */
export const charges = {
  /**
   * 결제 조회
   * @param chargeId 결제 ID
   */
  async retrieve(chargeId: string) {
    return await stripe.charges.retrieve(chargeId);
  },

  /**
   * 고객의 결제 목록
   * @param customerId 고객 ID
   */
  async listByCustomer(customerId: string) {
    return await stripe.charges.list({
      customer: customerId,
      limit: 100,
    });
  },
};

export type StripeCustomer = Stripe.Customer;
export type StripeProduct = Stripe.Product;
export type StripePrice = Stripe.Price;
export type StripeSubscription = Stripe.Subscription;
export type StripePaymentIntent = Stripe.PaymentIntent;
export type StripeInvoice = Stripe.Invoice;
export type StripeCharge = Stripe.Charge;
export type StripeEvent = Stripe.Event;
