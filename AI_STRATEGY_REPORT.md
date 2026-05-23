# 한진 공통 엔진 — AI 핵심 전략 보고서 v1.0
> 작성일: 2026-05-23 | 분석: hanjin-common-engine + glwa-wellness-app 전수 분석

---

## 📊 현재 AI 구현 현황

### hanjin-common-engine 기존 자산

| 파일 | 완성도 | 내용 |
|---|---|---|
| `feedbackEngine.ts` | ✅ 90% | 3단계 피드백 + LLM + 다국어 + 포인트 계산 |
| `neuralOrchestrator.ts` | ✅ 85% | 전체 AI 오케스트레이터 (이벤트별 처리) |
| `biometricCollector.ts` | ✅ 80% | 생체 데이터 수집/저장/분석 |
| `feedbackAdvancedRouter.ts` | ✅ 75% | 피드백 큐 + % 기반 발송 |
| `_core/llm.ts` | ✅ 100% | **Gemini 2.5 Flash** + Manus Forge API |

### glwa-wellness-app 이식 대상 자산

| 파일 | 완성도 | 이식 우선순위 |
|---|---|---|
| `realTimeCoachingFeedbackEngine.ts` | ✅ 90% | ★★★★★ 즉시 이식 |
| `anomalyDetectionEngine.ts` | ✅ 90% | ★★★★★ 즉시 이식 |
| `aiHealthAnalysisEngine.ts` | ✅ 85% | ★★★★★ 즉시 이식 |
| `personalMemoryEngine.ts` | ✅ 85% | ★★★★☆ 이식 필요 |
| `aiBiodataFeedbackEngine.ts` | ✅ 80% | ★★★★☆ 이식 필요 |

---

## 🔄 전체 AI 파이프라인 아키텍처

```
사용자 활동 발생
      ↓
[데이터 수집] biometricCollector.ts
  심박수 / 호흡 / 수면 / 걸음수 / 목소리 / 카메라
      ↓
[AI 분류] aiHealthAnalysisEngine + anomalyDetectionEngine
  HanJin Level 계산 + 이상 감지 + % 세그먼트 분류
      ┌─ 상위 1% → 챔피언 🏆 1,000P
      ├─ 상위 5% → 골드 ⭐ 300P
      ├─ 상위 20% → 브론즈 ✨ 100P
      ├─ 하위 20% → 격려 대상 💪
      └─ 30일 미접속 → 이탈 위험 🔔
      ↓
[개인화] personalMemoryEngine.ts
  사용자 기억 + 동기 패턴 + 선호 스타일
      ↓
[피드백 생성] feedbackEngine + realTimeCoachingEngine
  LLM(Gemini 2.5 Flash) → 개인화 메시지 생성
      ↓
[자동 발송] feedbackAdvancedRouter + BullMQ
  1차 즉시 → D+3 자동 → D+7 자동 → 코치 추가
```

---

## ⚡ 3단계 피드백 자동화 메커니즘

### 1차 — 즉시 자동 (미션 완료 이벤트)
```
미션 완료 클릭 → 생체 데이터 스냅샷 → LLM 격려 메시지 (5초)
→ 앱 푸시 + 포인트 자동 지급
```

### 2차 — D+3 자동 (매일 09:00 크론)
```
3일 미활동 감지 → LLM 개선 방향 메시지 (5~7문장)
→ SMS + 앱 푸시
```

### 3차 — D+7 자동 + 코치 옵션 (매일 10:00 크론)
```
7일 미활동 + 하위 20% → LLM 심층 분석
→ 이메일 + PDF 리포트 → 코치 수동 보강 가능
```

---

## 📈 % 기반 자동 보상 알고리즘

| 구간 | 등급 | 포인트 | 자동 액션 |
|---|---|---|---|
| 상위 1% | 챔피언 🏆 | 1,000P | 축하 AI + 관리자 알림 + 특별 이벤트 |
| 상위 2% | 다이아몬드 💎 | 700P | 칭찬 AI + 관리자 알림 |
| 상위 5% | 골드 ⭐ | 300P | 격려 AI 메시지 |
| 상위 10% | 실버 🌟 | 200P | 격려 AI 메시지 |
| 상위 20% | 브론즈 ✨ | 100P | 격려 AI 메시지 |
| 하위 20% | 격려 대상 💪 | 0P | 맞춤 격려 + 수련 가이드 |
| 하위 10% | 집중 케어 🤝 | 0P | LLM 개인화 + 전문가 연결 |
| 30일 미접속 | 이탈 위험 🔔 | 0P | 재참여 유도 + 특별 이벤트 |

**점수 산출 공식:**
```
종합 점수 = (수련 일수 × 10) + (평균 웰니스 점수 × 2)
           + (연속 수련 보너스 × 5) + (미션 완료 보너스 × 3)
```

---

## 🚀 구현 로드맵

### Phase 1 — 즉시 구현 (1~2일)
- [ ] GLWA `anomalyDetectionEngine` → common-engine 이식
- [ ] GLWA `aiHealthAnalysisEngine` → common-engine 이식
- [ ] GLWA `realTimeCoachingEngine` → common-engine 이식
- [ ] BullMQ 크론 → 1차 피드백 자동 발송 연결
- [ ] 관리자 대시보드 AI 탭 → tRPC 실제 연결

### Phase 2 — 중기 구현 (3~5일)
- [ ] `personalMemoryEngine` 이식 + DB 스키마 추가
- [ ] D+3 / D+7 자동 발송 스케줄러 구현
- [ ] % 기반 세그먼트 완전 자동 파이프라인
- [ ] 일일/주간/월간 자동 발송 크론
- [ ] 웨어러블 → AI → 즉시 피드백 연결

### Phase 3 — 추후 구현
- [ ] TTS 음성 피드백 (ElevenLabs API)
- [ ] 카메라 AI (자세 교정 / 식사 인식)
- [ ] 클론 음성 피드백
- [ ] AI 포스트카드 생성

---

## 🛠 부족한 부분 — 추가 개발 필요

| 항목 | 현재 | 필요 작업 | 난이도 |
|---|---|---|---|
| BullMQ 자동 스케줄러 | 미연결 | DB + 크론 설정 | 중 |
| D+3/D+7 트리거 | 미구현 | 스케줄러 로직 | 중 |
| 이상 감지 → 즉시 알림 | 미연결 | anomalyDetection 이식 | 소 |
| 개인 메모리 영속화 | 미구현 | DB 스키마 + 이식 | 중 |
| TTS 음성 피드백 | placeholder | ElevenLabs API | 대 |
| 카메라 AI | 미구현 | MediaPipe 연동 | 대 |

---

## 💡 핵심 원칙

1. **"사람이 발송하지 않는다"** — 모든 피드백 AI 자동 발송
2. **"데이터 입력 즉시 분류"** — 실시간 세그먼트
3. **"완전 개인화"** — 같은 메시지 두 번 없음
4. **"3단계 완전 자동"** — 코치는 3차에만 추가 개입
5. **"GLWA 자산 최대 활용"** — 6개월 개발 자산 이식

---

## 🔧 기술 스택

| 구분 | 기술 | 상태 |
|---|---|---|
| LLM | Gemini 2.5 Flash | ✅ 구현됨 |
| 스케줄러 | BullMQ (Redis) | 연결 필요 |
| DB | TiDB + Drizzle ORM | ✅ 구현됨 |
| 발송 | FCM + SMS + Resend | 부분 구현 |
| 웨어러블 | Google Fit / Apple Health | ✅ 구현됨 |
| TTS | ElevenLabs (추후) | 미구현 |

---

*GitHub: https://github.com/hanjin9/hanjin-common-engine*
*GLWA: https://github.com/hanjin9/glwa-wellness-app*
*분석일: 2026-05-23 | 커밋: 779b6c6*
