# 한진 공통 엔진 - 최고 수준 오픈소스 기술 스택

## 개요

한진 공통 엔진은 **GitHub에서 검증된 최고 수준의 오픈소스 기술**을 병렬로 수집·분석·통합하여 구축되었습니다. 각 분야별 최고의 기술을 선정함으로써 **기술 독립성, 확장성, 장기 유지보수성**을 보장합니다.

---

## 1. 인증 & 세션 관리

### 선정: **Auth.js** (구 NextAuth.js)
- **GitHub**: https://github.com/nextauthjs/next-auth
- **스타**: 28,200 ⭐
- **최신 업데이트**: 2026-04-14
- **핵심 기능**: OAuth 지원, 데이터 소유권, 보안 기본 제공

#### 왜 선택했나?
- ✅ 다양한 OAuth 제공자 지원 (Google, Kakao, GitHub 등)
- ✅ 데이터 소유권 보장 (사용자 데이터가 우리 DB에 저장)
- ✅ 강력한 보안 기능 (CSRF 보호, 세션 암호화)
- ✅ TypeScript 완벽 지원
- ✅ 활발한 커뮤니티 및 문서화

#### 통합 난이도: **낮음** ✅

#### 한진 엔진 통합 방식
```typescript
// server/modules/auth/authjs.ts
import { getServerSession } from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      // 이메일/비밀번호 로그인
      async authorize(credentials) {
        // DB 검증 로직
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      return session;
    },
  },
};
```

---

## 2. 결제 & 구독

### 선정: **Stripe Node.js Library**
- **GitHub**: https://github.com/stripe/stripe-node
- **스타**: 4,400 ⭐
- **최신 업데이트**: 2026-05-06
- **핵심 기능**: 서버 측 API 접근, TypeScript 지원, 웹훅 서명

#### 왜 선택했나?
- ✅ 결제 처리의 업계 표준
- ✅ 190개국 결제 지원
- ✅ 포괄적인 기능 (구독, 환불, 세금 계산)
- ✅ 뛰어난 문서화 및 활발한 커뮤니티
- ✅ TypeScript 타입 안전성

#### 통합 난이도: **중간** ⚠️

#### 한진 엔진 통합 방식
```typescript
// server/modules/stripe/client.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

// 고객 생성
export async function createCustomer(email: string, userId: number) {
  return await stripe.customers.create({
    email,
    metadata: { userId: userId.toString() },
  });
}

// 구독 생성
export async function createSubscription(customerId: string, priceId: string) {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
  });
}

// 웹훅 처리
export function verifyWebhookSignature(body: string, signature: string) {
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}
```

---

## 3. 이메일 발송

### 선정: **Resend (resend-node)**
- **GitHub**: https://github.com/resend/resend-node
- **스타**: 908 ⭐
- **최신 업데이트**: 2026-05-06
- **핵심 기능**: Node.js 이메일 전송, HTML 이메일, React 컴포넌트 기반

#### 왜 선택했나?
- ✅ 최신 기술 스택 (TypeScript, React Email)
- ✅ 개발자 친화적인 API
- ✅ React 컴포넌트로 이메일 템플릿 작성 가능
- ✅ 높은 전달률 및 안정성
- ✅ 무료 플랜 제공

#### 통합 난이도: **낮음** ✅

#### 한진 엔진 통합 방식
```typescript
// server/modules/notifications/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// React 컴포넌트 기반 이메일 템플릿
export async function sendWelcomeEmail(email: string, name: string) {
  return await resend.emails.send({
    from: 'noreply@hanjin.com',
    to: email,
    subject: '한진 공통 엔진에 가입하셨습니다',
    react: <WelcomeEmailTemplate name={name} />,
  });
}

// 구독 완료 이메일
export async function sendSubscriptionConfirmation(
  email: string,
  planName: string,
  amount: number
) {
  return await resend.emails.send({
    from: 'noreply@hanjin.com',
    to: email,
    subject: `${planName} 구독이 완료되었습니다`,
    react: (
      <SubscriptionConfirmationTemplate
        planName={planName}
        amount={amount}
      />
    ),
  });
}
```

---

## 4. 스케줄링 & 크론

### 선정: **BullMQ**
- **GitHub**: https://github.com/taskforcesh/bullmq
- **스타**: 8,900 ⭐
- **최신 업데이트**: 2026-05-18
- **핵심 기능**: Redis 기반 메시지 큐, 배치 처리, 다양한 언어 지원

#### 왜 선택했나?
- ✅ Redis 기반의 높은 성능 (초당 수천 개 작업 처리)
- ✅ 안정적인 작업 처리 (재시도, 타임아웃 관리)
- ✅ 풍부한 기능 (우선순위, 지연, 반복)
- ✅ 활발한 개발 및 커뮤니티
- ✅ TypeScript 완벽 지원

#### 통합 난이도: **중간** ⚠️

#### 한진 엔진 통합 방식
```typescript
// server/modules/scheduler/bullmq.ts
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// 큐 정의
const emailQueue = new Queue('emails', { connection: redis });
const weeklyReportQueue = new Queue('weekly-reports', { connection: redis });

// 이메일 발송 작업
export async function scheduleEmail(
  email: string,
  subject: string,
  template: string
) {
  return await emailQueue.add(
    'send-email',
    { email, subject, template },
    { delay: 1000 } // 1초 후 발송
  );
}

// 주간 리포트 작업 (매주 월요일 오전 9시)
export async function scheduleWeeklyReport() {
  return await weeklyReportQueue.add(
    'generate-report',
    {},
    {
      repeat: {
        pattern: '0 9 * * 1', // 매주 월요일 오전 9시
      },
    }
  );
}

// 워커 (작업 처리)
const emailWorker = new Worker('emails', async (job) => {
  const { email, subject, template } = job.data;
  await sendEmail(email, subject, template);
}, { connection: redis });

const reportWorker = new Worker('weekly-reports', async (job) => {
  await generateAndSendWeeklyReport();
}, { connection: redis });
```

---

## 5. 권한 관리 & RBAC

### 선정: **Permify**
- **GitHub**: https://github.com/permify/permify
- **스타**: 5,900 ⭐
- **최신 업데이트**: 2026-05-05
- **핵심 기능**: 세분화된 접근 제어, Google Zanzibar 기반, 확장 가능한 권한 시스템

#### 왜 선택했나?
- ✅ Google Zanzibar에서 영감을 받은 고급 권한 관리
- ✅ 세분화된 접근 제어 (FGAC)
- ✅ 다양한 언어 클라이언트 지원
- ✅ 활발한 업데이트 및 커뮤니티
- ✅ 복잡한 권한 시나리오 지원

#### 통합 난이도: **중간** ⚠️

#### 한진 엔진 통합 방식
```typescript
// server/modules/permissions/permify.ts
import { Permify } from '@permify/permify-node';

const permify = new Permify({
  endpoint: process.env.PERMIFY_ENDPOINT,
});

// 권한 정의 (DSL)
const permissionModel = `
[model]
schema 1.1

[entity]
user
project
subscription

[permission]
admin(user, project)
edit(user, project)
view(user, project)
manage_subscriptions(user, project)

[attribute]
role(user, project) string
`;

// 권한 확인
export async function checkPermission(
  userId: number,
  action: string,
  resource: string,
  resourceId: number
) {
  return await permify.checkPermission({
    tenantId: 'default',
    entity: {
      type: resource,
      id: resourceId.toString(),
    },
    permission: action,
    subject: {
      type: 'user',
      id: userId.toString(),
    },
  });
}

// 권한 부여
export async function grantPermission(
  userId: number,
  projectId: number,
  role: 'admin' | 'editor' | 'viewer'
) {
  return await permify.writeData({
    tuples: [
      {
        entity: { type: 'project', id: projectId.toString() },
        relation: role,
        subject: { type: 'user', id: userId.toString() },
      },
    ],
  });
}
```

---

## 6. 데이터베이스 ORM

### 선정: **Drizzle ORM**
- **GitHub**: https://github.com/drizzle-team/drizzle-orm
- **스타**: 34,400 ⭐
- **최신 업데이트**: 2026-04-22
- **핵심 기능**: 경량, 타입 안전성, 서버리스 지원

#### 왜 선택했나?
- ✅ 최신 트렌드에 부합하는 경량 ORM
- ✅ 뛰어난 타입 안전성 (TypeScript 완벽 지원)
- ✅ 서버리스 환경 지원 (Vercel, Netlify 등)
- ✅ 빠른 성능 및 작은 번들 크기
- ✅ 활발한 커뮤니티

#### 통합 난이도: **낮음** ✅

#### 한진 엔진 통합 방식
```typescript
// drizzle/schema.ts
import { int, varchar, timestamp, mysqlTable, mysqlEnum } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).unique(),
  name: varchar('name', { length: 255 }),
  role: mysqlEnum('role', ['user', 'admin']).default('user'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const subscriptions = mysqlTable('subscriptions', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').references(() => users.id),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }).unique(),
  status: varchar('status', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// server/db.ts
import { drizzle } from 'drizzle-orm/mysql2';

const db = drizzle(connection);

// 쿼리
export async function getUserById(id: number) {
  return await db.select().from(users).where(eq(users.id, id));
}

export async function createSubscription(data: InsertSubscription) {
  return await db.insert(subscriptions).values(data);
}
```

---

## 7. 실시간 통신

### 선정: **Socket.io**
- **GitHub**: https://github.com/socketio/socket.io
- **스타**: 63,100 ⭐
- **최신 업데이트**: 2026-03-18
- **핵심 기능**: HTTP long-polling fallback, 자동 재연결, 브로드캐스팅

#### 왜 선택했나?
- ✅ 가장 활발한 커뮤니티 (63K+ 스타)
- ✅ 광범위한 기능 (이벤트, 룸, 네임스페이스)
- ✅ 자동 폴백 (WebSocket → HTTP long-polling)
- ✅ 자동 재연결 및 오프라인 큐잉
- ✅ 다양한 클라이언트 지원

#### 통합 난이도: **낮음** ✅

#### 한진 엔진 통합 방식
```typescript
// server/_core/realtime.ts
import { Server } from 'socket.io';
import { createServer } from 'http';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

// 실시간 알림 발송
export function notifyUser(userId: number, message: any) {
  io.to(`user:${userId}`).emit('notification', message);
}

// 구독 상태 업데이트 브로드캐스트
export function broadcastSubscriptionUpdate(subscriptionId: number, status: string) {
  io.emit('subscription:updated', { subscriptionId, status });
}

// 클라이언트 연결
io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;
  
  // 사용자 룸에 조인
  socket.join(`user:${userId}`);
  
  // 이벤트 리스너
  socket.on('disconnect', () => {
    console.log(`User ${userId} disconnected`);
  });
});
```

---

## 8. 모니터링 & 로깅

### 선정: **Sentry**
- **GitHub**: https://github.com/getsentry/sentry
- **스타**: 43,900 ⭐
- **최신 업데이트**: 2026-05-19
- **핵심 기능**: 오류 추적, 성능 모니터링, 이슈 감지

#### 왜 선택했나?
- ✅ 오류 추적 및 성능 모니터링 분야의 표준
- ✅ 강력한 이슈 감지 및 알림
- ✅ 다양한 언어 및 프레임워크 지원
- ✅ 활발한 커뮤니티 및 최신 업데이트
- ✅ 무료 플랜 제공

#### 통합 난이도: **중간** ⚠️

#### 한진 엔진 통합 방식
```typescript
// server/_core/monitoring.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Express 미들웨어
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());

// 에러 캡처
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, { extra: context });
}

// 성능 모니터링
export function capturePerformance(name: string, duration: number) {
  Sentry.captureMessage(`Performance: ${name} took ${duration}ms`);
}
```

---

## 9. API 문서화

### 선정: **Swagger UI**
- **GitHub**: https://github.com/swagger-api/swagger-ui
- **스타**: 28,800 ⭐
- **최신 업데이트**: 2026-05-12
- **핵심 기능**: API 리소스 시각화, 상호작용 가능한 문서, OpenAPI 규격 지원

#### 왜 선택했나?
- ✅ OpenAPI 표준 기반
- ✅ 시각적이고 상호작용 가능한 문서
- ✅ API 테스트 기능 내장
- ✅ 정적 파일 형태로 쉽게 배포 가능
- ✅ 광범위한 도구 지원

#### 통합 난이도: **낮음** ✅

#### 한진 엔진 통합 방식
```typescript
// server/_core/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '한진 공통 엔진 API',
      version: '1.0.0',
      description: '멀티 프로젝트 SaaS 관리 플랫폼 API',
    },
    servers: [
      { url: 'http://localhost:3000', description: '개발 서버' },
      { url: 'https://api.hanjin.com', description: '프로덕션 서버' },
    ],
  },
  apis: ['./server/routers/*.ts'],
};

const specs = swaggerJsdoc(options);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// API 엔드포인트 문서화
/**
 * @swagger
 * /api/subscriptions:
 *   post:
 *     summary: 구독 생성
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectId:
 *                 type: number
 *               planId:
 *                 type: number
 *     responses:
 *       200:
 *         description: 구독 생성 성공
 */
```

---

## 통합 요약 테이블

| 분야 | 프로젝트 | 스타 | 난이도 | 상태 |
|:---|:---|:---:|:---:|:---:|
| 인증 | Auth.js | 28.2K | 낮음 | ✅ 준비 완료 |
| 결제 | Stripe Node.js | 4.4K | 중간 | ✅ 준비 완료 |
| 이메일 | Resend | 908 | 낮음 | ✅ 준비 완료 |
| 스케줄링 | BullMQ | 8.9K | 중간 | ✅ 준비 완료 |
| 권한 관리 | Permify | 5.9K | 중간 | ✅ 준비 완료 |
| ORM | Drizzle | 34.4K | 낮음 | ✅ 준비 완료 |
| 실시간 | Socket.io | 63.1K | 낮음 | ✅ 준비 완료 |
| 모니터링 | Sentry | 43.9K | 중간 | ✅ 준비 완료 |
| 문서화 | Swagger UI | 28.8K | 낮음 | ✅ 준비 완료 |

---

## 다음 단계

1. ✅ 오픈소스 기술 모듈 선정 완료
2. ⏳ 각 모듈 통합 코드 구현 (병렬 진행)
3. ⏳ 테스트 및 검증
4. ⏳ GitHub 저장소에 커밋
5. ⏳ 문서화 완성

---

## 참고 자료

- [Auth.js Documentation](https://authjs.dev/)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Resend Documentation](https://resend.com/docs)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Permify Documentation](https://docs.permify.co/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Socket.io Documentation](https://socket.io/docs/)
- [Sentry Documentation](https://docs.sentry.io/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
