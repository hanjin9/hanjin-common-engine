/**
 * 실시간 AI 코치 피드백 시스템
 * 모든 활동 단계에서 텍스트 + 음성 피드백 제공
 */

import { invokeLLM } from "../../_core/llm";

export interface CoachingFeedbackContext {
  userId: string;
  activityType: "quiz" | "exercise" | "game" | "meditation" | "nutrition" | "sleep" | "mission";
  activityName: string;
  currentHanJinLevel: number;
  recentMetrics: {
    heartRate?: number;
    bloodOxygen?: number;
    bodyTemp?: number;
    stressLevel?: number;
    sleepQuality?: number;
    energy?: number;
  };
  performanceData: {
    score?: number;
    duration?: number;
    intensity?: number;
    accuracy?: number;
    consistency?: number;
  };
  userProfile: {
    name: string;
    age?: number;
    fitnessLevel?: string;
    goals?: string[];
    preferences?: string[];
    recentAchievements?: string[];
  };
  language: "ko" | "en" | "ja" | "zh";
}

export interface CoachingFeedback {
  id: string;
  userId: string;
  activityType: string;
  timestamp: number;
  textFeedback: string;
  voiceFeedback?: {
    url?: string;
    duration?: number;
    language: string;
  };
  pointsAwarded: number;
  motivationLevel: "low" | "medium" | "high";
  nextSuggestion?: string;
  emoji?: string;
}

export interface UserCoachingMemory {
  userId: string;
  name: string;
  preferences: Map<string, any>;
  achievementHistory: Array<{
    date: number;
    activity: string;
    achievement: string;
    points: number;
  }>;
  conversationHistory: Array<{
    timestamp: number;
    userMessage?: string;
    coachMessage: string;
    context: string;
  }>;
  personalInsights: {
    strengths: string[];
    areasForImprovement: string[];
    motivationTriggers: string[];
    preferredFeedbackStyle: string;
  };
  lastInteraction: number;
}

const FEEDBACK_TEMPLATES: Record<string, Record<string, Record<string, string>>> = {
  ko: {
    quiz: {
      correct: "정답입니다! {name}님의 건강 지식이 정말 뛰어나네요! 🎯",
      incorrect: "{name}님, 아쉽지만 틀렸어요. 다시 한번 도전해볼까요? 💪",
      excellent: "완벽합니다! {name}님은 정말 건강 전문가 수준이에요! 🌟",
    },
    exercise: {
      start: "{name}님, 오늘도 화이팅! 함께 시작해볼까요? 🏃",
      progress: "좋은 페이스 유지 중! {name}님 정말 잘하고 있어요! 💯",
      complete: "완료했어요! {name}님의 노력이 정말 멋있습니다! 🏆",
    },
    game: {
      start: "{name}님, 게임으로 즐겁게 배워봅시다! 🎮",
      progress: "점수가 올라가고 있어요! {name}님 최고! ⚡",
      complete: "게임 완료! {name}님의 전략이 정말 좋았어요! 🎉",
    },
    meditation: {
      start: "{name}님, 마음을 편하게 가져봅시다. 🧘",
      progress: "깊은 호흡 잘하고 있어요! {name}님 정말 차분하시네요. 🌬️",
      complete: "명상 완료! {name}님의 마음이 더 맑아졌을 거예요. ✨",
    },
    nutrition: {
      start: "{name}님, 건강한 식단 정보를 알려드릴게요! 🥗",
      progress: "좋은 선택이에요! {name}님의 영양 관리 정말 훌륭합니다! 👍",
      complete: "오늘도 건강한 식단 완료! {name}님 정말 잘하고 있어요! 💚",
    },
    sleep: {
      start: "{name}님, 오늘 밤 숙면을 위한 팁을 알려드릴게요! 😴",
      progress: "좋은 수면 습관 형성 중! {name}님 정말 잘하고 있어요! 🌙",
      complete: "숙면 완료! {name}님의 수면 질이 정말 개선되고 있어요! ⭐",
    },
    mission: {
      start: "{name}님, 오늘의 미션을 시작해봅시다! 🎯",
      progress: "미션 진행 중! {name}님 정말 잘하고 있어요! 💪",
      complete: "미션 완료! {name}님의 성장이 정말 멋있습니다! 🏆",
    },
  },
  en: {
    quiz: {
      correct: "Correct! {name}, your health knowledge is amazing! 🎯",
      incorrect: "{name}, that's not quite right. Let's try again! 💪",
      excellent: "Perfect! {name}, you're a health expert! 🌟",
    },
    exercise: {
      start: "{name}, let's get started today! 🏃",
      progress: "Great pace! {name}, you're doing awesome! 💯",
      complete: "Done! {name}, your effort is incredible! 🏆",
    },
    game: {
      start: "{name}, let's learn through gaming! 🎮",
      progress: "Your score is rising! {name}, you're the best! ⚡",
      complete: "Game complete! {name}, great strategy! 🎉",
    },
    meditation: {
      start: "{name}, let's find peace together. 🧘",
      progress: "Great breathing! {name}, you're so calm. 🌬️",
      complete: "Meditation done! {name}, your mind is clearer. ✨",
    },
    nutrition: {
      start: "{name}, let me share healthy eating tips! 🥗",
      progress: "Great choice! {name}, your nutrition is excellent! 👍",
      complete: "Healthy eating done! {name}, keep it up! 💚",
    },
    sleep: {
      start: "{name}, here are tips for a good night's sleep! 😴",
      progress: "Building good sleep habits! {name}, well done! 🌙",
      complete: "Sleep complete! {name}, your sleep quality is improving! ⭐",
    },
    mission: {
      start: "{name}, let's start today's mission! 🎯",
      progress: "Mission in progress! {name}, you're doing great! 💪",
      complete: "Mission complete! {name}, your growth is amazing! 🏆",
    },
  },
  ja: {
    quiz: {
      correct: "正解です！{name}さんの健康知識は素晴らしい！🎯",
      incorrect: "{name}さん、残念ながら間違っています。もう一度チャレンジしましょう！💪",
      excellent: "完璧です！{name}さんは健康専門家レベルです！🌟",
    },
    exercise: {
      start: "{name}さん、今日も頑張りましょう！🏃",
      progress: "いいペースです！{name}さん、素晴らしい！💯",
      complete: "完了です！{name}さんの努力は素晴らしい！🏆",
    },
    game: {
      start: "{name}さん、ゲームで楽しく学びましょう！🎮",
      progress: "スコアが上がっています！{name}さん、最高！⚡",
      complete: "ゲーム完了！{name}さんの戦略は素晴らしい！🎉",
    },
    meditation: {
      start: "{name}さん、一緒に心を落ち着かせましょう。🧘",
      progress: "深呼吸が上手です！{name}さん、本当に落ち着いていますね。🌬️",
      complete: "瞑想完了！{name}さんの心がより清らかになったでしょう。✨",
    },
    nutrition: {
      start: "{name}さん、健康的な食事情報をお知らせします！🥗",
      progress: "いい選択です！{name}さんの栄養管理は素晴らしい！👍",
      complete: "今日も健康的な食事完了！{name}さん、素晴らしい！💚",
    },
    sleep: {
      start: "{name}さん、今夜の良い睡眠のためのコツをお知らせします！😴",
      progress: "良い睡眠習慣を形成中！{name}さん、素晴らしい！🌙",
      complete: "睡眠完了！{name}さんの睡眠の質が本当に改善されています！⭐",
    },
    mission: {
      start: "{name}さん、今日のミッションを始めましょう！🎯",
      progress: "ミッション進行中！{name}さん、素晴らしい！💪",
      complete: "ミッション完了！{name}さんの成長は素晴らしい！🏆",
    },
  },
  zh: {
    quiz: {
      correct: "正确！{name}的健康知识真是太棒了！🎯",
      incorrect: "{name}，很遗憾答错了。让我们再试一次吧！💪",
      excellent: "完美！{name}你是健康专家级别！🌟",
    },
    exercise: {
      start: "{name}，今天也要加油！🏃",
      progress: "节奏很好！{name}你做得真棒！💯",
      complete: "完成了！{name}你的努力真令人敬佩！🏆",
    },
    game: {
      start: "{name}，让我们通过游戏快乐地学习！🎮",
      progress: "分数在上升！{name}你是最棒的！⚡",
      complete: "游戏完成！{name}你的策略真不错！🎉",
    },
    meditation: {
      start: "{name}，让我们一起找到平静。🧘",
      progress: "呼吸很好！{name}你真的很平静。🌬️",
      complete: "冥想完成！{name}你的心灵更清晰了。✨",
    },
    nutrition: {
      start: "{name}，让我分享健康饮食建议！🥗",
      progress: "很好的选择！{name}你的营养管理太棒了！👍",
      complete: "健康饮食完成！{name}继续加油！💚",
    },
    sleep: {
      start: "{name}，这是今晚好睡眠的建议！😴",
      progress: "正在养成良好的睡眠习惯！{name}做得很好！🌙",
      complete: "睡眠完成！{name}你的睡眠质量真的在改善！⭐",
    },
    mission: {
      start: "{name}，让我们开始今天的任务！🎯",
      progress: "任务进行中！{name}你做得很好！💪",
      complete: "任务完成！{name}你的成长真棒！🏆",
    },
  },
};

export class RealTimeCoachingFeedbackEngine {
  private userMemories: Map<string, UserCoachingMemory> = new Map();
  private feedbackHistory: CoachingFeedback[] = [];

  /**
   * 사용자 코칭 메모리 초기화
   */
  initializeUserMemory(userId: string, userProfile: {
    name: string;
    age?: number;
    fitnessLevel?: string;
    goals?: string[];
    preferences?: string[];
  }): UserCoachingMemory {
    const memory: UserCoachingMemory = {
      userId,
      name: userProfile.name,
      preferences: new Map(),
      achievementHistory: [],
      conversationHistory: [],
      personalInsights: {
        strengths: [],
        areasForImprovement: [],
        motivationTriggers: [],
        preferredFeedbackStyle: "encouraging",
      },
      lastInteraction: Date.now(),
    };

    this.userMemories.set(userId, memory);
    return memory;
  }

  /**
   * 실시간 AI 코치 피드백 생성
   */
  async generateRealtimeFeedback(context: CoachingFeedbackContext): Promise<CoachingFeedback> {
    const userMemory = this.userMemories.get(context.userId) || this.initializeUserMemory(context.userId, context.userProfile);

    // 템플릿 기반 기본 피드백
    const template = (FEEDBACK_TEMPLATES[context.language] || FEEDBACK_TEMPLATES.ko)[context.activityType];
    let baseMessage = template?.complete || "잘하고 있어요!";
    baseMessage = baseMessage.replace("{name}", context.userProfile.name);

    // LLM을 통한 개인화된 피드백 생성
    const llmPrompt = `
당신은 친절하고 격려적인 AI 건강 코치입니다.
사용자: ${context.userProfile.name} (${context.userProfile.age || "나이 미상"}세)
활동: ${context.activityName}
현재 HanJin 레벨: ${context.currentHanJinLevel}
성능: 점수 ${context.performanceData.score || "N/A"}, 지속시간 ${context.performanceData.duration || "N/A"}분

사용자의 최근 성과:
${userMemory.achievementHistory.slice(-3).map((a) => `- ${a.activity}: ${a.achievement}`).join("\n")}

매우 짧고 따뜻한 격려 메시지(한 문장, 최대 50자)를 생성해주세요.
${context.language === "ko" ? "한국어" : context.language === "en" ? "English" : "Japanese"}로 작성하세요.
`;

    const llmResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "당신은 친절하고 격려적인 AI 건강 코치입니다. 매우 짧고 따뜻한 메시지를 생성합니다.",
        },
        {
          role: "user",
          content: llmPrompt,
        },
      ],
    });

    let personalizedFeedback = baseMessage;
    const llmContent = llmResponse.choices?.[0]?.message?.content;
    if (typeof llmContent === "string") {
      personalizedFeedback = llmContent;
    }

    // 포인트 계산
    const pointsAwarded = this.calculatePoints(context);

    // 피드백 객체 생성
    const feedback: CoachingFeedback = {
      id: `feedback_${Date.now()}`,
      userId: context.userId,
      activityType: context.activityType,
      timestamp: Date.now(),
      textFeedback: personalizedFeedback,
      pointsAwarded,
      motivationLevel: this.calculateMotivationLevel(context),
      nextSuggestion: this.generateNextSuggestion(context, userMemory),
      emoji: this.selectEmoji(context.activityType),
    };

    // 메모리 업데이트
    userMemory.conversationHistory.push({
      timestamp: feedback.timestamp,
      coachMessage: personalizedFeedback || baseMessage,
      context: context.activityType,
    });
    userMemory.lastInteraction = Date.now();

    // 피드백 히스토리 저장
    this.feedbackHistory.push(feedback);

    return feedback;
  }

  /**
   * 포인트 계산
   */
  private calculatePoints(context: CoachingFeedbackContext): number {
    let basePoints = 50;

    // 활동 유형별 포인트
    const activityPoints: Record<string, number> = {
      quiz: 30,
      exercise: 100,
      game: 50,
      meditation: 40,
      nutrition: 35,
      sleep: 60,
      mission: 150,
    };

    basePoints = activityPoints[context.activityType] || 50;

    // 성능 기반 보너스
    if (context.performanceData.score) {
      const scoreBonus = Math.round((context.performanceData.score / 100) * 30);
      basePoints += scoreBonus;
    }

    // HanJin 레벨 보너스
    if (context.currentHanJinLevel > 5) {
      basePoints += 20;
    }

    return basePoints;
  }

  /**
   * 동기 부여 레벨 계산
   */
  private calculateMotivationLevel(context: CoachingFeedbackContext): "low" | "medium" | "high" {
    const score = (context.performanceData.score || 0) + context.currentHanJinLevel * 5;
    if (score > 150) return "high";
    if (score > 80) return "medium";
    return "low";
  }

  /**
   * 다음 제안 생성
   */
  private generateNextSuggestion(context: CoachingFeedbackContext, memory: UserCoachingMemory): string {
    const suggestions: Record<string, string[]> = {
      ko: [
        `다음 미션: 더 높은 난이도의 ${context.activityName} 도전해보세요!`,
        `${context.userProfile.name}님의 강점을 더 키워봅시다!`,
        `내일도 함께 건강 여정을 계속해봐요!`,
        `이제 다른 활동도 시도해볼까요?`,
      ],
      en: [
        `Next mission: Try a harder ${context.activityName}!`,
        `Let's build on your strengths!`,
        `See you tomorrow for another health journey!`,
        `Want to try a different activity?`,
      ],
      ja: [
        `次のミッション：より難しい${context.activityName}に挑戦してみましょう！`,
        `${context.userProfile.name}さんの強みをもっと伸ばしましょう！`,
        `明日も一緒に健康の旅を続けましょう！`,
        `別のアクティビティも試してみませんか？`,
      ],
      zh: [
        `下一个任务：尝试更难的${context.activityName}！`,
        `让我们发展${context.userProfile.name}的优势！`,
        `明天继续我们的健康之旅！`,
        `想尝试其他活动吗？`,
      ],
    };

    const suggestionList = suggestions[context.language] || suggestions.ko;
    return suggestionList[Math.floor(Math.random() * suggestionList.length)];
  }

  /**
   * 이모지 선택
   */
  private selectEmoji(activityType: string): string {
    const emojis: Record<string, string> = {
      quiz: "🧠",
      exercise: "💪",
      game: "🎮",
      meditation: "🧘",
      nutrition: "🥗",
      sleep: "😴",
      mission: "🎯",
      default: "✨",
    };
    return emojis[activityType] || emojis.default;
  }

  /**
   * 사용자 메모리 조회
   */
  getUserMemory(userId: string): UserCoachingMemory | null {
    return this.userMemories.get(userId) || null;
  }

  /**
   * 사용자 메모리 업데이트
   */
  updateUserMemory(userId: string, updates: Partial<UserCoachingMemory>): void {
    const memory = this.userMemories.get(userId);
    if (memory) {
      Object.assign(memory, updates);
      memory.lastInteraction = Date.now();
    }
  }

  /**
   * 성과 기록
   */
  recordAchievement(userId: string, activity: string, achievement: string, points: number): void {
    const memory = this.userMemories.get(userId);
    if (memory) {
      memory.achievementHistory.push({
        date: Date.now(),
        activity,
        achievement,
        points,
      });
    }
  }

  /**
   * 피드백 히스토리 조회
   */
  getFeedbackHistory(userId: string, limit: number = 10): CoachingFeedback[] {
    return this.feedbackHistory.filter((f) => f.userId === userId).slice(-limit);
  }

  /**
   * 사용자별 통계
   */
  getUserStats(userId: string): {
    totalPoints: number;
    totalActivities: number;
    averageMotivation: number;
    lastInteraction: number;
  } {
    const memory = this.userMemories.get(userId);
    if (!memory) {
      return { totalPoints: 0, totalActivities: 0, averageMotivation: 0, lastInteraction: 0 };
    }

    const userFeedback = this.feedbackHistory.filter((f) => f.userId === userId);
    const totalPoints = userFeedback.reduce((sum, f) => sum + f.pointsAwarded, 0);
    const totalActivities = userFeedback.length;
    const motivationScores = userFeedback.map((f) => (f.motivationLevel === "high" ? 3 : f.motivationLevel === "medium" ? 2 : 1));
    const averageMotivation = motivationScores.length > 0 ? motivationScores.reduce((a, b) => a + b, 0) / motivationScores.length : 0;

    return {
      totalPoints,
      totalActivities,
      averageMotivation,
      lastInteraction: memory.lastInteraction,
    };
  }
}

// 싱글톤 인스턴스
let feedbackEngine: RealTimeCoachingFeedbackEngine | null = null;

export function getRealTimeCoachingFeedbackEngine(): RealTimeCoachingFeedbackEngine {
  if (!feedbackEngine) {
    feedbackEngine = new RealTimeCoachingFeedbackEngine();
  }
  return feedbackEngine;
}

export function resetRealTimeCoachingFeedbackEngine(): void {
  feedbackEngine = null;
}
