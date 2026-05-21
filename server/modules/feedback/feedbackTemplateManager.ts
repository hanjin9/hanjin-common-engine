/**
 * 피드백 템플릿 관리자
 * 
 * 5단계 티어별 피드백 템플릿 관리
 * - 상위 10%: 축하 및 더 높은 목표
 * - 상위 20%: 격려 및 상위권 진입 독려
 * - 중위: 개선 필요 및 노력 격려
 * - 하위 20%: 변화의 시작 및 도움 제공
 * - 하위 10%: 긴급 개입 및 전문가 도움
 */

export interface FeedbackTemplate {
  id: string;
  tier: "상위10%" | "상위20%" | "중위" | "하위20%" | "하위10%";
  stage: "encouragement" | "warning" | "premium";
  language: "ko" | "en" | "ja" | "zh" | "es";
  title: string;
  content: string;
  emoji: string;
  tone: "positive" | "neutral" | "urgent";
  variables?: string[]; // {{userName}}, {{score}} 등
}

export class FeedbackTemplateManager {
  private templates: Map<string, FeedbackTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * 기본 템플릿 초기화
   */
  private initializeDefaultTemplates(): void {
    const defaultTemplates: FeedbackTemplate[] = [
      // ===== 상위 10% =====
      {
        id: "top10_encouragement_ko",
        tier: "상위10%",
        stage: "encouragement",
        language: "ko",
        title: "축하합니다!",
        content: "🏆 {{userName}}님은 상위 10%의 건강 실천자입니다! 당신의 헌신과 노력이 정말 인상적입니다. 이 수준을 유지하면서 더 높은 목표를 향해 나아가세요!",
        emoji: "🏆",
        tone: "positive",
        variables: ["userName"],
      },
      {
        id: "top10_warning_ko",
        tier: "상위10%",
        stage: "warning",
        language: "ko",
        title: "더 나은 성과를 위해",
        content: "⚠️ 상위 10%도 개선이 필요합니다. 현재 점수: {{score}}/100. 다음 영역을 집중해보세요: {{focusArea}}. 전문가의 도움을 받으면 더 빠른 진전이 가능합니다.",
        emoji: "⚠️",
        tone: "neutral",
        variables: ["score", "focusArea"],
      },
      {
        id: "top10_premium_ko",
        tier: "상위10%",
        stage: "premium",
        language: "ko",
        title: "프리미엄 컨설팅",
        content: "👑 {{userName}}님을 위한 특별한 프리미엄 컨설팅입니다. 당신의 건강을 다음 단계로 끌어올릴 맞춤형 30일 플랜과 전문가 코칭을 받으세요. 최고의 성과를 위해 함께하겠습니다.",
        emoji: "👑",
        tone: "positive",
        variables: ["userName"],
      },

      // ===== 상위 20% =====
      {
        id: "top20_encouragement_ko",
        tier: "상위20%",
        stage: "encouragement",
        language: "ko",
        title: "좋은 진전입니다!",
        content: "⭐ {{userName}}님은 상위 20%의 건강 실천자입니다! 당신의 노력이 정말 좋은 결과를 만들고 있습니다. 계속 이 추진력을 유지하세요!",
        emoji: "⭐",
        tone: "positive",
        variables: ["userName"],
      },
      {
        id: "top20_warning_ko",
        tier: "상위20%",
        stage: "warning",
        language: "ko",
        title: "상위 10%를 향해",
        content: "📈 상위 20%에 머물지 말고 더 나아가세요! 현재 점수: {{score}}/100. 상위 10%까지는 {{gap}}점만 더 필요합니다. 집중하면 가능합니다!",
        emoji: "📈",
        tone: "neutral",
        variables: ["score", "gap"],
      },
      {
        id: "top20_premium_ko",
        tier: "상위20%",
        stage: "premium",
        language: "ko",
        title: "상위 10% 진입 프로그램",
        content: "💎 {{userName}}님의 상위 10% 진입을 위한 프리미엄 프로그램입니다. 전문가 분석과 맞춤형 코칭으로 다음 단계에 도달하세요.",
        emoji: "💎",
        tone: "positive",
        variables: ["userName"],
      },

      // ===== 중위 =====
      {
        id: "middle_encouragement_ko",
        tier: "중위",
        stage: "encouragement",
        language: "ko",
        title: "좋은 시작입니다!",
        content: "👍 {{userName}}님, 좋은 시작입니다! 현재 점수: {{score}}/100. 계속 노력하면 상위권에 도달할 수 있습니다. 매일의 작은 노력이 큰 변화를 만듭니다!",
        emoji: "👍",
        tone: "positive",
        variables: ["userName", "score"],
      },
      {
        id: "middle_warning_ko",
        tier: "중위",
        stage: "warning",
        language: "ko",
        title: "개선이 필요합니다",
        content: "🎯 더 나은 건강을 위해 노력해야 합니다. 현재 점수: {{score}}/100. 특히 {{focusArea}} 영역에 집중하세요. 작은 변화가 큰 결과를 만듭니다!",
        emoji: "🎯",
        tone: "neutral",
        variables: ["score", "focusArea"],
      },
      {
        id: "middle_premium_ko",
        tier: "중위",
        stage: "premium",
        language: "ko",
        title: "상위권 진입 프로그램",
        content: "🚀 {{userName}}님을 위한 상위권 진입 프로그램입니다. 전문가의 체계적인 가이드와 맞춤형 플랜으로 빠르게 성장하세요.",
        emoji: "🚀",
        tone: "positive",
        variables: ["userName"],
      },

      // ===== 하위 20% =====
      {
        id: "bottom20_encouragement_ko",
        tier: "하위20%",
        stage: "encouragement",
        language: "ko",
        title: "변화의 시작",
        content: "💪 {{userName}}님, 지금이 변화의 시작입니다! 현재 점수: {{score}}/100. 작은 노력이 큰 변화를 만듭니다. 함께 시작해봅시다!",
        emoji: "💪",
        tone: "positive",
        variables: ["userName", "score"],
      },
      {
        id: "bottom20_warning_ko",
        tier: "하위20%",
        stage: "warning",
        language: "ko",
        title: "도움이 필요합니다",
        content: "🆘 지금이 변화의 시작입니다. 현재 점수: {{score}}/100. {{focusArea}} 영역이 특히 중요합니다. 전문가의 도움을 받으면 더 빠른 개선이 가능합니다.",
        emoji: "🆘",
        tone: "urgent",
        variables: ["score", "focusArea"],
      },
      {
        id: "bottom20_premium_ko",
        tier: "하위20%",
        stage: "premium",
        language: "ko",
        title: "전문가 도움 프로그램",
        content: "🤝 {{userName}}님을 위한 전문가 도움 프로그램입니다. 체계적인 지도와 지속적인 지원으로 건강을 되찾으세요.",
        emoji: "🤝",
        tone: "positive",
        variables: ["userName"],
      },

      // ===== 하위 10% =====
      {
        id: "bottom10_encouragement_ko",
        tier: "하위10%",
        stage: "encouragement",
        language: "ko",
        title: "당신도 할 수 있습니다!",
        content: "🌟 {{userName}}님, 당신도 할 수 있습니다! 현재 점수: {{score}}/100. 첫 걸음을 시작하세요. 우리가 함께하겠습니다!",
        emoji: "🌟",
        tone: "positive",
        variables: ["userName", "score"],
      },
      {
        id: "bottom10_warning_ko",
        tier: "하위10%",
        stage: "warning",
        language: "ko",
        title: "긴급 개입 필요",
        content: "🆘 긴급: 건강 개선이 시급합니다. 현재 점수: {{score}}/100. {{focusArea}} 영역이 매우 위험합니다. 지금 바로 전문가의 도움을 받으세요!",
        emoji: "🆘",
        tone: "urgent",
        variables: ["score", "focusArea"],
      },
      {
        id: "bottom10_premium_ko",
        tier: "하위10%",
        stage: "premium",
        language: "ko",
        title: "긴급 전문가 프로그램",
        content: "🎯 {{userName}}님을 위한 긴급 전문가 프로그램입니다. 즉시 개입과 집중 관리로 건강을 되찾으세요. 전문가가 24/7 지원합니다.",
        emoji: "🎯",
        tone: "positive",
        variables: ["userName"],
      },

      // ===== 영문 템플릿 (일부) =====
      {
        id: "top10_encouragement_en",
        tier: "상위10%",
        stage: "encouragement",
        language: "en",
        title: "Congratulations!",
        content: "🏆 {{userName}}, you're in the top 10% of health practitioners! Your dedication is truly impressive. Keep this momentum and aim even higher!",
        emoji: "🏆",
        tone: "positive",
        variables: ["userName"],
      },
      {
        id: "bottom10_warning_en",
        tier: "하위10%",
        stage: "warning",
        language: "en",
        title: "Urgent: Action Needed",
        content: "🆘 Urgent: Health improvement is critical. Current score: {{score}}/100. {{focusArea}} area is very concerning. Get professional help immediately!",
        emoji: "🆘",
        tone: "urgent",
        variables: ["score", "focusArea"],
      },
    ];

    defaultTemplates.forEach((template) => {
      this.templates.set(`${template.id}`, template);
    });
  }

  /**
   * 템플릿 조회
   */
  getTemplate(
    tier: string,
    stage: string,
    language: string
  ): FeedbackTemplate | undefined {
    const key = `${tier}_${stage}_${language}`;
    return this.templates.get(key);
  }

  /**
   * 템플릿 변수 치환
   */
  interpolateTemplate(
    template: FeedbackTemplate,
    variables: Record<string, string | number>
  ): string {
    let content = template.content;

    // 변수 치환
    Object.entries(variables).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, "g"), String(value));
    });

    return content;
  }

  /**
   * 모든 템플릿 조회
   */
  getAllTemplates(): FeedbackTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * 템플릿 추가
   */
  addTemplate(template: FeedbackTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * 템플릿 업데이트
   */
  updateTemplate(id: string, updates: Partial<FeedbackTemplate>): void {
    const existing = this.templates.get(id);
    if (existing) {
      this.templates.set(id, { ...existing, ...updates });
    }
  }

  /**
   * 템플릿 삭제
   */
  deleteTemplate(id: string): void {
    this.templates.delete(id);
  }

  /**
   * 티어별 템플릿 조회
   */
  getTemplatesByTier(tier: string): FeedbackTemplate[] {
    return Array.from(this.templates.values()).filter((t) => t.tier === tier);
  }

  /**
   * 언어별 템플릿 조회
   */
  getTemplatesByLanguage(language: string): FeedbackTemplate[] {
    return Array.from(this.templates.values()).filter(
      (t) => t.language === language
    );
  }
}

// 싱글톤 인스턴스
export const feedbackTemplateManager = new FeedbackTemplateManager();
