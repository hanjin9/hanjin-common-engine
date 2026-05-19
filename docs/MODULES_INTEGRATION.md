# 한진 공통 엔진 - 모듈 통합 가이드

## 개요

이 문서는 한진 공통 엔진의 모든 모듈을 통합하고 설정하는 방법을 설명합니다. 각 모듈은 독립적으로 작동하면서도 시스템 전체와 조화롭게 동작하도록 설계되었습니다.

---

## 1. 모듈 구조

```
server/modules/
├── auth/                    # 인증 모듈 (Auth.js)
│   └── authjs-integration.ts
├── stripe/                  # 결제 모듈 (Stripe)
│   └── index.ts
├── scheduler/               # 스케줄러 모듈 (BullMQ)
│   └── bullmq.ts
├── notifications/           # 알림 모듈 (Resend + Socket.io)
│   └── email.ts
├── monitoring/              # 모니터링 모듈 (Sentry)
│   └── sentry.ts
└── realtime/                # 실시간 통신 모듈 (Socket.io)
    └── socket.ts
```

---

## 2. 환경변수 설정

### 2.1 인증 (Auth.js)
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Kakao OAuth
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret

# JWT
JWT_SECRET=your_jwt_secret_key
```

### 2.2 결제 (Stripe)
```bash
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
```

### 2.3 스케줄러 (BullMQ)
```bash
REDIS_URL=redis://localhost:6379
```

### 2.4 알림 (Resend)
```bash
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@hanjin.com
APP_URL=https://your-app-url.com
```

### 2.5 모니터링 (Sentry)
```bash
SENTRY_DSN=https://your-sentry-dsn
```

### 2.6 기타
```bash
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

---

## 3. 모듈별 초기화

### 3.1 Express 서버 설정

```typescript
// server/_core/index.ts
import express from 'express';
import { createServer } from 'http';
import { initializeSentry } from '../modules/monitoring/sentry';
import { initializeSocket } from '../modules/realtime/socket';
import { setupQueueEventListeners } from '../modules/scheduler/bullmq';

const app = express();
const httpServer = createServer(app);

// 1. Sentry 초기화
initializeSentry(app);

// 2. Socket.io 초기화
initializeSocket(httpServer);

// 3. BullMQ 스케줄러 초기화
setupQueueEventListeners();

// 4. 라우터 등록
app.use('/api', apiRouter);

// 5. 서버 시작
httpServer.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### 3.2 인증 미들웨어 설정

```typescript
// server/_core/auth-middleware.ts
import { getSession } from '../modules/auth/authjs-integration';

export async function authMiddleware(req: any, res: any, next: any) {
  const session = await getSession();
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  req.user = session.user;
  next();
}
```

---

## 4. 통합 워크플로우

### 4.1 사용자 가입 플로우

```
1. 사용자가 Google/Kakao 로그인 클릭
   ↓
2. Auth.js가 OAuth 처리
   ↓
3. 사용자 정보를 DB에 저장
   ↓
4. Stripe 고객 생성 (결제 준비)
   ↓
5. Resend로 환영 이메일 발송
   ↓
6. Socket.io로 관리자에게 신규 가입 알림
   ↓
7. 대시보드로 리다이렉트
```

**구현 코드:**
```typescript
// server/routers/auth.ts
export const authRouter = router({
  signUp: publicProcedure
    .input(z.object({ email: z.string(), name: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      // 1. 사용자 생성
      const user = await db.insert(users).values({
        email: input.email,
        name: input.name,
      });
      
      // 2. Stripe 고객 생성
      const stripeCustomer = await stripe.customers.create({
        email: input.email,
        metadata: { userId: user.id.toString() },
      });
      
      // 3. 환영 이메일 발송
      await scheduleEmail(input.email, 'welcome', 'welcome', { name: input.name });
      
      // 4. 관리자 알림
      notifyNewUserSignup(user.id, input.email, input.name);
      
      return { success: true };
    }),
});
```

### 4.2 구독 생성 플로우

```
1. 사용자가 요금제 선택
   ↓
2. Stripe 구독 생성
   ↓
3. 결제 페이지 표시
   ↓
4. 사용자가 결제 완료
   ↓
5. Stripe 웹훅 처리 (charge.succeeded)
   ↓
6. DB에 구독 기록
   ↓
7. Resend로 결제 완료 이메일 발송
   ↓
8. Socket.io로 실시간 알림
   ↓
9. 관리자에게 신규 결제 알림
```

**구현 코드:**
```typescript
// server/routers/subscriptions.ts
export const subscriptionsRouter = router({
  create: protectedProcedure
    .input(z.object({ projectId: z.number(), planId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Stripe 구독 생성
      const stripeSubscription = await stripe.subscriptions.create(
        ctx.user.stripe_customer_id,
        plan.stripe_price_id
      );
      
      // 2. DB에 기록
      const subscription = await db.insert(subscriptions).values({
        stripe_subscription_id: stripeSubscription.id,
        user_id: ctx.user.id,
        project_id: input.projectId,
        plan_id: input.planId,
      });
      
      return stripeSubscription;
    }),
});
```

### 4.3 Stripe 웹훅 처리 플로우

```
1. Stripe에서 이벤트 발생 (charge.succeeded)
   ↓
2. 웹훅 엔드포인트에서 서명 검증
   ↓
3. 결제 기록 저장
   ↓
4. 구독 상태 업데이트
   ↓
5. BullMQ 큐에 이메일 작업 추가
   ↓
6. Socket.io로 사용자에게 실시간 알림
   ↓
7. 관리자에게 결제 알림
```

**구현 코드:**
```typescript
// server/_core/webhooks.ts
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    switch (event.type) {
      case 'charge.succeeded':
        const charge = event.data.object;
        
        // 1. 결제 기록 저장
        await db.insert(payments).values({
          stripe_payment_id: charge.id,
          amount: charge.amount,
          status: 'succeeded',
        });
        
        // 2. 이메일 발송 큐에 추가
        await scheduleEmail(
          user.email,
          'Payment Confirmation',
          'payment-confirmation',
          { amount: charge.amount }
        );
        
        // 3. 실시간 알림
        notifyPaymentSuccess(user.id, charge.amount, charge.currency, plan.name);
        
        // 4. 관리자 알림
        notifyNewPayment(charge.id, user.id, charge.amount, charge.currency);
        
        break;
    }
    
    res.json({ received: true });
  } catch (error) {
    captureException(error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});
```

### 4.4 자동화 스케줄 플로우

```
매주 월요일 오전 9시:
1. BullMQ 크론 작업 트리거
   ↓
2. 주간 통계 데이터 집계
   ↓
3. 리포트 생성
   ↓
4. 관리자 이메일 발송
   ↓
5. 완료 로그 기록

매일 자정:
1. 구독 만료 예정 조회 (D-7, D-1)
   ↓
2. 알림 이메일 발송
   ↓
3. Socket.io로 실시간 알림
```

**구현 코드:**
```typescript
// server/modules/scheduler/setup.ts
import { scheduleWeeklyReport, scheduleSubscriptionAlert } from './bullmq';

export async function setupSchedules() {
  // 주간 리포트
  await scheduleWeeklyReport();
  
  // 구독 만료 알림 (매일 자정)
  const subscriptions = await db.select().from(subscriptions_table);
  for (const sub of subscriptions) {
    const daysUntilExpiry = Math.ceil(
      (sub.current_period_end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntilExpiry === 7 || daysUntilExpiry === 1) {
      await scheduleSubscriptionAlert(sub.id, daysUntilExpiry);
    }
  }
}
```

---

## 5. 에러 처리 및 모니터링

### 5.1 Sentry 통합

```typescript
// 모든 에러는 자동으로 Sentry에 캡처됨
try {
  await someAsyncOperation();
} catch (error) {
  captureException(error, { context: 'operation_name' });
}

// 성능 모니터링
const transaction = startTransaction('payment_processing');
const span = createSpan(transaction, 'stripe_api', 'Creating subscription');
try {
  await stripe.subscriptions.create(...);
} finally {
  finishSpan(span);
  finishTransaction(transaction);
}
```

### 5.2 로깅

```typescript
// 모든 주요 이벤트는 콘솔에 로깅됨
console.log('[Auth] User signed in: user@example.com');
console.log('[Stripe] Subscription created: sub_123');
console.log('[Email] Welcome email sent to user@example.com');
console.log('[Socket.io] User 123 connected');
```

---

## 6. 테스트

### 6.1 로컬 개발 환경

```bash
# 1. 환경변수 설정
cp .env.example .env

# 2. Redis 시작 (스케줄러용)
redis-server

# 3. 개발 서버 시작
pnpm dev

# 4. 테스트
# - http://localhost:3000에서 앱 접속
# - Google/Kakao 로그인 테스트
# - Stripe 테스트 카드로 결제 테스트
```

### 6.2 Stripe 테스트 카드

| 시나리오 | 카드 번호 |
|:---|:---|
| 성공 | 4242 4242 4242 4242 |
| 실패 | 4000 0000 0000 0002 |
| 3D Secure | 4000 0025 0000 3155 |

### 6.3 웹훅 테스트

```bash
# Stripe CLI를 사용하여 웹훅 테스트
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 다른 터미널에서 테스트 이벤트 발송
stripe trigger charge.succeeded
```

---

## 7. 배포 체크리스트

- [ ] 모든 환경변수 설정
- [ ] Stripe 프로덕션 API 키 설정
- [ ] 웹훅 엔드포인트 설정 (프로덕션 URL)
- [ ] Sentry DSN 설정
- [ ] Redis 클러스터 구성
- [ ] 이메일 템플릿 테스트
- [ ] Socket.io 프로덕션 설정 (CORS, 인증)
- [ ] 데이터베이스 마이그레이션
- [ ] SSL/TLS 인증서 설정
- [ ] 모니터링 대시보드 설정

---

## 8. 문제 해결

### 웹훅이 수신되지 않음
1. Stripe 대시보드에서 웹훅 상태 확인
2. 엔드포인트 URL이 공개 인터넷에서 접근 가능한지 확인
3. 서명 검증 로직 확인

### 이메일이 발송되지 않음
1. Resend API 키 확인
2. 이메일 주소 확인
3. 스팸 폴더 확인
4. Resend 대시보드에서 발송 로그 확인

### 스케줄 작업이 실행되지 않음
1. Redis 연결 확인
2. BullMQ 워커 상태 확인
3. 크론 표현식 확인
4. 로그 확인

### Socket.io 연결 실패
1. JWT 토큰 확인
2. CORS 설정 확인
3. 방화벽 설정 확인
4. 브라우저 콘솔 에러 확인

---

## 9. 참고 자료

- [Auth.js Documentation](https://authjs.dev/)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Resend Documentation](https://resend.com/docs)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Socket.io Documentation](https://socket.io/docs/)
- [Sentry Documentation](https://docs.sentry.io/)
