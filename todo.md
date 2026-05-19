# 한진 공통 엔진(Hanjin Common Engine) - 개발 체크리스트

## 🎯 1차 배치: 멀티테넌트 프로젝트 관리 시스템 (진행 중)

### 1.0 멀티테넌트 핵심 기능
- [x] 10개 멀티테넌트 테이블 생성 (projects, projectMembers, projectAuthConfig, projectSubscriptionPlans, projectSubscriptions, projectPayments, projectStatistics, projectAuditLogs, projectWebhookEvents, projectNotificationSettings)
- [x] Drizzle ORM 스키마 정의 완료
- [x] 관계(Relations) 정의 완료
- [x] GLWA 프랜차이즈 API (9개 엔드포인트)
- [x] GLWA 커뮤니티 API (8개 엔드포인트)
- [x] 라우터 통합 완료
- [x] Vitest 단위 테스트 작성 (19개 테스트 전체 통과)
- [x] API 엔드포인트 단위테스트 검증 완료 (Vitest 19개 전체 통과)
- [ ] 실제 API 엔드포인트 동작 검증 (tRPC caller/curl로 projects.* 및 wellness.* 실제 호출 확인)
- [x] glwa-wellness-app GitHub 전수 스캔 완료
- [x] 관리자 대시보드 필수 테이블 13개 추가 (멤버십/포인트/지갑/알림/주문/쿠폰/이벤트)
- [x] 멤버십 8단계 초기 데이터 삽입 (Silver ~ Black Platinum)
- [x] membershipRouter 이식 (8개 엔드포인트)
- [x] operatorRouter 이식 (운영자 모니터링)
- [x] tierRouter 이식 (10단계 수련 시스템)
- [x] tenTierSystem.ts 공유 모듈 이식
- [x] TypeScript 컴파일 에러 0개 달성
- [x] 불필요 파일 제거 완료 (oauth-providers.ts)

---

## Phase 1: 기초 구조 설계 및 DB 스키마 (1주차)

### 1.1 프로젝트 구조 및 문서화
- [ ] 프로젝트 폴더 구조 최종 확정 (docs/, modules/, templates/ 등)
- [ ] README.md 작성 (영문/국문 이중 언어)
- [ ] 아키텍처 다이어그램 작성 (Mermaid)
- [ ] API 명세서 작성 (OpenAPI/Swagger 포맷)
- [ ] 환경변수 설정 가이드 작성

### 1.2 Supabase 통합 인증 모듈
- [ ] 기존 Manus OAuth 구조 분석 및 Supabase Auth 통합 설계
- [ ] Google OAuth 소셜 로그인 구현
- [ ] Kakao OAuth 소셜 로그인 구현
- [ ] 이메일/비밀번호 기반 인증 구현
- [ ] OTP(One-Time Password) 구현
- [ ] 매직링크(Magic Link) 구현
- [ ] 세션 관리 로직 (JWT + 쿠키)
- [ ] 공개/보호 페이지 라우팅 미들웨어
- [ ] 비밀번호 재설정 플로우
- [ ] 프로필 편집 및 아바타 업로드

### 1.3 Supabase 멀티 프로젝트 DB 스키마
- [ ] projects 테이블 설계 (프로젝트 메타데이터)
- [ ] users 테이블 확장 (프로젝트별 사용자 매핑)
- [ ] subscriptions 테이블 설계 (구독 정보)
- [ ] subscription_plans 테이블 설계 (요금제)
- [ ] payments 테이블 설계 (결제 이력)
- [ ] payment_events 테이블 설계 (Stripe 웹훅 이벤트)
- [ ] certifications 테이블 설계 (자격증/인증 정보)
- [ ] audit_logs 테이블 설계 (감사 로그)
- [ ] DB 마이그레이션 SQL 생성 및 적용
- [ ] Row-Level Security (RLS) 정책 설정

---

## Phase 2: Stripe 글로벌 결제 모듈 (1주차)

### 2.1 Stripe 결제 기본 구조
- [ ] Stripe API 키 환경변수 설정
- [ ] Stripe SDK 통합 (server/modules/stripe.ts)
- [ ] 결제 고객(Customer) 생성 로직
- [ ] 결제 의도(Payment Intent) 생성 로직
- [ ] 결제 검증 및 확인 로직

### 2.2 구독(Subscription) 관리
- [ ] Stripe Product & Price 생성 API
- [ ] 구독 생성 로직 (tRPC 프로시저)
- [ ] 구독 취소 로직
- [ ] 구독 업그레이드/다운그레이드 로직
- [ ] 구독 상태 조회 API
- [ ] 구독 갱신 자동화 (Stripe 기본 기능)

### 2.3 Stripe 웹훅 처리
- [ ] 웹훅 엔드포인트 구현 (/api/webhooks/stripe)
- [ ] 웹훅 서명 검증 로직
- [ ] charge.succeeded 이벤트 처리
- [ ] charge.failed 이벤트 처리
- [ ] customer.subscription.updated 이벤트 처리
- [ ] customer.subscription.deleted 이벤트 처리
- [ ] 웹훅 재시도 로직 및 에러 핸들링

### 2.4 결제 이력 및 영수증
- [ ] 결제 이력 조회 API
- [ ] 영수증 생성 로직
- [ ] 환불(Refund) 처리 로직
- [ ] 결제 상태 추적 대시보드

---

## Phase 3: 중앙 관리자 대시보드 (2주차)

### 3.1 사용자 관리 대시보드
- [ ] 전체 프로젝트 사용자 목록 조회
- [ ] 사용자 검색 및 필터링 (프로젝트별, 역할별, 구독 상태별)
- [ ] 사용자 역할(admin/user) 변경 UI
- [ ] 사용자 구독 상태 조회
- [ ] 사용자 자격증/인증 현황 조회
- [ ] 사용자 상세 정보 페이지
- [ ] 사용자 일괄 작업 (역할 변경, 구독 취소 등)

### 3.2 멀티 프로젝트 관리 패널
- [ ] 6개 프로젝트 등록 UI (장부관리사, 스포츠회복사, 로또, GLWA, 숨호흡, 랜딩)
- [ ] 프로젝트별 메타데이터 관리 (이름, 설명, 로고, URL)
- [ ] 프로젝트별 사용자 수 모니터링
- [ ] 프로젝트별 결제 현황 모니터링
- [ ] 프로젝트 활성화/비활성화 토글
- [ ] 프로젝트별 API 키 관리

### 3.3 구독 및 플랜 관리
- [ ] 프로젝트별 요금제 설정 UI
- [ ] 요금제 생성/편집/삭제
- [ ] 요금제 가격 및 청구 주기 설정
- [ ] 구독 생성 UI (관리자가 사용자를 위해 수동 생성)
- [ ] 구독 취소 UI
- [ ] 구독 업그레이드/다운그레이드 UI
- [ ] 구독 만료 알림 설정

### 3.4 관리자 통계 대시보드
- [ ] 프로젝트별 신규 가입자 수 차트 (주간/월간)
- [ ] 프로젝트별 결제 매출 차트 (주간/월간)
- [ ] 프로젝트별 활성 구독자 수 카드
- [ ] 프로젝트별 이탈자 수 추적
- [ ] KPI 요약 카드 (총 매출, 총 사용자, 활성 구독 수)
- [ ] 실시간 결제 알림 (최근 결제 목록)
- [ ] 구독 만료 예정 알림

---

## Phase 4: 자동화 및 알림 시스템 (2주차)

### 4.1 이벤트 기반 자동 이메일 발송
- [ ] 이메일 템플릿 시스템 구축 (Resend + React Email)
- [ ] 회원가입 환영 이메일 템플릿
- [ ] 결제 완료 이메일 템플릿
- [ ] 구독 갱신 이메일 템플릿
- [ ] 구독 만료 안내 이메일 템플릿
- [ ] 구독 만료 D-7 알림 이메일
- [ ] 구독 만료 D-1 알림 이메일
- [ ] 결제 실패 알림 이메일
- [ ] 이메일 발송 로그 및 재시도 로직

### 4.2 인앱 알림 시스템
- [ ] 인앱 알림 DB 스키마 설계
- [ ] 알림 생성 API
- [ ] 알림 조회 API
- [ ] 알림 읽음 표시 API
- [ ] 알림 삭제 API
- [ ] 실시간 알림 푸시 (WebSocket 또는 Server-Sent Events)
- [ ] 알림 UI 컴포넌트 (토스트, 배너, 센터 모달)

### 4.3 Heartbeat 스케줄러 기반 자동화
- [ ] 주간 리포트 자동 발송 (매주 월요일 오전 9시)
- [ ] 구독 만료 D-7 자동 알림 (Heartbeat 크론)
- [ ] 구독 만료 D-1 자동 알림 (Heartbeat 크론)
- [ ] 결제 실패 자동 재시도 (Heartbeat 크론)
- [ ] 미사용 구독 정리 (Heartbeat 크론)
- [ ] 통계 데이터 집계 (Heartbeat 크론)

### 4.4 주간 리포트 자동 발송
- [ ] 주간 매출 통계 집계
- [ ] 주간 신규 가입자 통계 집계
- [ ] 주간 이탈자 통계 집계
- [ ] 리포트 이메일 템플릿 설계
- [ ] 관리자 이메일 주소 설정
- [ ] 리포트 발송 스케줄 설정

---

## Phase 5: 리셀러 엔진 복제 가이드 (1주차)

### 5.1 온보딩 가이드 페이지
- [ ] 신규 프로젝트 온보딩 체크리스트 페이지
- [ ] 단계별 설정 마법사 (Step 1~5)
- [ ] 각 단계별 완료 상태 추적

### 5.2 환경변수 설정 가이드
- [ ] 필수 환경변수 목록 (Supabase, Stripe, OAuth 등)
- [ ] 환경변수 설정 방법 (로컬 개발 vs 프로덕션)
- [ ] 보안 모범 사례 문서
- [ ] 환경변수 검증 스크립트

### 5.3 API 연동 명세서
- [ ] 인증 API 명세 (로그인, 로그아웃, 프로필 조회)
- [ ] 결제 API 명세 (구독 생성, 취소, 업그레이드)
- [ ] 사용자 관리 API 명세 (역할 변경, 자격증 관리)
- [ ] 통계 API 명세 (매출, 가입자, 이탈자)
- [ ] 웹훅 명세 (Stripe, 커스텀 이벤트)
- [ ] cURL 예제 및 JavaScript 클라이언트 예제

### 5.4 GitHub 저장소 관리
- [ ] GitHub 저장소 초기화 및 README 작성
- [ ] 폴더 구조 문서화
- [ ] 커밋 히스토리 정리
- [ ] 태그 및 릴리스 노트 작성
- [ ] 기여 가이드(CONTRIBUTING.md) 작성

---

## Phase 6: 디자인 및 UI 구현 (2주차)

### 6.1 국제 타이포그래피 스타일 적용
- [ ] 디자인 토큰 정의 (색상, 타이포그래피, 간격)
- [ ] Tailwind CSS 커스텀 설정
- [ ] 색상 팔레트 (순백 배경, 검정 텍스트, 빨간 포인트)
- [ ] 타이포그래피 설정 (산세리프, 굵은 헤딩, 가는 본문)

### 6.2 관리자 대시보드 UI
- [ ] 레이아웃 구조 (사이드바, 헤더, 메인 콘텐츠)
- [ ] 네비게이션 메뉴 구현
- [ ] 대시보드 홈 페이지
- [ ] 사용자 관리 페이지 UI
- [ ] 프로젝트 관리 페이지 UI
- [ ] 구독 관리 페이지 UI
- [ ] 통계 대시보드 페이지 UI
- [ ] 설정 페이지 UI

### 6.3 공개 페이지 UI
- [ ] 랜딩 페이지
- [ ] 로그인 페이지
- [ ] 회원가입 페이지
- [ ] 비밀번호 재설정 페이지
- [ ] 요금제 페이지
- [ ] 문서 페이지 (가이드, FAQ)

### 6.4 컴포넌트 라이브러리
- [ ] 버튼, 입력 필드, 카드 등 기본 컴포넌트
- [ ] 테이블, 차트, 그래프 컴포넌트
- [ ] 폼 컴포넌트 (입력 검증 포함)
- [ ] 모달, 드로어, 토스트 컴포넌트
- [ ] 로딩 상태 및 스켈레톤 컴포넌트

---

## Phase 7: 테스트 및 배포 (1주차)

### 7.1 단위 테스트
- [ ] 인증 로직 테스트
- [ ] 결제 로직 테스트
- [ ] DB 쿼리 테스트
- [ ] API 엔드포인트 테스트
- [ ] 유틸리티 함수 테스트

### 7.2 통합 테스트
- [ ] 회원가입 → 로그인 → 프로필 조회 플로우
- [ ] 구독 생성 → 결제 → 구독 확인 플로우
- [ ] 관리자 대시보드 전체 기능 테스트

### 7.3 배포 및 문서화
- [ ] 프로덕션 배포 체크리스트
- [ ] 배포 후 검증 스크립트
- [ ] 모니터링 설정 (Sentry, Google Analytics)
- [ ] 최종 문서 작성 (설치, 설정, 운영 가이드)

---

## 추가 작업

### 보안 및 규정 준수
- [ ] GDPR 규정 준수 (개인정보 보호)
- [ ] PCI DSS 규정 준수 (결제 보안)
- [ ] 데이터 암호화 (전송 중, 저장 시)
- [ ] 접근 제어 및 권한 관리 (RBAC)
- [ ] 감사 로그 및 모니터링

### 성능 최적화
- [ ] 데이터베이스 인덱싱
- [ ] API 응답 캐싱
- [ ] 프론트엔드 번들 최적화
- [ ] 이미지 최적화
- [ ] CDN 설정

### 모니터링 및 운영
- [ ] 에러 추적 (Sentry)
- [ ] 성능 모니터링 (Google Analytics)
- [ ] 로그 수집 및 분석
- [ ] 알림 설정 (이상 탐지)
- [ ] 정기 백업 및 복구 테스트

---

## 진행 상황 요약

| Phase | 상태 | 예상 완료 |
|:---:|:---:|:---:|
| Phase 1 | ⏳ 진행 중 | 5월 26일 |
| Phase 2 | ⏳ 대기 중 | 6월 2일 |
| Phase 3 | ⏳ 대기 중 | 6월 16일 |
| Phase 4 | ⏳ 대기 중 | 6월 23일 |
| Phase 5 | ⏳ 대기 중 | 6월 30일 |
| Phase 6 | ⏳ 대기 중 | 7월 14일 |
| Phase 7 | ⏳ 대기 중 | 7월 21일 |

---

## 참고사항

- 모든 코드는 GitHub에 커밋하며, 주요 마일스톤마다 릴리스 태그를 생성합니다.
- 각 Phase 완료 시 Google Drive에 자동 백업합니다.
- 주간 리포트는 매주 월요일 오전 9시에 자동 발송됩니다.
- 모든 문서는 영문/국문 이중 언어로 작성됩니다.

---

## 🧠 2차 배치: AI 피드백 엔진 완전 재구현 (진행 중)

- [ ] 피드백 엔진 DB 스키마 (biodataRecords, feedbackLogs, conversationHistory, dailyMissions, userFeedbackProfile)
- [ ] DB 마이그레이션 실행
- [ ] feedbackEngine.ts - 3단계 피드백 (즉시/심화/VIP)
- [ ] realtimeCoachingEngine.ts - 실시간 코칭 (7가지 활동, 5개 언어, 포인트 연동)
- [ ] personalMemoryEngine.ts - 개인 메모리 (DB 기반, 패턴 인식, 인사이트)
- [ ] conversationAI.ts - 대화형 AI (감정 인식, 성격 학습, 문맥 이해)
- [ ] mobileBiodataCollector.ts - 모바일 생체 데이터 수집 (카메라 심박수, 마이크 호흡, 얼굴 안색)
- [ ] dailyMissionDirector.ts - AI 일일 지시 + 알림 시스템
- [ ] feedbackNeuralNetwork.ts - 신경망 연결 레이어 (모든 모듈 완전 통합)
- [ ] tRPC 라우터 통합 (feedback.*)
- [ ] Vitest 테스트 작성
- [ ] 체크포인트 저장

---

## 📱 헬스 데이터 연동 설계 (플랫폼별 분리)

- [ ] DB 스키마에 dataSource 필드 추가 ('self' / 'google_fit' / 'apple_health' / 'samsung_health')
- [ ] 헬스 데이터 연동 인터페이스 설계 (HealthDataProvider 추상 클래스)
- [ ] Android/Samsung Health Connect 연동 준비 (Capacitor 앱 전환 시 사용)
- [ ] Apple HealthKit 연동 준비 (Capacitor 앱 전환 시 사용)
- [ ] 자체 수집 모듈 구현 (Web Audio API + DeviceMotion API)
- [ ] 수면 감지 알고리즘 (밤 10시 이후 + 30분 이상 정지)
- [ ] 수면 중 호흡 분석 (마이크 100-400Hz 대역 분석)
- [ ] 낮 컨디션 분석 (목소리 에너지/리듬/스트레스 추정)

---

## 🏆 멤버십 유연 구조 재설계 (2026-05-20)

- [ ] GLWA 멤버십 최대 10단계 확장 가능 구조 (DB 스키마 projectMembershipTiers 테이블 신설)
- [ ] 멤버십 단계 수를 프로젝트별로 동적 설정 (2~10단계 자유 설정)
- [ ] 숨호흡 앱 4단계 독립 멤버십 (Silver/Gold/Platinum/VIP - 결제 연결 없음)
- [ ] 프로젝트별 멤버십 팩토리 완전 분리 구조 완성
- [ ] AdminDashboard 멤버십 탭 프로젝트별 분리 UI
- [ ] TypeScript 에러 0개 유지
- [ ] Vitest 테스트 추가

- [ ] GitHub glwa-wellness-app: vipTierSystem.ts 10단계 확정본 반영 (bronze/emerald/sapphire 추가)
- [ ] GitHub glwa-wellness-app: schema.ts membershipTiers enum 10단계로 확장
- [ ] GitHub glwa-wellness-app: membershipRouter.ts 10단계 포인트 임계값 업데이트
- [ ] hanjin-common-engine 팩토리 시드 데이터 GitHub 원본 수치로 동기화
- [ ] 두 레포 모두 커밋/푸시 완료

- [ ] 글로벌 럭셔리 멤버십 벤치마크 조사 (BMW, 아메스 블랙, 호텔 VIP 등)
- [ ] DB 스키마: membership_policy_history 테이블 추가 (정책 변경 이력)
- [ ] tRPC: adminUpdateTierPolicy 프로시저 (혜택/연회비/포인트/색상 수정)
- [ ] MembershipDashboard: 단계별 정책 편집 모달 UI (인라인 편집)
- [ ] MembershipDashboard: 정책 변경 이력 탭 UI
- [ ] 럭셔리 벤치마크 기능 항목 GLWA 멤버십에 반영

---

## 😴 수면 자동 체크 기능 (2026-05-20)

- [x] DB 스키마: sleepTrackingSettings 테이블 (기본값 enabled=true, optOut 지원)
- [x] DB 마이그레이션 실행
- [x] tRPC: getSleepSettings 프로시저 (사용자별 설정 조회)
- [x] tRPC: updateSleepSettings 프로시저 (옵트아웃/재활성화)
- [x] tRPC: recordSleepAuto 프로시저 (자동 수면 기록)
- [x] 프론트엔드: 수면 체크 설정 UI (기본 ON 표시 + 거부 선택 토글)
- [x] TypeScript 에러 0개 유지

---

## 💳 Stripe 결제 관리자 모듈 + 멤버십 5개 탭 (2026-05-20)

- [ ] DB 시드: GLWA 11단계(Bronze~Platinum + Black Platinum Special) 삽입
- [ ] DB 시드: 숨호흡 4단계 구독 삽입 (Free/Silver/Gold/Premium)
- [ ] DB 시드: 스포츠회복사 3단계 구독 삽입 (Basic/Professional/Master - GitHub 원본)
- [ ] DB 시드: 장부관리사 4단계 구독 삽입 (Silver/Gold/Platinum/Diamond - GitHub 원본)
- [ ] DB 시드: GLWA 커뮤니티 3단계 삽입
- [ ] DB 시드: 예약 슬롯 5개 (6~10번) 비활성 상태로 삽입
- [ ] MembershipDashboard.tsx: 5개 카테고리 탭 구조 (최대 10개 확장 가능)
- [ ] 각 탭: 단계별 카드 + 정책 편집 모달 + 이미지 슬롯
- [ ] Stripe 결제 관리자 모듈: stripeAdminRouter.ts (GitHub 원본 이식)
- [ ] 결제 현황 대시보드: PaymentDashboard.tsx (구독 목록/취소/환불)
- [ ] Stripe 웹훅 처리 라우터 이식
- [ ] TypeScript 에러 0개 유지

---

## 🧠 AI 생체 분석 관리자 대시보드 + Stripe 결제 (2026-05-20)

- [ ] AI 생체 분석 관리자 대시보드: HealthAnalyticsDashboard.tsx (고객별 건강 데이터 분류/분석)
- [ ] 고객별 심박수/호흡/수면/안색 데이터 현황 테이블
- [ ] AI 분석 결과 분류 (정상/주의/위험) 필터 + 차트
- [ ] 실시간 분석 중인 사용자 목록
- [ ] Stripe 관리자 라우터: stripeAdminRouter.ts 이식 (GitHub 원본 기준)
- [ ] 결제 현황 대시보드: PaymentDashboard.tsx (구독 목록/취소/환불)
- [ ] Stripe 웹훅 처리 라우터 이식
- [ ] DashboardLayout 사이드바에 결제관리/건강분석 메뉴 추가

---

## ✅ 결제/정산 + AI 분석 현황 대시보드 완성 (2026-05-20)
- [x] GitHub 전수 조사: jangbu-quantum-assoc, glwa-wellness-check 핵심 코드 복사 이식
- [x] stripeWebhook.ts: Stripe 웹훅 핸들러 (결제완료/구독갱신/환불) 복사 + 이식
- [x] paymentRouter.ts: 결제/정산 관리자 tRPC 라우터 (입금명단, 환불, 구독갱신, 정산)
- [x] healthAiRouter.ts: AI 피드백 엔진 복사 + getFeedbackList + getFeedbackStats 추가
- [x] PaymentDashboard.tsx: 엑셀형 결제/정산 화면 (입금명단, 환불, 구독갱신, 금액정산, CSV)
- [x] AiAnalyticsDashboard.tsx: AI 분석 현황 최소 탭 (통계 카드 + 피드백 로그 테이블)
- [x] DashboardLayout 사이드바: 결제/정산 + AI 분석 현황 메뉴 추가
- [x] App.tsx: /admin/payment + /admin/ai-analytics 라우트 등록
- [x] routers.ts: paymentRouter + healthAiRouter 등록
- [x] TypeScript 에러 0개 확인

---
## 🎯 미션 관리 + 이벤트 관리 (2026-05-20 추가)
- [ ] missions 테이블 DB 마이그레이션 (정해진미션/선택미션, 시간지정, 포인트, 활성상태)
- [ ] missionCompletions 테이블 DB 마이그레이션 (사용자별 완료 이력)
- [ ] events 테이블 DB 마이그레이션 (스케줄/즉석, 발송상태, 대상자)
- [ ] missionRouter 구현 (CRUD + 완료처리 + 통계 + 자동피드백 트리거)
- [ ] eventRouter 구현 (CRUD + 즉석발송 + 스케줄 연동)
- [ ] MissionDashboard 페이지 구현 (목록/생성/완료현황/포인트지급)
- [ ] EventDashboard 페이지 구현 (스케줄이벤트 + 즉석이벤트 + 상태관리)
- [ ] DashboardLayout 사이드바 메뉴 추가 (미션관리, 이벤트관리)
- [ ] App.tsx 라우트 등록 (/admin/missions, /admin/events)
- [ ] routers.ts에 missionRouter + eventRouter 등록
- [ ] TypeScript 에러 0개 유지

---
## ✅ MissionDashboard + EventDashboard + TypeScript 에러 0개 (2026-05-20)
- [x] missionRouter.ts: userId String 변환 + photoUrl→feedbackContent 수정
- [x] eventRouter.ts: db import getDb() 패턴 수정
- [x] EventDashboard.tsx: stats 기본값 필드명 수정 (sentToday, drafts, upcoming)
- [x] MissionDashboard.tsx: handleSave category 타입 안전 캐스팅 추가
- [x] TypeScript 에러 0개 최종 확인 (npx tsc --noEmit 결과: 에러 없음)
- [x] 체크포인트 저장 완료
- [x] GitHub push 완료

---

## ✅ A/B/C 3안 병렬 완성 (2026-05-20)

- [x] A안: rankingRouter.ts — % 랭킹 시스템 (top1%/5%/10%/20% 분포 + 개인 백분위)
- [x] A안: AiAnalyticsDashboard.tsx — 4탭 구조 고도화 (피드백/랭킹/생체/코칭)
- [x] B안: MembershipDashboard PROJECT_TABS 5탭 확장 (GLWA 11단계 + 숨호흡 + 스포츠회복사 + 장부관리사 + GLWA커뮤니티)
- [x] B안: DB 시드 — 5개 프로젝트 총 23개 멤버십/구독 단계 삽입
- [x] C안: missionScheduler.ts — Heartbeat 일일/주간 핸들러
- [x] C안: schedulerRouter.ts — 크론 등록/삭제/목록 tRPC 라우터
- [x] C안: SchedulerDashboard.tsx — 크론 관리 UI
- [x] C안: index.ts — /api/scheduled/daily-mission, /api/scheduled/weekly-mission-report 엔드포인트 등록
- [x] DashboardLayout.tsx — 스케줄러/AI분석&랭킹 메뉴 추가
- [x] routers.ts — rankingRouter, schedulerRouter 등록
- [x] TypeScript 에러 0개 검증 완료
