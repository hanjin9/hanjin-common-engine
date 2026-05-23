/**
 * AI 건강 분석 엔진
 * 생체 데이터를 분석하고 HanJin 레벨을 자동 계산
 * 
 * 기능:
 * - 생체 데이터 분석
 * - HanJin 레벨 자동 계산
 * - 건강 상태 평가
 * - 자동 포인트 지급
 * - AI 피드백 생성
 */

import { HanJinLevel, valueToHanJinLevel, getHanJinLevelConfig } from "../../../shared/hanJinLevelSpectrum";

export interface HealthDataAnalysis {
  timestamp: number;
  heartRate: {
    value: number;
    hanJinLevel: HanJinLevel;
    status: string;
  };
  steps: {
    value: number;
    hanJinLevel: HanJinLevel;
    status: string;
  };
  sleep: {
    value: number;
    hanJinLevel: HanJinLevel;
    status: string;
  };
  calories: {
    value: number;
    hanJinLevel: HanJinLevel;
    status: string;
  };
  bloodPressure: {
    systolic: number;
    diastolic: number;
    hanJinLevel: HanJinLevel;
    status: string;
  };
  oxygenSaturation: {
    value: number;
    hanJinLevel: HanJinLevel;
    status: string;
  };
  overallScore: number;
  overallHanJinLevel: HanJinLevel;
  pointsEarned: number;
  feedback: string;
}

/**
 * AI 건강 분석 엔진 클래스
 */
export class AIHealthAnalysisEngine {
  private userId: string;
  private analysisHistory: HealthDataAnalysis[] = [];

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * 생체 데이터 분석
   */
  async analyzeHealthData(data: {
    heartRate?: number;
    steps?: number;
    sleep?: number;
    calories?: number;
    bloodPressure?: { systolic: number; diastolic: number };
    oxygenSaturation?: number;
  }): Promise<HealthDataAnalysis> {
    const timestamp = Date.now();

    // 각 지표별 분석
    const heartRateAnalysis = this.analyzeHeartRate(data.heartRate || 0);
    const stepsAnalysis = this.analyzeSteps(data.steps || 0);
    const sleepAnalysis = this.analyzeSleep(data.sleep || 0);
    const caloriesAnalysis = this.analyzeCalories(data.calories || 0);
    const bloodPressureAnalysis = this.analyzeBloodPressure(
      data.bloodPressure || { systolic: 120, diastolic: 80 }
    );
    const oxygenAnalysis = this.analyzeOxygenSaturation(data.oxygenSaturation || 0);

    // 종합 점수 계산
    const overallScore = this.calculateOverallScore({
      heartRate: heartRateAnalysis.hanJinLevel,
      steps: stepsAnalysis.hanJinLevel,
      sleep: sleepAnalysis.hanJinLevel,
      calories: caloriesAnalysis.hanJinLevel,
      bloodPressure: bloodPressureAnalysis.hanJinLevel,
      oxygen: oxygenAnalysis.hanJinLevel,
    });

    // 포인트 계산
    const pointsEarned = this.calculatePoints(overallScore);

    // AI 피드백 생성
    const feedback = this.generateFeedback({
      heartRate: heartRateAnalysis,
      steps: stepsAnalysis,
      sleep: sleepAnalysis,
      calories: caloriesAnalysis,
      bloodPressure: bloodPressureAnalysis,
      oxygen: oxygenAnalysis,
      overallScore,
    });

    const analysis: HealthDataAnalysis = {
      timestamp,
      heartRate: heartRateAnalysis,
      steps: stepsAnalysis,
      sleep: sleepAnalysis,
      calories: caloriesAnalysis,
      bloodPressure: bloodPressureAnalysis,
      oxygenSaturation: oxygenAnalysis,
      overallScore,
      overallHanJinLevel: valueToHanJinLevel(overallScore),
      pointsEarned,
      feedback,
    };

    this.analysisHistory.push(analysis);
    return analysis;
  }

  /**
   * 심박수 분석
   */
  private analyzeHeartRate(value: number): {
    value: number;
    hanJinLevel: HanJinLevel;
    status: string;
  } {
    let score = 50; // 기본값

    if (value === 0) {
      score = 0;
    } else if (value < 60) {
      score = 30; // 저심박수
    } else if (value >= 60 && value <= 100) {
      score = 85; // 정상 범위
    } else if (value > 100 && value <= 120) {
      score = 60; // 약간 높음
    } else {
      score = 30; // 매우 높음
    }

    return {
      value,
      hanJinLevel: valueToHanJinLevel(score),
      status:
        score >= 80
          ? "Excellent"
          : score >= 60
            ? "Good"
            : score >= 40
              ? "Fair"
              : "Poor",
    };
  }

  /**
   * 보행 수 분석
   */
  private analyzeSteps(value: number): {
    value: number;
    hanJinLevel: HanJinLevel;
    status: string;
  } {
    let score = 50;

    if (value === 0) {
      score = 0;
    } else if (value < 3000) {
      score = 30;
    } else if (value >= 3000 && value < 7000) {
      score = 60;
    } else if (value >= 7000 && value < 10000) {
      score = 80;
    } else {
      score = 95;
    }

    return {
      value,
      hanJinLevel: valueToHanJinLevel(score),
      status:
        score >= 80
          ? "Excellent"
          : score >= 60
            ? "Good"
            : score >= 40
              ? "Fair"
              : "Poor",
    };
  }

  /**
   * 수면 분석
   */
  private analyzeSleep(value: number): {
    value: number;
    hanJinLevel: HanJinLevel;
    status: string;
  } {
    let score = 50;

    if (value === 0) {
      score = 0;
    } else if (value < 5) {
      score = 30;
    } else if (value >= 5 && value < 7) {
      score = 60;
    } else if (value >= 7 && value <= 9) {
      score = 90;
    } else {
      score = 70;
    }

    return {
      value,
      hanJinLevel: valueToHanJinLevel(score),
      status:
        score >= 80
          ? "Excellent"
          : score >= 60
            ? "Good"
            : score >= 40
              ? "Fair"
              : "Poor",
    };
  }

  /**
   * 칼로리 분석
   */
  private analyzeCalories(value: number): {
    value: number;
    hanJinLevel: HanJinLevel;
    status: string;
  } {
    let score = 50;

    if (value === 0) {
      score = 0;
    } else if (value < 500) {
      score = 30;
    } else if (value >= 500 && value < 1500) {
      score = 60;
    } else if (value >= 1500 && value < 2500) {
      score = 85;
    } else {
      score = 70;
    }

    return {
      value,
      hanJinLevel: valueToHanJinLevel(score),
      status:
        score >= 80
          ? "Excellent"
          : score >= 60
            ? "Good"
            : score >= 40
              ? "Fair"
              : "Poor",
    };
  }

  /**
   * 혈압 분석
   */
  private analyzeBloodPressure(value: {
    systolic: number;
    diastolic: number;
  }): {
    systolic: number;
    diastolic: number;
    hanJinLevel: HanJinLevel;
    status: string;
  } {
    let score = 50;

    const { systolic, diastolic } = value;

    if (systolic < 120 && diastolic < 80) {
      score = 90; // 정상
    } else if (systolic < 130 && diastolic < 80) {
      score = 75; // 약간 높음
    } else if (systolic < 140 && diastolic < 90) {
      score = 50; // 1단계 고혈압
    } else {
      score = 20; // 2단계 고혈압
    }

    return {
      systolic,
      diastolic,
      hanJinLevel: valueToHanJinLevel(score),
      status:
        score >= 80
          ? "Excellent"
          : score >= 60
            ? "Good"
            : score >= 40
              ? "Fair"
              : "Poor",
    };
  }

  /**
   * 산소포화도 분석
   */
  private analyzeOxygenSaturation(value: number): {
    value: number;
    hanJinLevel: HanJinLevel;
    status: string;
  } {
    let score = 50;

    if (value === 0) {
      score = 0;
    } else if (value < 95) {
      score = 30;
    } else if (value >= 95 && value <= 100) {
      score = 90;
    } else {
      score = 50;
    }

    return {
      value,
      hanJinLevel: valueToHanJinLevel(score),
      status:
        score >= 80
          ? "Excellent"
          : score >= 60
            ? "Good"
            : score >= 40
              ? "Fair"
              : "Poor",
    };
  }

  /**
   * 종합 점수 계산
   */
  private calculateOverallScore(levels: {
    heartRate: HanJinLevel;
    steps: HanJinLevel;
    sleep: HanJinLevel;
    calories: HanJinLevel;
    bloodPressure: HanJinLevel;
    oxygen: HanJinLevel;
  }): number {
    const scores = Object.values(levels).map((level) => {
      const config = getHanJinLevelConfig(level);
      // HanJin 레벨을 0-100 점수로 변환
      return ((level + 10) / 20) * 100;
    });

    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(average);
  }

  /**
   * 포인트 계산
   */
  private calculatePoints(overallScore: number): number {
    if (overallScore >= 90) return 500; // 최고
    if (overallScore >= 80) return 400; // 매우 좋음
    if (overallScore >= 70) return 300; // 좋음
    if (overallScore >= 60) return 200; // 보통
    if (overallScore >= 50) return 100; // 낮음
    return 0; // 매우 낮음
  }

  /**
   * AI 피드백 생성
   */
  private generateFeedback(data: {
    heartRate: any;
    steps: any;
    sleep: any;
    calories: any;
    bloodPressure: any;
    oxygen: any;
    overallScore: number;
  }): string {
    const feedbacks: string[] = [];

    if (data.heartRate.hanJinLevel >= 4) {
      feedbacks.push("Your heart rate is in excellent condition. Keep up the healthy lifestyle!");
    } else if (data.heartRate.hanJinLevel <= -4) {
      feedbacks.push("Your heart rate seems irregular. Consider consulting a healthcare provider.");
    }

    if (data.steps.hanJinLevel >= 4) {
      feedbacks.push("Great job on your daily steps! You're very active.");
    } else if (data.steps.hanJinLevel <= -4) {
      feedbacks.push("Try to increase your daily activity. Aim for at least 7,000 steps.");
    }

    if (data.sleep.hanJinLevel >= 4) {
      feedbacks.push("Excellent sleep quality! You're getting enough rest.");
    } else if (data.sleep.hanJinLevel <= -4) {
      feedbacks.push("Your sleep quality needs improvement. Try to get 7-9 hours of sleep.");
    }

    if (data.overallScore >= 80) {
      feedbacks.push("Overall, your health metrics are excellent! Keep maintaining this healthy lifestyle.");
    } else if (data.overallScore <= 40) {
      feedbacks.push("Your overall health metrics need attention. Consider making lifestyle changes.");
    }

    return feedbacks.join(" ");
  }

  /**
   * 분석 이력 가져오기
   */
  getAnalysisHistory(): HealthDataAnalysis[] {
    return this.analysisHistory;
  }

  /**
   * 최근 분석 가져오기
   */
  getLatestAnalysis(): HealthDataAnalysis | null {
    return this.analysisHistory.length > 0 ? this.analysisHistory[this.analysisHistory.length - 1] : null;
  }

  /**
   * 트렌드 분석
   */
  analyzeTrend(days: number = 7): {
    trend: "improving" | "declining" | "stable";
    change: number;
  } {
    if (this.analysisHistory.length < 2) {
      return { trend: "stable", change: 0 };
    }

    const recentAnalyses = this.analysisHistory.slice(-days);
    const firstScore = recentAnalyses[0].overallScore;
    const lastScore = recentAnalyses[recentAnalyses.length - 1].overallScore;
    const change = lastScore - firstScore;

    let trend: "improving" | "declining" | "stable" = "stable";
    if (change > 5) trend = "improving";
    if (change < -5) trend = "declining";

    return { trend, change };
  }
}

/**
 * 싱글톤 인스턴스
 */
let instance: AIHealthAnalysisEngine | null = null;

/**
 * AIHealthAnalysisEngine 인스턴스 가져오기
 */
export function getAIHealthAnalysisEngine(userId: string): AIHealthAnalysisEngine {
  if (!instance) {
    instance = new AIHealthAnalysisEngine(userId);
  }
  return instance;
}
