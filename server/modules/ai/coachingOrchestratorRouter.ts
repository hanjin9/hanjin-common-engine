/**
 * coachingOrchestratorRouter.ts
 * 통합 AI 코칭 오케스트레이터 tRPC 라우터
 */
import { z } from 'zod';
import { router, protectedProcedure } from '../../_core/trpc';
import {
  createCoachingOrchestrator,
  getProjectEngineConfig,
  updateProjectEngineConfig,
  PROJECT_ENGINE_REGISTRY,
  type UnifiedCoachingInput,
} from './unifiedCoachingOrchestrator';

export const coachingOrchestratorRouter = router({

  // 1. 단일 사용자 코칭 실행
  runCoaching: protectedProcedure
    .input(z.object({
      userId: z.string(),
      projectSlug: z.string().default('glwa'),
      triggerType: z.enum(['activity_complete','biometric_update','daily_checkin','scheduled','anomaly']),
      activityType: z.enum(['breathing','meditation','exercise','sleep','mission','quiz']).optional(),
      healthData: z.object({
        heartRate: z.number().optional(),
        bloodOxygen: z.number().optional(),
        bodyTemperature: z.number().optional(),
        respiratoryRate: z.number().optional(),
        stressLevel: z.number().optional(),
        steps: z.number().optional(),
        sleepHours: z.number().optional(),
        calories: z.number().optional(),
        mood: z.number().optional(),
      }).optional(),
      activityData: z.object({
        score: z.number().optional(),
        duration: z.number().optional(),
        completionRate: z.number().optional(),
      }).optional(),
      userProfile: z.object({
        name: z.string(),
        hanJinLevel: z.number().optional(),
        fitnessLevel: z.enum(['beginner','intermediate','advanced']).optional(),
        language: z.enum(['ko','en','ja','zh']).optional(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      const orchestrator = createCoachingOrchestrator(input.projectSlug, input.userId);
      const result = await orchestrator.run(input as UnifiedCoachingInput);
      return result;
    }),

  // 2. 프로젝트 엔진 설정 조회
  getEngineConfig: protectedProcedure
    .input(z.object({ projectSlug: z.string() }))
    .query(({ input }) => getProjectEngineConfig(input.projectSlug)),

  // 3. 전체 프로젝트 엔진 설정 목록
  getAllEngineConfigs: protectedProcedure
    .query(() => Object.values(PROJECT_ENGINE_REGISTRY)),

  // 4. 프로젝트 엔진 설정 업데이트
  updateEngineConfig: protectedProcedure
    .input(z.object({
      projectSlug: z.string(),
      engines: z.object({
        anomalyDetection: z.boolean().optional(),
        healthAnalysis: z.boolean().optional(),
        realtimeCoaching: z.boolean().optional(),
        autoSend: z.boolean().optional(),
        voiceFeedback: z.boolean().optional(),
        weeklyReport: z.boolean().optional(),
        tierRanking: z.boolean().optional(),
      }),
    }))
    .mutation(({ input }) => {
      updateProjectEngineConfig(input.projectSlug, input.engines);
      return { success: true, config: getProjectEngineConfig(input.projectSlug) };
    }),

  // 5. 배치: 다수 사용자 일괄 코칭
  runBatchCoaching: protectedProcedure
    .input(z.object({
      projectSlug: z.string(),
      triggerType: z.enum(['daily_checkin','scheduled']),
      userIds: z.array(z.string()).max(100),
    }))
    .mutation(async ({ input }) => {
      const results = [];
      for (const userId of input.userIds) {
        try {
          const orchestrator = createCoachingOrchestrator(input.projectSlug, userId);
          const r = await orchestrator.run({
            userId, projectSlug: input.projectSlug,
            triggerType: input.triggerType as 'daily_checkin' | 'scheduled',
            userProfile: { name: userId },
          });
          results.push({ userId, success: !r.error, enginesUsed: r.enginesUsed });
        } catch {
          results.push({ userId, success: false, enginesUsed: [] });
        }
      }
      return { total: input.userIds.length, success: results.filter(r => r.success).length, results };
    }),

  // 6. 엔진 헬스체크
  healthCheck: protectedProcedure
    .query(() => ({
      engines: {
        anomalyDetection: { status: 'active', completion: 95, note: 'LLM 응급 조언 완성' },
        realtimeCoaching: { status: 'active', completion: 90, note: '음성 피드백 미구현' },
        healthAnalysis:   { status: 'active', completion: 85, note: 'DB 연동 필요' },
        voiceFeedback:    { status: 'pending', completion: 0,  note: 'ElevenLabs API 추후 연동' },
      },
      projects: Object.entries(PROJECT_ENGINE_REGISTRY).map(([slug, cfg]) => ({
        slug, name: cfg.projectName,
        activeEngines: Object.entries(cfg.engines).filter(([,v]) => v).map(([k]) => k),
      })),
      timestamp: Date.now(),
    })),
});
