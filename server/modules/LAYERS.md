# 한진 공통 엔진 — 서버 모듈 레이어 구조

## 🔴 CORE (모든 프로젝트 필수)
| 파일 | 역할 | 완성도 |
|------|------|--------|
| `admin/adminRouter.ts` | 관리자 통계 API (DB 연동) | 85% |
| `notifications/email.ts` | 이메일 발송 (Resend) | 80% |
| `notifications/stripe-email.ts` | 결제 이메일 템플릿 | 80% |
| `payment/paymentRouter.ts` | Stripe 결제 API | 90% |
| `payment/stripeWebhook.ts` | Stripe 웹훅 처리 | 85% |
| `membership/projectMembershipFactory.ts` | 멤버십 팩토리 | 85% |
| `stripe/router.ts` | Stripe tRPC 라우터 | 85% |
| `stripe/webhook.ts` | Stripe 웹훅 (추가) | 80% |
| `permissions/rbac.ts` | 역할 기반 접근 제어 | 90% |

## 🟡 PLUGINS (선택적 사용)
| 파일 | 역할 | 완성도 |
|------|------|--------|
| `health-ai/healthAiRouter.ts` | AI 건강 분석 | 70% |
| `health-ai/rankingRouter.ts` | 백분위 랭킹 | 70% |
| `ai/aiRouter.ts` | AI 피드백 라우터 | 65% |
| `ai/feedbackEngine.ts` | 피드백 엔진 | 65% |
| `mission/missionRouter.ts` | 미션 시스템 | 70% |
| `event/eventRouter.ts` | 이벤트 관리 | 70% |
| `scheduler/schedulerRouter.ts` | 스케줄러 | 75% |
| `community/communityRouter.ts` | 커뮤니티 | 65% |
| `googleFit/googleFitRouter.ts` | Google Fit 연동 | 60% |
| `wearable/wearableRouter.ts` | 웨어러블 연동 | 60% |
| `sleep/sleepRouter.ts` | 수면 추적 | 70% |
| `analytics/analyticsRouter.ts` | 고급 분석 | 65% |
| `realtime/socket.ts` | 실시간 소켓 | 75% |

## 🔵 PROJECT-SPECIFIC
| 파일 | 역할 | 완성도 |
|------|------|--------|
| `projects/glwa-franchise.ts` | GLWA 프랜차이즈 | 75% |
| `projects/glwa-community.ts` | GLWA 커뮤니티 | 75% |
| `projects/router.ts` | 프로젝트 공통 라우터 | 70% |

## ⚙️ INFRA (공통 인프라)
| 파일 | 역할 |
|------|------|
| `monitoring/audit-log.ts` | 감사 로그 (DB 연동) |
| `monitoring/error-handler.ts` | 에러 핸들러 |
| `webhooks/retry.ts` | 웹훅 재시도 |
| `scheduler/bullmq.ts` | BullMQ 큐 |

> 📌 폴더 물리적 이동은 나중에 — 현재는 이 문서로 레이어 구분 명확화
