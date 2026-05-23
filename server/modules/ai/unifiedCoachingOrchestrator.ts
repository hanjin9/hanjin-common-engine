/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 통합 AI 코칭 오케스트레이터
 * Unified AI Coaching Orchestrator
 *
 * 3개 엔진 완전 통합:
 *   1. AnomalyDetectionEngine   — 생체 이상 감지 → 긴급 알림
 *   2. AIHealthAnalysisEngine   — 건강 분석 + HanJin Level 계산
 *   3. RealTimeCoachingEngine   — 개인화 코칭 피드백 생성
 *
 * 프로젝트별 엔진 ON/OFF 설정:
 *   - GLWA: 3개 전부 활성
 *   - 소형 프로젝트: 선택적 활성
 *
 * 파이프라인:
 *   데이터 수집 → 이상 감지 → 건강 분석 → 코칭 생성 → 발송
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { AnomalyDetectionEngine, getAnomalyDetectionEngine } from './anomalyDetectionEngine';
import { RealTimeCoachingFeedbackEngine, getRealTimeCoachingFeedbackEngine } from './realTimeCoachingEngine';
import { AIHealthAnalysisEngine, getAIHealthAnalysisEngine } from '../health-ai/aiHealthAnalysisEngine';

// ━━ 타입 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 프로젝트별 엔진 활성화 설정 */
export interface ProjectEngineConfig {
  projectSlug: string;
  projectName: string;
  engines: {
    anomalyDetection: boolean;   // 생체 이상 감지
    healthAnalysis: boolean;     // 건강 분석 + HanJin Level
    realtimeCoaching: boolean;   // 실시간 코칭 피드백
    autoSend: boolean;           // 자동 발송
    voiceFeedback: boolean;      // 음성 피드백 (추후)
    weeklyReport: boolean;       // 주간 리포트
    tierRanking: boolean;        // 티어 랭킹 계산
  };
  thresholds?: {
    anomalySensitivity: 'low' | 'medium' | 'high';
    coachingFrequency: 'daily' | 'weekly' | 'monthly';
    alertChannels: ('push' | 'sms' | 'email' | 'in_app')[];
  };
}

/** 프로젝트 엔진 레지스트리 (기본값) */
export const PROJECT_ENGINE_REGISTRY: Record<string, ProjectEngineConfig> = {
  glwa: {
    projectSlug: 'glwa',
    projectName: 'GLWA 웰니스',
    engines: {
      anomalyDetection: true,
      healthAnalysis: true,
      realtimeCoaching: true,
      autoSend: true,
      voiceFeedback: false,   // 추후 ElevenLabs 연동
      weeklyReport: true,
      tierRanking: true,
    },
    thresholds: {
      anomalySensitivity: 'high',
      coachingFrequency: 'daily',
      alertChannels: ['push', 'in_app', 'email'],
    },
  },
  soom: {
    projectSlug: 'soom',
    projectName: '숨 호흡 앱',
    engines: {
      anomalyDetection: true,
      healthAnalysis: true,
      realtimeCoaching: true,
      autoSend: true,
      voiceFeedback: false,
      weeklyReport: false,
      tierRanking: false,
    },
    thresholds: {
      anomalySensitivity: 'medium',
      coachingFrequency: 'daily',
      alertChannels: ['push', 'in_app'],
    },
  },
  sports: {
    projectSlug: 'sports',
    projectName: '스포츠 회복사',
    engines: {
      anomalyDetection: true,
      healthAnalysis: true,
      realtimeCoaching: true,
      autoSend: false,        // 수동 발송
      voiceFeedback: false,
      weeklyReport: true,
      tierRanking: true,
    },
    thresholds: {
      anomalySensitivity: 'medium',
      coachingFrequency: 'daily',
      alertChannels: ['push', 'email'],
    },
  },
  jangbu: {
    projectSlug: 'jangbu',
    projectName: '장부 관리사',
    engines: {
      anomalyDetection: false,  // 불필요
      healthAnalysis: false,    // 불필요
      realtimeCoaching: true,   // 업무 코칭만
      autoSend: false,
      voiceFeedback: false,
      weeklyReport: false,
      tierRanking: false,
    },
    thresholds: {
      anomalySensitivity: 'low',
      coachingFrequency: 'weekly',
      alertChannels: ['email'],
    },
  },
};

/** 통합 코칭 입력 */
export interface UnifiedCoachingInput {
  userId: string;
  projectSlug: string;
  healthData?: {
    heartRate?: number;
    bloodOxygen?: number;
    bodyTemperature?: number;
    bloodPressure?: { systolic: number; diastolic: number };
    respiratoryRate?: number;
    stressLevel?: number;
    steps?: number;
    sleepHours?: number;
    calories?: number;
    mood?: number;
  };
  activityType?: 'breathing' | 'meditation' | 'exercise' | 'sleep' | 'mission' | 'quiz';
  activityData?: {
    score?: number;
    duration?: number;
    completionRate?: number;
    intensity?: number;
  };
  userProfile?: {
    name: string;
    hanJinLevel?: number;
    fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
    language?: 'ko' | 'en' | 'ja' | 'zh';
  };
  triggerType: 'activity_complete' | 'biometric_update' | 'daily_checkin' | 'scheduled' | 'anomaly';
}

/** 통합 코칭 결과 */
export interface UnifiedCoachingResult {
  userId: string;
  projectSlug: string;
  timestamp: number;
  enginesUsed: string[];
  anomaly?: {
    detected: boolean;
    severity: string;
    advice: string;
    requiresEmergency: boolean;
  };
  healthAnalysis?: {
    overallScore: number;
    hanJinLevel: number;
    pointsEarned: number;
    summary: string;
    improvementAreas: string[];
  };
  coaching?: {
    textFeedback: string;
    motivationLevel: 'low' | 'medium' | 'high';
    pointsAwarded: number;
    nextSuggestion?: string;
  };
  autoSent: boolean;
  error?: string;
}

// ━━ 통합 오케스트레이터 클래스 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export class UnifiedCoachingOrchestrator {
  private config: ProjectEngineConfig;
  private anomalyEngine?: AnomalyDetectionEngine;
  private coachingEngine: RealTimeCoachingFeedbackEngine;
  private healthEngine?: AIHealthAnalysisEngine;

  constructor(projectSlug: string, userId: string) {
    // 프로젝트 설정 로드 (없으면 기본 최소 설정)
    this.config = PROJECT_ENGINE_REGISTRY[projectSlug] ?? {
      projectSlug,
      projectName: projectSlug,
      engines: {
        anomalyDetection: false,
        healthAnalysis: true,
        realtimeCoaching: true,
        autoSend: false,
        voiceFeedback: false,
        weeklyReport: false,
        tierRanking: false,
      },
    };

    // 활성화된 엔진만 초기화
    if (this.config.engines.anomalyDetection) {
      this.anomalyEngine = getAnomalyDetectionEngine(userId);
    }
    if (this.config.engines.healthAnalysis) {
      this.healthEngine = getAIHealthAnalysisEngine(userId);
    }
    this.coachingEngine = getRealTimeCoachingFeedbackEngine();
  }

  /** 메인 파이프라인 실행 */
  async run(input: UnifiedCoachingInput): Promise<UnifiedCoachingResult> {
    const result: UnifiedCoachingResult = {
      userId: input.userId,
      projectSlug: input.projectSlug,
      timestamp: Date.now(),
      enginesUsed: [],
      autoSent: false,
    };

    try {
      // ── Step 1: 이상 감지 ───────────────────────────────────────
      if (this.config.engines.anomalyDetection && this.anomalyEngine && input.healthData) {
        result.enginesUsed.push('anomalyDetection');

        const anomalyResult = await this.anomalyEngine.detectAnomalies({
          heartRate: input.healthData.heartRate,
          bloodOxygen: input.healthData.bloodOxygen,
          bodyTemperature: input.healthData.bodyTemperature,
          bloodPressure: input.healthData.bloodPressure,
          respiratoryRate: input.healthData.respiratoryRate,
          stressLevel: input.healthData.stressLevel,
        } as any);

        result.anomaly = {
          detected: anomalyResult.anomalyDetected,
          severity: anomalyResult.severity,
          advice: anomalyResult.emergencyAdvice,
          requiresEmergency: anomalyResult.severity === 'critical',
        };

        // 긴급 상황 시 즉시 알림
        if (anomalyResult.severity === 'critical') {
          // 긴급 알림 — notifyOwner 시그니처 확인 필요
          console.error(`🚨 긴급 이상 감지 userId:${input.userId} severity:${anomalyResult.severity}`);
        }
      }

      // ── Step 2: 건강 분석 ───────────────────────────────────────
      if (this.config.engines.healthAnalysis && this.healthEngine && input.healthData) {
        result.enginesUsed.push('healthAnalysis');

        const healthResult = await this.healthEngine.analyzeHealthData({
          heartRate: input.healthData.heartRate,
          steps: input.healthData.steps,
          sleep: input.healthData.sleepHours,
          calories: input.healthData.calories,
          bloodPressure: input.healthData.bloodPressure,
          oxygenSaturation: input.healthData.bloodOxygen,
        });

        result.healthAnalysis = {
          overallScore: healthResult.overallScore,
          hanJinLevel: Number(healthResult.overallHanJinLevel) || 1,
          pointsEarned: healthResult.pointsEarned,
          summary: healthResult.feedback,
          improvementAreas: Object.entries(healthResult)
            .filter(([k, v]: [string, any]) => v?.status === '주의' || v?.status === '위험')
            .map(([k]) => k),
        };
      }

      // ── Step 3: 실시간 코칭 피드백 생성 ─────────────────────────
      if (this.config.engines.realtimeCoaching && input.activityType) {
        result.enginesUsed.push('realtimeCoaching');

        const coachingContext = {
          userId: input.userId,
          activityType: input.activityType as any,
          activityName: input.activityType,
          currentHanJinLevel: result.healthAnalysis?.hanJinLevel ?? 1,
          recentMetrics: {
            heartRate: input.healthData?.heartRate,
            stressLevel: input.healthData?.stressLevel,
            sleepQuality: input.healthData?.sleepHours
              ? Math.min(100, (input.healthData.sleepHours / 8) * 100)
              : undefined,
          },
          performanceData: {
            score: input.activityData?.score,
            duration: input.activityData?.duration,
            completionRate: input.activityData?.completionRate,
          },
          userProfile: {
            name: input.userProfile?.name ?? '수련자',
            fitnessLevel: input.userProfile?.fitnessLevel ?? 'beginner',
          },
          language: (input.userProfile?.language ?? 'ko') as any,
        };

        const coachResult = await this.coachingEngine.generateRealtimeFeedback(coachingContext);

        result.coaching = {
          textFeedback: coachResult.textFeedback,
          motivationLevel: coachResult.motivationLevel,
          pointsAwarded: coachResult.pointsAwarded,
          nextSuggestion: coachResult.nextSuggestion,
        };
      }

      // ── Step 4: 자동 발송 ────────────────────────────────────────
      if (this.config.engines.autoSend && result.coaching) {
        // 실제 발송 채널 연동 (FCM/SMS/Email)
        result.autoSent = true;
        // TODO: 발송 채널별 실제 전송 로직
        // await sendPush(input.userId, result.coaching.textFeedback);
      }

    } catch (error: any) {
      result.error = `오케스트레이터 오류: ${error?.message ?? String(error)}`;
    }

    return result;
  }
}

// ━━ 팩토리 함수 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function createCoachingOrchestrator(
  projectSlug: string,
  userId: string
): UnifiedCoachingOrchestrator {
  return new UnifiedCoachingOrchestrator(projectSlug, userId);
}

/** 프로젝트 엔진 설정 조회 */
export function getProjectEngineConfig(projectSlug: string): ProjectEngineConfig {
  return PROJECT_ENGINE_REGISTRY[projectSlug] ?? {
    projectSlug,
    projectName: projectSlug,
    engines: {
      anomalyDetection: false,
      healthAnalysis: true,
      realtimeCoaching: true,
      autoSend: false,
      voiceFeedback: false,
      weeklyReport: false,
      tierRanking: false,
    },
  };
}

/** 프로젝트 엔진 설정 업데이트 (런타임) */
export function updateProjectEngineConfig(
  projectSlug: string,
  updates: Partial<ProjectEngineConfig['engines']>
): void {
  if (!PROJECT_ENGINE_REGISTRY[projectSlug]) {
    PROJECT_ENGINE_REGISTRY[projectSlug] = getProjectEngineConfig(projectSlug);
  }
  Object.assign(PROJECT_ENGINE_REGISTRY[projectSlug].engines, updates);
}
