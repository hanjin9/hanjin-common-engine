# 한진 공통 엔진(Hanjin Common Engine) - 기술 아키텍처

## 1. 시스템 개요

**한진 공통 엔진**은 Supabase와 Stripe를 기반으로 한 **멀티 프로젝트 SaaS 관리 플랫폼**입니다. 6개의 다양한 프로젝트(장부관리사, 스포츠회복사, 로또, GLWA, 숨호흡, 랜딩)를 중앙에서 통합 관리하며, 향후 리셀러 사업화를 위한 기술 독립 자산으로 설계되었습니다.

### 핵심 목표
- **기술 독립성**: 특정 상용 템플릿에 종속되지 않는 자체 엔진 구축
- **확장성**: 신규 프로젝트 추가 시 복사·붙여넣기만으로 운영 가능
- **리셀러 준비**: 외부 개발사도 쉽게 이해하고 커스터마이징 가능한 명확한 구조
- **글로벌 결제**: 190개국 결제 처리 및 다양한 구독 모델 지원

---

## 2. 기술 스택

| 계층 | 기술 | 용도 |
|:---|:---|:---|
| **프론트엔드** | React 19 + TypeScript + Vite | 관리자 대시보드, 공개 페이지 |
| **스타일링** | Tailwind CSS 4 + shadcn/ui | 국제 타이포그래피 스타일 구현 |
| **백엔드** | Express 4 + tRPC 11 | API 서버, 비즈니스 로직 |
| **데이터베이스** | Supabase (PostgreSQL) | 사용자, 구독, 결제 데이터 |
| **인증** | Supabase Auth + Auth.js | 소셜 로그인, 세션 관리 |
| **결제** | Stripe API | 글로벌 결제, 구독 관리 |
| **이메일** | Resend + React Email | 트랜잭션 이메일 발송 |
| **스케줄링** | Heartbeat (Manus 내장) | 자동 알림, 주간 리포트 |
| **모니터링** | Sentry + Google Analytics | 에러 추적, 성능 분석 |
| **배포** | Vercel / Cloud Run | 프로덕션 호스팅 |

---

## 3. 폴더 구조

```
hanjin-common-engine/
├── client/                          # 프론트엔드 (React)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/               # 관리자 대시보드
│   │   │   │   ├── Dashboard.tsx    # 통계 대시보드
│   │   │   │   ├── Users.tsx        # 사용자 관리
│   │   │   │   ├── Projects.tsx     # 프로젝트 관리
│   │   │   │   ├── Subscriptions.tsx # 구독 관리
│   │   │   │   └── Settings.tsx     # 설정
│   │   │   ├── public/              # 공개 페이지
│   │   │   │   ├── Landing.tsx      # 랜딩 페이지
│   │   │   │   ├── Pricing.tsx      # 요금제 페이지
│   │   │   │   ├── SignIn.tsx       # 로그인
│   │   │   │   ├── SignUp.tsx       # 회원가입
│   │   │   │   └── Docs.tsx         # 문서
│   │   │   └── Home.tsx             # 홈
│   │   ├── components/
│   │   │   ├── admin/               # 관리자 컴포넌트
│   │   │   │   ├── UserTable.tsx
│   │   │   │   ├── ProjectCard.tsx
│   │   │   │   ├── SubscriptionForm.tsx
│   │   │   │   └── StatsChart.tsx
│   │   │   ├── auth/                # 인증 컴포넌트
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── SignUpForm.tsx
│   │   │   │   └── SocialLogin.tsx
│   │   │   ├── common/              # 공통 컴포넌트
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── Notification.tsx
│   │   │   └── ui/                  # shadcn/ui 컴포넌트
│   │   ├── hooks/
│   │   │   ├── useAuth.ts           # 인증 훅
│   │   │   ├── useProjects.ts       # 프로젝트 훅
│   │   │   └── useNotifications.ts  # 알림 훅
│   │   ├── lib/
│   │   │   ├── trpc.ts              # tRPC 클라이언트
│   │   │   ├── utils.ts             # 유틸리티 함수
│   │   │   └── api.ts               # API 클라이언트
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx      # 인증 컨텍스트
│   │   │   └── ThemeContext.tsx     # 테마 컨텍스트
│   │   ├── App.tsx                  # 라우팅
│   │   ├── main.tsx                 # 진입점
│   │   └── index.css                # 글로벌 스타일
│   ├── public/
│   │   ├── favicon.ico
│   │   └── robots.txt
│   └── index.html
│
├── server/                          # 백엔드 (Express + tRPC)
│   ├── modules/                     # 비즈니스 로직 모듈
│   │   ├── auth/
│   │   │   ├── supabase.ts          # Supabase Auth 통합
│   │   │   ├── oauth.ts             # OAuth 로직
│   │   │   └── session.ts           # 세션 관리
│   │   ├── stripe/
│   │   │   ├── client.ts            # Stripe SDK 래퍼
│   │   │   ├── products.ts          # 상품/가격 관리
│   │   │   ├── subscriptions.ts     # 구독 로직
│   │   │   ├── payments.ts          # 결제 로직
│   │   │   ├── webhooks.ts          # 웹훅 처리
│   │   │   └── refunds.ts           # 환불 로직
│   │   ├── projects/
│   │   │   ├── crud.ts              # 프로젝트 CRUD
│   │   │   └── analytics.ts         # 프로젝트 통계
│   │   ├── users/
│   │   │   ├── crud.ts              # 사용자 CRUD
│   │   │   ├── roles.ts             # 역할 관리
│   │   │   └── certifications.ts    # 자격증 관리
│   │   ├── notifications/
│   │   │   ├── email.ts             # 이메일 발송
│   │   │   ├── inapp.ts             # 인앱 알림
│   │   │   └── templates.ts         # 이메일 템플릿
│   │   ├── analytics/
│   │   │   ├── revenue.ts           # 매출 분석
│   │   │   ├── users.ts             # 사용자 분석
│   │   │   └── subscriptions.ts     # 구독 분석
│   │   └── scheduler/
│   │       ├── heartbeat.ts         # Heartbeat 크론 작업
│   │       ├── weekly-report.ts     # 주간 리포트
│   │       └── subscription-alerts.ts # 구독 알림
│   ├── routers/                     # tRPC 라우터
│   │   ├── auth.ts                  # 인증 API
│   │   ├── projects.ts              # 프로젝트 API
│   │   ├── users.ts                 # 사용자 API
│   │   ├── subscriptions.ts         # 구독 API
│   │   ├── payments.ts              # 결제 API
│   │   ├── notifications.ts         # 알림 API
│   │   ├── analytics.ts             # 통계 API
│   │   └── admin.ts                 # 관리자 API
│   ├── db.ts                        # DB 쿼리 헬퍼
│   ├── routers.ts                   # tRPC 라우터 통합
│   └── _core/                       # 프레임워크 핵심 (수정 금지)
│       ├── index.ts
│       ├── context.ts
│       ├── trpc.ts
│       ├── env.ts
│       └── ...
│
├── drizzle/                         # 데이터베이스 스키마
│   ├── schema.ts                    # 테이블 정의
│   ├── relations.ts                 # 관계 정의
│   ├── migrations/                  # 마이그레이션 파일
│   └── config.ts
│
├── shared/                          # 공유 타입 및 상수
│   ├── types.ts                     # 공유 타입 정의
│   ├── const.ts                     # 상수
│   └── enums.ts                     # Enum 정의
│
├── docs/                            # 문서
│   ├── ARCHITECTURE.md              # 이 파일
│   ├── API.md                       # API 명세
│   ├── SETUP.md                     # 설치 및 설정 가이드
│   ├── DEPLOYMENT.md                # 배포 가이드
│   ├── RESELLER.md                  # 리셀러 가이드
│   └── TROUBLESHOOTING.md           # 문제 해결 가이드
│
├── templates/                       # 리셀러용 템플릿
│   ├── .env.example                 # 환경변수 템플릿
│   ├── project-config.json          # 프로젝트 설정 템플릿
│   └── onboarding-checklist.md      # 온보딩 체크리스트
│
├── tests/                           # 테스트
│   ├── unit/                        # 단위 테스트
│   ├── integration/                 # 통합 테스트
│   └── e2e/                         # E2E 테스트
│
├── .github/                         # GitHub 설정
│   ├── workflows/                   # CI/CD 워크플로우
│   └── ISSUE_TEMPLATE/              # 이슈 템플릿
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── drizzle.config.ts
├── README.md
├── LICENSE
└── .gitignore
```

---

## 4. 데이터 모델 (Supabase PostgreSQL)

### 핵심 테이블

#### `projects` - 프로젝트 정보
```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,           -- 프로젝트명 (정확한 명칭)
  slug VARCHAR(100) UNIQUE NOT NULL,    -- URL 슬러그
  description TEXT,
  logo_url VARCHAR(500),
  website_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'active',  -- active, inactive, archived
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `users` - 사용자 정보 (확장)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  open_id VARCHAR(255) UNIQUE NOT NULL, -- Supabase Auth ID
  email VARCHAR(320) UNIQUE,
  name VARCHAR(255),
  avatar_url VARCHAR(500),
  role VARCHAR(50) DEFAULT 'user',      -- user, admin
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `project_users` - 프로젝트별 사용자 매핑
```sql
CREATE TABLE project_users (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL REFERENCES projects(id),
  user_id INT NOT NULL REFERENCES users(id),
  role VARCHAR(50) DEFAULT 'user',      -- user, admin, moderator
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);
```

#### `subscriptions` - 구독 정보
```sql
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  user_id INT NOT NULL REFERENCES users(id),
  project_id INT NOT NULL REFERENCES projects(id),
  plan_id INT NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(50),                   -- active, past_due, canceled, unpaid
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `subscription_plans` - 요금제
```sql
CREATE TABLE subscription_plans (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL REFERENCES projects(id),
  stripe_product_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  name VARCHAR(255),                    -- Basic, Pro, Enterprise
  description TEXT,
  price DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  billing_interval VARCHAR(50),         -- month, year
  features JSONB,                       -- 기능 목록
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `payments` - 결제 이력
```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  stripe_payment_id VARCHAR(255) UNIQUE,
  subscription_id INT REFERENCES subscriptions(id),
  user_id INT NOT NULL REFERENCES users(id),
  amount DECIMAL(10, 2),
  currency VARCHAR(3),
  status VARCHAR(50),                   -- succeeded, failed, pending
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `payment_events` - Stripe 웹훅 이벤트
```sql
CREATE TABLE payment_events (
  id SERIAL PRIMARY KEY,
  stripe_event_id VARCHAR(255) UNIQUE,
  event_type VARCHAR(100),              -- charge.succeeded, charge.failed, etc.
  payload JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `notifications` - 인앱 알림
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  title VARCHAR(255),
  message TEXT,
  type VARCHAR(50),                     -- info, warning, error, success
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `audit_logs` - 감사 로그
```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  action VARCHAR(100),
  resource_type VARCHAR(100),
  resource_id INT,
  changes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 5. API 아키텍처 (tRPC)

### 라우터 구조

```typescript
// server/routers.ts
export const appRouter = router({
  auth: authRouter,           // 인증 API
  projects: projectsRouter,   // 프로젝트 API
  users: usersRouter,         // 사용자 API
  subscriptions: subscriptionsRouter, // 구독 API
  payments: paymentsRouter,   // 결제 API
  notifications: notificationsRouter, // 알림 API
  analytics: analyticsRouter, // 통계 API
  admin: adminRouter,         // 관리자 API
});
```

### 주요 프로시저 예시

#### 인증
- `auth.signUp` - 회원가입
- `auth.signIn` - 로그인
- `auth.logout` - 로그아웃
- `auth.me` - 현재 사용자 정보
- `auth.updateProfile` - 프로필 수정

#### 구독
- `subscriptions.create` - 구독 생성
- `subscriptions.cancel` - 구독 취소
- `subscriptions.upgrade` - 구독 업그레이드
- `subscriptions.list` - 구독 목록
- `subscriptions.getStatus` - 구독 상태 조회

#### 결제
- `payments.list` - 결제 이력 조회
- `payments.getReceipt` - 영수증 조회
- `payments.refund` - 환불 처리

#### 통계
- `analytics.getRevenue` - 매출 통계
- `analytics.getNewUsers` - 신규 가입자 통계
- `analytics.getChurn` - 이탈자 통계

---

## 6. 인증 플로우

```
┌─────────────────────────────────────────────────────────┐
│ 1. 사용자가 로그인 페이지 방문                            │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 2. Google/Kakao 소셜 로그인 버튼 클릭                    │
│    → Supabase Auth 리다이렉트                            │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 3. OAuth 제공자에서 인증 완료                            │
│    → Supabase Auth 콜백 처리                            │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 4. 사용자 정보 저장 (users 테이블)                       │
│    → JWT 토큰 발급 + 세션 쿠키 설정                      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 5. 대시보드로 리다이렉트                                 │
│    → 세션 쿠키로 인증 상태 유지                          │
└─────────────────────────────────────────────────────────┘
```

---

## 7. 결제 플로우 (Stripe)

```
┌─────────────────────────────────────────────────────────┐
│ 1. 사용자가 요금제 선택                                  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 2. 구독 생성 요청 (tRPC)                                 │
│    → Stripe Subscription 생성                           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 3. Stripe 결제 페이지 리다이렉트                         │
│    → 신용카드 정보 입력                                  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 4. 결제 처리 (Stripe)                                    │
│    → charge.succeeded 웹훅 발송                          │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 5. 웹훅 처리 (/api/webhooks/stripe)                      │
│    → payments 테이블 기록                                │
│    → subscriptions 테이블 업데이트                       │
│    → 이메일 발송 (결제 완료)                             │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 6. 사용자 대시보드에 구독 상태 표시                      │
└─────────────────────────────────────────────────────────┘
```

---

## 8. 자동화 플로우 (Heartbeat 스케줄러)

### 주간 리포트 (매주 월요일 오전 9시)
```
Heartbeat 크론 트리거
  ↓
analytics.getWeeklyStats() 호출
  ↓
매출, 신규 가입자, 이탈자 집계
  ↓
이메일 템플릿 렌더링
  ↓
관리자 이메일 발송
```

### 구독 만료 알림 (매일 자정)
```
Heartbeat 크론 트리거
  ↓
subscriptions 테이블 쿼리 (만료 예정)
  ↓
D-7: 알림 발송 (구독 만료 7일 전)
D-1: 알림 발송 (구독 만료 1일 전)
  ↓
이메일 + 인앱 알림 발송
```

---

## 9. 보안 고려사항

### 인증 & 권한
- Supabase Auth로 사용자 인증 관리
- JWT 토큰 기반 세션 (HttpOnly 쿠키)
- Row-Level Security (RLS) 정책으로 데이터 접근 제어
- 역할 기반 접근 제어 (RBAC): admin, user

### 결제 보안
- Stripe API 키는 환경변수로 관리 (절대 노출 금지)
- 웹훅 서명 검증 (Stripe 이벤트 위조 방지)
- PCI DSS 규정 준수 (결제 데이터 암호화)
- 환불 및 환불 취소 감사 로그 기록

### 데이터 보안
- 데이터베이스 연결 암호화 (SSL/TLS)
- 민감한 정보 암호화 (비밀번호, API 키)
- 정기 백업 및 복구 테스트
- 감사 로그로 모든 변경 사항 추적

---

## 10. 배포 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│ GitHub Repository (소스 코드)                            │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼──────────┐      ┌──────▼───────────┐
│ Vercel (Frontend)│      │ Cloud Run (API)  │
│ - React 빌드    │      │ - Express 서버   │
│ - CDN 캐싱      │      │ - tRPC 라우터    │
└───────┬──────────┘      └──────┬───────────┘
        │                         │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │ Supabase (Database)     │
        │ - PostgreSQL            │
        │ - Auth                  │
        │ - Real-time             │
        └─────────────────────────┘
```

---

## 11. 모니터링 및 로깅

- **Sentry**: 프론트엔드/백엔드 에러 추적
- **Google Analytics**: 사용자 행동 분석
- **Database Logs**: Supabase 쿼리 로그
- **Application Logs**: Express 서버 로그 (stdout)

---

## 12. 리셀러 복제 프로세스

신규 프로젝트 생성 시:

1. GitHub 저장소 포크 또는 복제
2. `.env.example` → `.env` 복사 및 환경변수 설정
3. `project-config.json` 수정 (프로젝트명, 로고 등)
4. Supabase 프로젝트 생성 및 DATABASE_URL 설정
5. Stripe 계정 생성 및 API 키 설정
6. `pnpm install` → `pnpm dev` 실행
7. 온보딩 체크리스트 완료

---

## 13. 향후 확장 계획

- **AI 챗봇**: 고객 지원 자동화
- **다국어 지원**: i18next 기반 국제화
- **모바일 앱**: React Native / Expo 기반 앱
- **고급 분석**: 머신러닝 기반 이탈 예측
- **마켓플레이스**: 플러그인/확장 프로그램 마켓플레이스
