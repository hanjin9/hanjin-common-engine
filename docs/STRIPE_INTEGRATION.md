# Stripe 글로벌 결제 모듈 통합 가이드

## 1. 개요

이 문서는 한진 공통 엔진에서 **Stripe API**를 활용하여 글로벌 결제(190개국), 구독 관리, 웹훅 처리를 구현하는 방법을 설명합니다.

### 핵심 기능
- **결제 처리**: 신용카드, 디지털 지갑 등 다양한 결제 수단 지원
- **구독 관리**: 월간/연간 구독 생성, 취소, 업그레이드
- **웹훅 처리**: Stripe 이벤트 실시간 처리 (charge.succeeded, subscription.updated 등)
- **환불 처리**: 부분/전액 환불 및 환불 취소
- **글로벌 지원**: 190개국 통화 및 세금 계산

---

## 2. Stripe 계정 설정

### 2.1 Stripe 계정 생성
1. [stripe.com](https://stripe.com)에서 계정 생성
2. 대시보드 → Settings → API Keys 확인
3. **Publishable Key** (공개) 및 **Secret Key** (비공개) 복사

### 2.2 환경변수 설정
```bash
# .env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx  # 테스트 모드
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx    # 웹훅 서명 키
```

### 2.3 웹훅 설정
1. Stripe 대시보드 → Developers → Webhooks
2. "Add an endpoint" 클릭
3. Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Events: `charge.succeeded`, `charge.failed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Signing Secret 복사 → `STRIPE_WEBHOOK_SECRET` 환경변수에 저장

---

## 3. 구현 구조

### 3.1 Stripe 클라이언트 래퍼 (`server/modules/stripe/client.ts`)

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export default stripe;
```

### 3.2 고객 관리 (`server/modules/stripe/customers.ts`)

**고객 생성/조회:**
```typescript
// Stripe에서 고객 생성 (사용자 가입 시)
export async function createStripeCustomer(userId: number, email: string) {
  const customer = await stripe.customers.create({
    email,
    metadata: { userId: userId.toString() },
  });
  return customer.id;
}

// 기존 고객 조회
export async function getStripeCustomer(customerId: string) {
  return await stripe.customers.retrieve(customerId);
}
```

**DB에 저장:**
```typescript
// users 테이블에 stripe_customer_id 추가
ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255);
```

### 3.3 상품 및 가격 관리 (`server/modules/stripe/products.ts`)

**상품 생성:**
```typescript
export async function createProduct(projectId: number, name: string, description: string) {
  const product = await stripe.products.create({
    name,
    description,
    metadata: { projectId: projectId.toString() },
  });
  return product.id;
}
```

**가격 생성:**
```typescript
export async function createPrice(
  productId: string,
  amount: number,           // 센트 단위 (예: 9999 = $99.99)
  currency: string = 'usd',
  interval: 'month' | 'year' = 'month'
) {
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: amount,
    currency,
    recurring: { interval },
  });
  return price.id;
}
```

**DB 스키마:**
```sql
CREATE TABLE subscription_plans (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL REFERENCES projects(id),
  stripe_product_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  name VARCHAR(255),
  price DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  billing_interval VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.4 구독 생성 (`server/modules/stripe/subscriptions.ts`)

**구독 생성:**
```typescript
export async function createSubscription(
  customerId: string,
  priceId: string,
  metadata?: Record<string, string>
) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    metadata,
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });
  return subscription;
}
```

**구독 취소:**
```typescript
export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.del(subscriptionId);
}
```

**구독 업그레이드:**
```typescript
export async function upgradeSubscription(
  subscriptionId: string,
  newPriceId: string
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0]!.id,
        price: newPriceId,
      },
    ],
    proration_behavior: 'create_prorations', // 차액 자동 계산
  });
}
```

**DB 스키마:**
```sql
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  user_id INT NOT NULL REFERENCES users(id),
  project_id INT NOT NULL REFERENCES projects(id),
  plan_id INT NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(50),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3.5 결제 이력 (`server/modules/stripe/payments.ts`)

**결제 기록 저장:**
```typescript
export async function recordPayment(
  subscriptionId: number,
  userId: number,
  stripePaymentId: string,
  amount: number,
  currency: string,
  status: string
) {
  const db = await getDb();
  return await db.insert(payments).values({
    subscription_id: subscriptionId,
    user_id: userId,
    stripe_payment_id: stripePaymentId,
    amount,
    currency,
    status,
  });
}
```

**결제 이력 조회:**
```typescript
export async function getPaymentHistory(userId: number, limit = 10) {
  const db = await getDb();
  return await db
    .select()
    .from(payments)
    .where(eq(payments.user_id, userId))
    .orderBy(desc(payments.created_at))
    .limit(limit);
}
```

**DB 스키마:**
```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  stripe_payment_id VARCHAR(255) UNIQUE,
  subscription_id INT REFERENCES subscriptions(id),
  user_id INT NOT NULL REFERENCES users(id),
  amount DECIMAL(10, 2),
  currency VARCHAR(3),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.6 웹훅 처리 (`server/modules/stripe/webhooks.ts`)

**웹훅 엔드포인트:**
```typescript
// server/routers.ts 또는 server/_core/index.ts
import { handleStripeWebhook } from './modules/stripe/webhooks';

app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    await handleStripeWebhook(req);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});
```

**웹훅 처리 로직:**
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function handleStripeWebhook(req: any) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (error) {
    throw new Error(`Webhook signature verification failed: ${error.message}`);
  }

  // 이벤트 처리
  switch (event.type) {
    case 'charge.succeeded':
      await handleChargeSucceeded(event.data.object as Stripe.Charge);
      break;
    case 'charge.failed':
      await handleChargeFailed(event.data.object as Stripe.Charge);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

// 결제 성공 처리
async function handleChargeSucceeded(charge: Stripe.Charge) {
  const db = await getDb();
  
  // 1. 결제 기록 저장
  await db.insert(payment_events).values({
    stripe_event_id: charge.id,
    event_type: 'charge.succeeded',
    payload: charge,
    processed: true,
  });

  // 2. 구독 상태 업데이트
  const subscription = await stripe.subscriptions.retrieve(charge.invoice?.subscription as string);
  await db.update(subscriptions)
    .set({ status: 'active' })
    .where(eq(subscriptions.stripe_subscription_id, subscription.id));

  // 3. 이메일 발송
  await sendPaymentSuccessEmail(charge);
}

// 결제 실패 처리
async function handleChargeFailed(charge: Stripe.Charge) {
  const db = await getDb();
  
  // 1. 실패 기록 저장
  await db.insert(payment_events).values({
    stripe_event_id: charge.id,
    event_type: 'charge.failed',
    payload: charge,
    processed: true,
  });

  // 2. 구독 상태 업데이트
  const subscription = await stripe.subscriptions.retrieve(charge.invoice?.subscription as string);
  await db.update(subscriptions)
    .set({ status: 'past_due' })
    .where(eq(subscriptions.stripe_subscription_id, subscription.id));

  // 3. 알림 발송
  await sendPaymentFailureNotification(charge);
}

// 구독 업데이트 처리
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const db = await getDb();
  
  await db.update(subscriptions)
    .set({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      updated_at: new Date(),
    })
    .where(eq(subscriptions.stripe_subscription_id, subscription.id));
}

// 구독 취소 처리
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const db = await getDb();
  
  await db.update(subscriptions)
    .set({
      status: 'canceled',
      cancel_at: new Date(),
      updated_at: new Date(),
    })
    .where(eq(subscriptions.stripe_subscription_id, subscription.id));
}
```

---

## 4. tRPC 프로시저 구현

### 4.1 구독 생성
```typescript
// server/routers/subscriptions.ts
export const subscriptionsRouter = router({
  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      planId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      
      // 1. 사용자의 Stripe Customer ID 조회
      let customer = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id));
      
      if (!customer[0]?.stripe_customer_id) {
        // 새로운 고객 생성
        const stripeCustomer = await createStripeCustomer(
          ctx.user.id,
          ctx.user.email!
        );
        await db.update(users)
          .set({ stripe_customer_id: stripeCustomer })
          .where(eq(users.id, ctx.user.id));
        customer[0]!.stripe_customer_id = stripeCustomer;
      }

      // 2. 요금제 정보 조회
      const plan = await db
        .select()
        .from(subscription_plans)
        .where(eq(subscription_plans.id, input.planId));

      if (!plan[0]) throw new Error('Plan not found');

      // 3. Stripe 구독 생성
      const stripeSubscription = await createSubscription(
        customer[0]!.stripe_customer_id,
        plan[0].stripe_price_id,
        { projectId: input.projectId.toString(), userId: ctx.user.id.toString() }
      );

      // 4. DB에 구독 기록
      await db.insert(subscriptions).values({
        stripe_subscription_id: stripeSubscription.id,
        user_id: ctx.user.id,
        project_id: input.projectId,
        plan_id: input.planId,
        status: stripeSubscription.status,
        current_period_start: new Date(stripeSubscription.current_period_start * 1000),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000),
      });

      return stripeSubscription;
    }),

  cancel: protectedProcedure
    .input(z.object({ subscriptionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      
      // 1. 구독 조회
      const subscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.id, input.subscriptionId));

      if (!subscription[0]) throw new Error('Subscription not found');
      if (subscription[0].user_id !== ctx.user.id) throw new Error('Unauthorized');

      // 2. Stripe에서 구독 취소
      await cancelSubscription(subscription[0].stripe_subscription_id);

      // 3. DB 업데이트
      await db.update(subscriptions)
        .set({ status: 'canceled', cancel_at: new Date() })
        .where(eq(subscriptions.id, input.subscriptionId));

      return { success: true };
    }),
});
```

---

## 5. 프론트엔드 통합

### 5.1 구독 생성 UI
```typescript
// client/src/pages/Pricing.tsx
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';

export default function Pricing() {
  const createSubscription = trpc.subscriptions.create.useMutation();

  const handleSubscribe = async (planId: number) => {
    try {
      const result = await createSubscription.mutateAsync({
        projectId: 1,
        planId,
      });
      
      // Stripe 결제 페이지로 리다이렉트
      if (result.latest_invoice?.payment_intent?.client_secret) {
        // Stripe.js를 사용하여 결제 처리
        window.location.href = result.latest_invoice.hosted_invoice_url;
      }
    } catch (error) {
      console.error('Subscription error:', error);
    }
  };

  return (
    <div>
      <Button onClick={() => handleSubscribe(1)}>
        Subscribe to Basic
      </Button>
    </div>
  );
}
```

---

## 6. 테스트 카드 번호 (테스트 모드)

Stripe 테스트 환경에서 사용할 수 있는 카드 번호:

| 시나리오 | 카드 번호 | CVC | 만료일 |
|:---|:---|:---|:---|
| 성공 | 4242 4242 4242 4242 | 임의 | 미래 |
| 실패 | 4000 0000 0000 0002 | 임의 | 미래 |
| 3D Secure | 4000 0025 0000 3155 | 임의 | 미래 |

---

## 7. 보안 모범 사례

1. **API 키 보호**: Secret Key는 절대 클라이언트에 노출하지 말 것
2. **웹훅 검증**: 모든 웹훅 이벤트는 서명 검증 필수
3. **PCI DSS 준수**: 신용카드 정보는 Stripe에서만 처리
4. **감사 로그**: 모든 결제 관련 작업 기록
5. **에러 처리**: 민감한 정보를 에러 메시지에 포함하지 말 것

---

## 8. 문제 해결

### 웹훅이 수신되지 않음
- Stripe 대시보드에서 웹훅 상태 확인
- 엔드포인트 URL이 공개 인터넷에서 접근 가능한지 확인
- 방화벽/보안 그룹 설정 확인

### 결제 실패
- Stripe 대시보드에서 결제 로그 확인
- 고객의 카드 정보 확인
- 3D Secure 인증 필요 여부 확인

### 구독 상태 불일치
- Stripe 대시보드와 DB의 상태 동기화 확인
- 웹훅 처리 로그 확인
- 수동 동기화 스크립트 실행

---

## 참고 자료

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Billing Guide](https://stripe.com/docs/billing)
- [Stripe Security Best Practices](https://stripe.com/docs/security)
