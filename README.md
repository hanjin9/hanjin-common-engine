# 🏗️ 한진 공통 엔진 (hanjin-common-engine)

> **멀티 프로젝트 SaaS 공통 엔진 v1.0**  
> 여러 프로젝트에 선별적으로 붙여 쓰는 모듈형 백엔드 엔진

[![TypeScript](https://img.shields.io/badge/TypeScript-0_errors-blue)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-26%2F26_passing-green)](./tests)
[![Version](https://img.shields.io/badge/CORE-v1.0-red)](./STRATEGY_REPORT.md)

---

## 🏛️ 레이어 체계

```
🔴 CORE ENGINE      ← 모든 프로젝트 필수 (인증·결제·멤버십·관리자·알림)
🟡 STANDARD MODULE  ← 중형 이상 선택 (미션·이벤트·수면·스케줄러)
🔵 GLWA EXTENSION   ← GLWA 전용 (AI엔진·커뮤니티·건강추적·랭킹)
```

자세한 내용: [STRATEGY_REPORT.md](./STRATEGY_REPORT.md)

---

## 📦 프로젝트별 모듈 구성

| 모듈 | 숨호흡 | 장부관리사 | 스포츠회복사 | 로또 | **GLWA** |
|------|:------:|:----------:|:------------:|:----:|:--------:|
| 🔴 인증 (OAuth) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 🔴 결제 (Stripe) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 🔴 멤버십 11단계 | ✅ | ✅ | ✅ | — | ✅ |
| 🔴 관리자 대시보드 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 🔴 이메일 알림 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 🟡 미션 시스템 | ✅ | — | ✅ | — | ✅ |
| 🟡 이벤트 캘린더 | — | — | ✅ | — | ✅ |
| 🟡 수면 추적 | ✅ | — | — | — | ✅ |
| 🔵 AI 피드백 엔진 | — | — | — | — | ✅ |
| 🔵 커뮤니티 | — | — | — | — | ✅ |
| 🔵 Google Fit | — | — | — | — | ✅ |

---

## 🚀 빠른 시작

```bash
# 1. 클론
git clone https://github.com/hanjin9/hanjin-common-engine.git
cd hanjin-common-engine

# 2. 의존성 설치
pnpm install

# 3. 환경변수 설정
cp .env.example .env
# .env 파일 열어서 필수값 입력 (아래 최소 체크리스트 참고)

# 4. DB 스키마 생성
pnpm drizzle-kit push

# 5. 개발 서버 시작
pnpm dev
```

### ✅ 최소 실행 체크리스트

```env
DATABASE_URL=mysql://...          # TiDB 또는 MySQL
OAUTH_SERVER_URL=https://...      # Manus 인증
BUILT_IN_FORGE_API_KEY=...        # Manus API 키
STRIPE_SECRET_KEY=sk_test_...     # Stripe (테스트 키로 시작)
JWT_SECRET=random_long_string     # 임의 랜덤 문자열
```

---

## 💳 Stripe 결제 테스트

**실제 카드 불필요** — Stripe 테스트 모드 사용

```bash
# 테스트 카드번호 (Stripe 제공)
카드번호: 4242 4242 4242 4242
만료일:   임의 (미래 날짜, 예: 12/26)
CVC:      임의 3자리 (예: 123)
```

### Stripe 웹훅 로컬 테스트

```bash
# 1. Stripe CLI 설치
brew install stripe/stripe-cli/stripe

# 2. 로그인
stripe login

# 3. 웹훅 포워딩 (개발 서버 실행 중)
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 4. 테스트 결제 트리거
stripe trigger checkout.session.completed
```

---

## 🗄️ DB 스키마 주요 테이블

| 테이블 | 설명 |
|--------|------|
| `users` | 사용자 (OAuth 연동) |
| `membershipTiers` | 11단계 멤버십 정의 |
| `userMemberships` | 사용자별 멤버십 현황 |
| `stripePayments` | 결제 이력 |
| `stripeSubscriptions` | 구독 현황 |
| `projects` | 멀티테넌트 프로젝트 |
| `projectMembers` | 프로젝트 멤버 |

---

## 🔌 tRPC API 주요 엔드포인트

```typescript
// 🔴 CORE
trpc.auth.me                              // 현재 사용자
trpc.payment.createCheckoutSession        // Stripe 결제 시작
trpc.payment.getPaymentList               // 결제 이력 조회
trpc.payment.getSettlementSummary         // 정산 요약
trpc.payment.refundPayment                // 환불 처리
trpc.wellness.membership.*               // 멤버십 관리
trpc.admin.getAnalytics                  // 관리자 통계 (11단계 분포)
trpc.admin.getProjects                   // 프로젝트 목록

// 🟡 STANDARD
trpc.mission.*                           // 미션 시스템
trpc.event.*                             // 이벤트 관리
trpc.scheduler.*                         // 스케줄러

// 🔵 GLWA EXTENSION
trpc.ai.*                                // AI 피드백
trpc.healthAi.*                          // 건강 AI + 랭킹
trpc.community.*                         // 커뮤니티
trpc.googleFit.*                         // Google Fit 연동
```

---

## 🧪 테스트

```bash
pnpm test              # 전체 테스트 실행
pnpm test --watch      # 감시 모드
npx tsc --noEmit       # TypeScript 타입 체크
```

**현재 상태**: 26/26 통과 ✅ · TS 에러 0개 ✅

---

## 📁 디렉토리 구조

```
server/
├── _core/              # OAuth, tRPC, 쿠키, 이메일 알림
├── modules/
│   ├── 🔴 admin/       # CORE: 관리자 라우터
│   ├── 🔴 payment/     # CORE: Stripe 결제
│   ├── 🔴 stripe/      # CORE: Stripe 라우터
│   ├── 🔴 membership/  # CORE: 멤버십 팩토리
│   ├── 🔴 notifications/ # CORE: 이메일
│   ├── 🔴 permissions/ # CORE: RBAC
│   ├── 🔴 monitoring/  # CORE: 감사로그·에러·Sentry
│   ├── 🟡 mission/     # STANDARD: 미션
│   ├── 🟡 event/       # STANDARD: 이벤트
│   ├── 🟡 scheduler/   # STANDARD: 스케줄러
│   ├── 🟡 sleep/       # STANDARD: 수면
│   ├── 🟡 wellness/    # STANDARD: 웰니스
│   ├── 🔵 ai/          # GLWA: AI 엔진
│   ├── 🔵 health-ai/   # GLWA: 건강 AI
│   ├── 🔵 community/   # GLWA: 커뮤니티
│   ├── 🔵 googleFit/   # GLWA: Google Fit
│   ├── 🔵 projects/    # GLWA: 프랜차이즈·커뮤니티
│   └── _archive/       # 미사용 (컴파일 제외)
client/src/
├── pages/              # 관리자 대시보드 UI
└── pages/_archive/     # 미사용 페이지
drizzle/
└── schema.ts           # 전체 DB 스키마 (70+ 테이블)
```

---

## 📊 완성도 현황

| 레이어 | 완성도 | 상태 |
|--------|--------|------|
| 🔴 CORE ENGINE | **95%** | 마무리 단계 |
| 🟡 STANDARD MODULE | 70% | 확장 모드 |
| 🔵 GLWA EXTENSION | 65% | GLWA 이식 시 완성 |

---

© 2026 Han Jin Kim · MIT License
