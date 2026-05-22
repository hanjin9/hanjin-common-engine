# 한진 공통 엔진 — 전략 보고서 v1.0

**작성일**: 2026-05-22  
**상태**: 마무리 단계 전환 결정문  
**테스트**: 26/26 통과 · TypeScript 에러 0개

---

## 1. 현재 진단 요약

### 문제: "공통 엔진"인데 GLWA 전용 코드가 섞여 있음

| 구분 | 현재 상태 | 판단 |
|------|----------|------|
| 서버 모듈 수 | 51개 | 과다 — 정리 필요 |
| 라우터 등록 수 | 24개 | 절반은 GLWA 전용 |
| 클라이언트 페이지 | 41개 | ComponentShowcase(1437줄) 등 불필요 |
| 핵심 완성도 | **95%** | 마무리 가능 |
| 확장 완성도 | 60~70% | 나중에 |

---

## 2. 최종 명칭 체계 (확정)

```
hanjin-common-engine
│
├── 🔴 CORE ENGINE (핵심 엔진) ── 모든 프로젝트 필수
│   "이것 없으면 프로젝트 자체가 안 돌아간다"
│
├── 🟡 STANDARD MODULE (표준 모듈) ── 중형 프로젝트 이상
│   "대부분 붙이지만 소형 앱은 선택"
│
├── 🔵 GLWA EXTENSION (GLWA 확장) ── GLWA 전용
│   "GLWA 최대 프로젝트에만 필요한 풀스택 AI/커뮤니티"
│
└── 🗄️  ARCHIVED (아카이브) ── 제거 대상
    "공통 엔진 목적에서 벗어난 코드"
```

---

## 3. 모듈 분류 확정표

### 🔴 CORE ENGINE — 마무리 단계 (지금 집중)

| 모듈 | 파일 | 완성도 | 비고 |
|------|------|--------|------|
| 인증 (OAuth) | `_core/oauth.ts` | ✅ 95% | 완성 |
| 결제 (Stripe) | `payment/paymentRouter.ts` + `stripeWebhook.ts` | ✅ 90% | 완성 |
| 멤버십 11단계 | `membership/projectMembershipFactory.ts` | ✅ 85% | 완성 |
| 관리자 대시보드 | `admin/adminRouter.ts` | ✅ 85% | 완성 |
| 이메일 알림 | `notifications/email.ts` + `stripe-email.ts` | ✅ 80% | 완성 |
| 권한 관리 (RBAC) | `permissions/rbac.ts` | ✅ 90% | 완성 |
| 웹훅 처리 | `stripe/webhook.ts` + `webhooks/retry.ts` | ✅ 85% | 완성 |
| 실시간 소켓 | `realtime/socket.ts` | ✅ 75% | 완성 |
| 감사 로그 | `monitoring/audit-log.ts` | ✅ 80% | 완성 |
| 에러 모니터링 | `monitoring/error-handler.ts` + `sentry.ts` | ✅ 80% | 완성 |

**CORE 목표: 테스트 커버리지 확보 후 v1.0 릴리즈**

---

### 🟡 STANDARD MODULE — 확장 모드 (필요할 때)

| 모듈 | 파일 | 완성도 | 붙이는 프로젝트 |
|------|------|--------|----------------|
| 미션 시스템 | `mission/missionRouter.ts` | 70% | 숨호흡, GLWA, 스포츠 |
| 이벤트 캘린더 | `event/eventRouter.ts` | 70% | GLWA, 스포츠 |
| 스케줄러 | `scheduler/` | 75% | 모든 구독 서비스 |
| 수면 추적 | `sleep/sleepRouter.ts` | 70% | 숨호흡, GLWA |
| 프로젝트 관리 | `projects/router.ts` | 70% | 어드민 전용 |
| 웰니스 | `wellness/` (3개) | 70% | GLWA, 숨호흡 |

---

### 🔵 GLWA EXTENSION — GLWA 전용 (glwa-wellness-app에서 사용)

| 모듈 | 파일 | 완성도 | 비고 |
|------|------|--------|------|
| AI 피드백 엔진 | `ai/` (4개, 1810줄) | 65% | GLWA 전용 |
| 건강 AI | `health-ai/` (2개) | 70% | GLWA 전용 |
| 커뮤니티 | `community/communityRouter.ts` | 65% | GLWA 전용 |
| 랭킹 시스템 | `health-ai/rankingRouter.ts` | 70% | GLWA 전용 |
| Google Fit | `googleFit/` (2개) | 60% | GLWA 전용 |
| 웨어러블 | `wearable/wearableRouter.ts` | 60% | GLWA 전용 |
| GLWA 프랜차이즈 | `projects/glwa-franchise.ts` | 75% | GLWA 전용 |
| GLWA 커뮤니티 | `projects/glwa-community.ts` | 75% | GLWA 전용 |
| 피드백 고급 | `feedbackAdvanced/` + `feedback/` (4개) | 60% | GLWA 전용 |
| 고급 분석 | `analytics/advanced.ts` | 65% | GLWA 전용 |
| 글로벌 | `global/globalRouter.ts` | 50% | GLWA 국제화 |

---

### 🗄️ ARCHIVED — 제거 대상 (공통 엔진 목적 이탈)

| 파일 | 이유 | 조치 |
|------|------|------|
| `_archive/authjs-integration.ts` | 이미 아카이브됨 | 삭제 |
| `paymentAdvanced/paymentAdvancedRouter.ts` | payment/paymentRouter.ts와 중복 | 통합 후 삭제 |
| `operations/operationsRouter.ts` | 범위 불명확 | 아카이브 |
| `copy/copyRouter.ts` | 마케팅 카피 — 엔진 목적 이탈 | GLWA 확장으로 이동 |
| `feedback/voiceGenerator.ts` | 음성 생성 — 과도한 범위 | GLWA 확장으로 이동 |
| `ComponentShowcase.tsx` (1437줄) | UI 쇼케이스 — 프로덕션 불필요 | 삭제 |
| `AdminDashboard.tsx` (531줄, 루트) | `AdminDashboard/index.tsx`와 중복 | 삭제 |

---

## 4. 프로젝트별 모듈 구성 매트릭스

| 모듈 | 숨호흡 | 장부관리사 | 스포츠회복사 | 로또 | **GLWA** |
|------|:------:|:----------:|:------------:|:----:|:--------:|
| 🔴 인증 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 🔴 결제 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 🔴 멤버십 | ✅ | ✅ | ✅ | — | ✅ |
| 🔴 관리자 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 🔴 알림 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 🟡 미션 | ✅ | — | ✅ | — | ✅ |
| 🟡 이벤트 | — | — | ✅ | — | ✅ |
| 🟡 수면 | ✅ | — | — | — | ✅ |
| 🟡 스케줄러 | ✅ | ✅ | ✅ | — | ✅ |
| 🔵 AI 엔진 | — | — | — | — | ✅ |
| 🔵 커뮤니티 | — | — | — | — | ✅ |
| 🔵 건강 AI | — | — | — | — | ✅ |
| 🔵 Google Fit | — | — | — | — | ✅ |
| 🔵 랭킹 | — | — | — | — | ✅ |

---

## 5. 마무리 단계 로드맵

### Phase 1: CORE 완성 (지금 — 이번 주)
```
✅ 완료
- Stripe 결제 UI (MembershipCheckout + PaymentSuccess)
- 관리자 대시보드 실제 DB 연동
- 테스트 26/26 통과 · TS 에러 0개
- 레이어 구조 문서화

🔄 남은 것 (3가지만)
1. 불필요 파일 아카이브/삭제 (ComponentShowcase, 중복 AdminDashboard.tsx)
2. paymentAdvanced → payment 통합
3. CORE 모듈 통합 테스트 시나리오 1회 실행
```

### Phase 2: v1.0 릴리즈 (이번 주 말)
```
- README.md: 프로젝트별 모듈 선택 가이드
- .env.example 완성
- Docker/배포 가이드
- CORE 엔진 v1.0 태그
```

### Phase 3: GLWA 확장 (다음 단계)
```
- AI 엔진 완성 (GLWA 전용)
- 커뮤니티 기능 완성
- 고급 분석 완성
- glwa-wellness-app에 이식
```

---

## 6. 즉시 실행 결정 사항

### ✂️ 지금 바로 정리할 것 (리스크 없음)

```bash
# 삭제
client/src/pages/ComponentShowcase.tsx     # 1437줄 쇼케이스
client/src/pages/AdminDashboard.tsx        # 루트 중복 (index.tsx 있음)
server/modules/_archive/                   # 이미 아카이브된 것

# 아카이브 이동
server/modules/operations/ → _archive/
server/modules/paymentAdvanced/ → payment/ 통합
server/modules/copy/ → GLWA 확장 표시
server/modules/feedback/voiceGenerator.ts → _archive/
```

### 🏁 완성 선언 기준 (CORE v1.0)

- [ ] 불필요 파일 정리 완료
- [ ] 테스트 26/26 유지
- [ ] TS 에러 0개 유지  
- [ ] README 프로젝트별 가이드 완성
- [ ] 실제 Stripe 결제 E2E 1회 성공

---

## 결론

> **핵심 엔진은 95% 완성 상태입니다.**  
> 정리하고 릴리즈하는 것이 최우선.  
> GLWA 확장 기능은 glwa-wellness-app 작업 시 이식.  
> 지금 추가 기능 개발은 완성도를 낮출 뿐입니다.

**다음 액션: 불필요 파일 정리 → v1.0 릴리즈 → GLWA 이식**
