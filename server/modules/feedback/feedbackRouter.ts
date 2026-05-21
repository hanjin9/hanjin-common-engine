import { z } from "zod";
import { protectedProcedure, router } from "../../_core/trpc";
import {
  generateEncouragementFeedback,
  generateWarningFeedback,
  generatePremiumFeedback,
  generateCompleteFeedback,
  FeedbackInput,
} from "./feedbackEngine";
import { feedbackTemplateManager } from "./feedbackTemplateManager";

/**
 * AI 피드백 라우터
 * 
 * 3단계 피드백 시스템 (격려/경고/프리미엄)
 * - 1차: 격려 (무료, 즉시)
 * - 2차: 경고 (무료, 조건부)
 * - 3차: 프리미엄 (유료, 전문가)
 */

// 입력 스키마
const healthDataSchema = z.object({
  sleepHours: z.number().min(0).max(24),
  sleepQuality: z.number().min(1).max(10),
  heartRate: z.number().min(30).max(200),
  bloodPressure: z.string(),
  bloodSugar: z.number().min(0).max(500),
  activityMinutes: z.number().min(0).max(1440),
  mealScore: z.number().min(1).max(10),
  stressLevel: z.number().min(1).max(10).optional(),
  waterIntake: z.number().min(0).optional(),
});

const feedbackInputSchema = z.object({
  userId: z.string(),
  userName: z.string().optional(),
  tier: z
    .enum(["상위10%", "상위20%", "중위", "하위20%", "하위10%"])
    .optional(),
  score: z.number().min(0).max(100).optional(),
  healthData: healthDataSchema,
  language: z.enum(["ko", "en", "ja", "zh", "es"]).default("ko"),
});

export const feedbackRouter = router({
  /**
   * 1차 피드백: 격려 (무료, 즉시)
   */
  generateEncouragement: protectedProcedure
    .input(feedbackInputSchema)
    .mutation(async ({ input }) => {
      try {
        const feedback = await generateEncouragementFeedback(
          input as FeedbackInput
        );
        return {
          success: true,
          data: feedback,
        };
      } catch (error) {
        console.error("1차 피드백 생성 실패:", error);
        return {
          success: false,
          error: "피드백 생성에 실패했습니다",
        };
      }
    }),

  /**
   * 2차 피드백: 경고/심화 (무료, 조건부)
   */
  generateWarning: protectedProcedure
    .input(feedbackInputSchema)
    .mutation(async ({ input }) => {
      try {
        const feedback = await generateWarningFeedback(input as FeedbackInput);

        if (!feedback) {
          return {
            success: true,
            data: null,
            message: "경고가 필요하지 않습니다",
          };
        }

        return {
          success: true,
          data: feedback,
        };
      } catch (error) {
        console.error("2차 피드백 생성 실패:", error);
        return {
          success: false,
          error: "피드백 생성에 실패했습니다",
        };
      }
    }),

  /**
   * 3차 피드백: 프리미엄 (유료, 전문가)
   */
  generatePremium: protectedProcedure
    .input(feedbackInputSchema)
    .mutation(async ({ input }) => {
      try {
        const feedback = await generatePremiumFeedback(input as FeedbackInput);
        return {
          success: true,
          data: feedback,
        };
      } catch (error) {
        console.error("3차 피드백 생성 실패:", error);
        return {
          success: false,
          error: "피드백 생성에 실패했습니다",
        };
      }
    }),

  /**
   * 전체 피드백 (3단계 한번에)
   */
  generateComplete: protectedProcedure
    .input(feedbackInputSchema)
    .mutation(async ({ input }) => {
      try {
        const feedbacks = await generateCompleteFeedback(
          input as FeedbackInput
        );
        return {
          success: true,
          data: feedbacks,
        };
      } catch (error) {
        console.error("전체 피드백 생성 실패:", error);
        return {
          success: false,
          error: "피드백 생성에 실패했습니다",
        };
      }
    }),

  /**
   * 템플릿 조회
   */
  getTemplate: protectedProcedure
    .input(
      z.object({
        tier: z.enum(["상위10%", "상위20%", "중위", "하위20%", "하위10%"]),
        stage: z.enum(["encouragement", "warning", "premium"]),
        language: z.enum(["ko", "en", "ja", "zh", "es"]).default("ko"),
      })
    )
    .query(({ input }) => {
      const template = feedbackTemplateManager.getTemplate(
        input.tier,
        input.stage,
        input.language
      );

      if (!template) {
        return {
          success: false,
          error: "템플릿을 찾을 수 없습니다",
        };
      }

      return {
        success: true,
        data: template,
      };
    }),

  /**
   * 모든 템플릿 조회
   */
  getAllTemplates: protectedProcedure.query(() => {
    const templates = feedbackTemplateManager.getAllTemplates();
    return {
      success: true,
      data: templates,
    };
  }),

  /**
   * 티어별 템플릿 조회
   */
  getTemplatesByTier: protectedProcedure
    .input(
      z.object({
        tier: z.enum(["상위10%", "상위20%", "중위", "하위20%", "하위10%"]),
      })
    )
    .query(({ input }) => {
      const templates = feedbackTemplateManager.getTemplatesByTier(input.tier);
      return {
        success: true,
        data: templates,
      };
    }),

  /**
   * 언어별 템플릿 조회
   */
  getTemplatesByLanguage: protectedProcedure
    .input(
      z.object({
        language: z.enum(["ko", "en", "ja", "zh", "es"]),
      })
    )
    .query(({ input }) => {
      const templates = feedbackTemplateManager.getTemplatesByLanguage(
        input.language
      );
      return {
        success: true,
        data: templates,
      };
    }),

  /**
   * 템플릿 변수 치환
   */
  interpolateTemplate: protectedProcedure
    .input(
      z.object({
        tier: z.enum(["상위10%", "상위20%", "중위", "하위20%", "하위10%"]),
        stage: z.enum(["encouragement", "warning", "premium"]),
        language: z.enum(["ko", "en", "ja", "zh", "es"]).default("ko"),
        variables: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
      })
    )
    .query(({ input }) => {
      const template = feedbackTemplateManager.getTemplate(
        input.tier,
        input.stage,
        input.language
      );

      if (!template) {
        return {
          success: false,
          error: "템플릿을 찾을 수 없습니다",
        };
      }

      const interpolated = feedbackTemplateManager.interpolateTemplate(
        template,
        (input.variables as Record<string, string | number>) || {}
      );

      return {
        success: true,
        data: {
          template,
          interpolated,
        },
      };
    }),

  /**
   * 템플릿 추가 (관리자 전용)
   */
  addTemplate: protectedProcedure
    .input(
      z.object({
        tier: z.enum(["상위10%", "상위20%", "중위", "하위20%", "하위10%"]),
        stage: z.enum(["encouragement", "warning", "premium"]),
        language: z.enum(["ko", "en", "ja", "zh", "es"]),
        title: z.string(),
        content: z.string(),
        emoji: z.string(),
        tone: z.enum(["positive", "neutral", "urgent"]),
        variables: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 관리자 권한 확인
      if (ctx.user?.role !== "admin") {
        return {
          success: false,
          error: "관리자 권한이 필요합니다",
        };
      }

      try {
        const template = {
          id: `${input.tier}_${input.stage}_${input.language}_${Date.now()}`,
          tier: input.tier,
          stage: input.stage,
          language: input.language,
          title: input.title,
          content: input.content,
          emoji: input.emoji,
          tone: input.tone,
          variables: input.variables,
        };

        feedbackTemplateManager.addTemplate(template);

        return {
          success: true,
          data: template,
        };
      } catch (error) {
        console.error("템플릿 추가 실패:", error);
        return {
          success: false,
          error: "템플릿 추가에 실패했습니다",
        };
      }
    }),

  /**
   * 템플릿 업데이트 (관리자 전용)
   */
  updateTemplate: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        content: z.string().optional(),
        emoji: z.string().optional(),
        tone: z.enum(["positive", "neutral", "urgent"]).optional(),
        variables: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 관리자 권한 확인
      if (ctx.user?.role !== "admin") {
        return {
          success: false,
          error: "관리자 권한이 필요합니다",
        };
      }

      try {
        feedbackTemplateManager.updateTemplate(input.id, input);

        return {
          success: true,
          message: "템플릿이 업데이트되었습니다",
        };
      } catch (error) {
        console.error("템플릿 업데이트 실패:", error);
        return {
          success: false,
          error: "템플릿 업데이트에 실패했습니다",
        };
      }
    }),

  /**
   * 템플릿 삭제 (관리자 전용)
   */
  deleteTemplate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 관리자 권한 확인
      if (ctx.user?.role !== "admin") {
        return {
          success: false,
          error: "관리자 권한이 필요합니다",
        };
      }

      try {
        feedbackTemplateManager.deleteTemplate(input.id);

        return {
          success: true,
          message: "템플릿이 삭제되었습니다",
        };
      } catch (error) {
        console.error("템플릿 삭제 실패:", error);
        return {
          success: false,
          error: "템플릿 삭제에 실패했습니다",
        };
      }
    }),
});
