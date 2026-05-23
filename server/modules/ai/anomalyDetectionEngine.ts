import { invokeLLM } from "../../_core/llm";

export type SeverityLevel = "low" | "medium" | "high" | "critical";

export interface BiometricThresholds {
  heartRate: { min: number; max: number; critical: { min: number; max: number } };
  bloodOxygen: { min: number; max: number; critical: { min: number; max: number } };
  bodyTemperature: { min: number; max: number; critical: { min: number; max: number } };
  bloodPressure: { systolic: { min: number; max: number }; diastolic: { min: number; max: number } };
  respiratoryRate: { min: number; max: number; critical: { min: number; max: number } };
  stressLevel: { min: number; max: number; critical: { min: number; max: number } };
}

export interface AnomalyDetectionResult {
  id: string;
  userId: string;
  timestamp: number;
  anomalyDetected: boolean;
  severity: SeverityLevel;
  anomalies: Array<{
    metric: string;
    value: number;
    normalRange: { min: number; max: number };
    deviation: number;
    severity: SeverityLevel;
  }>;
  emergencyAdvice: string;
  recommendedActions: string[];
  aiAnalysis: string;
  notificationSent: boolean;
  userAcknowledged: boolean;
}

// 기본 임계값 설정 (성인 기준)
const DEFAULT_THRESHOLDS: BiometricThresholds = {
  heartRate: {
    min: 60,
    max: 100,
    critical: { min: 40, max: 150 },
  },
  bloodOxygen: {
    min: 95,
    max: 100,
    critical: { min: 88, max: 100 },
  },
  bodyTemperature: {
    min: 36.1,
    max: 37.2,
    critical: { min: 35.0, max: 39.5 },
  },
  bloodPressure: {
    systolic: { min: 90, max: 120 },
    diastolic: { min: 60, max: 80 },
  },
  respiratoryRate: {
    min: 12,
    max: 20,
    critical: { min: 8, max: 30 },
  },
  stressLevel: {
    min: 0,
    max: 50,
    critical: { min: 0, max: 100 },
  },
};

export class AnomalyDetectionEngine {
  private userId: string;
  private thresholds: BiometricThresholds;
  private anomalyHistory: AnomalyDetectionResult[] = [];

  constructor(userId: string, customThresholds?: Partial<BiometricThresholds>) {
    this.userId = userId;
    this.thresholds = {
      ...DEFAULT_THRESHOLDS,
      ...customThresholds,
    };
  }

  /**
   * 생체 데이터 이상 감지
   */
  async detectAnomalies(metrics: {
    heartRate?: number;
    bloodOxygen?: number;
    bodyTemperature?: number;
    systolicBP?: number;
    diastolicBP?: number;
    respiratoryRate?: number;
    stressLevel?: number;
  }): Promise<AnomalyDetectionResult> {
    const result: AnomalyDetectionResult = {
      id: `anomaly-${Date.now()}`,
      userId: this.userId,
      timestamp: Date.now(),
      anomalyDetected: false,
      severity: "low",
      anomalies: [],
      emergencyAdvice: "",
      recommendedActions: [],
      aiAnalysis: "",
      notificationSent: false,
      userAcknowledged: false,
    };

    // 심박수 확인
    if (metrics.heartRate !== undefined) {
      const hrAnomaly = this.checkHeartRate(metrics.heartRate);
      if (hrAnomaly) {
        result.anomalies.push(hrAnomaly);
        result.anomalyDetected = true;
      }
    }

    // 혈산소 포화도 확인
    if (metrics.bloodOxygen !== undefined) {
      const o2Anomaly = this.checkBloodOxygen(metrics.bloodOxygen);
      if (o2Anomaly) {
        result.anomalies.push(o2Anomaly);
        result.anomalyDetected = true;
      }
    }

    // 체온 확인
    if (metrics.bodyTemperature !== undefined) {
      const tempAnomaly = this.checkBodyTemperature(metrics.bodyTemperature);
      if (tempAnomaly) {
        result.anomalies.push(tempAnomaly);
        result.anomalyDetected = true;
      }
    }

    // 혈압 확인
    if (metrics.systolicBP !== undefined && metrics.diastolicBP !== undefined) {
      const bpAnomaly = this.checkBloodPressure(metrics.systolicBP, metrics.diastolicBP);
      if (bpAnomaly) {
        result.anomalies.push(...bpAnomaly);
        result.anomalyDetected = true;
      }
    }

    // 호흡수 확인
    if (metrics.respiratoryRate !== undefined) {
      const rrAnomaly = this.checkRespiratoryRate(metrics.respiratoryRate);
      if (rrAnomaly) {
        result.anomalies.push(rrAnomaly);
        result.anomalyDetected = true;
      }
    }

    // 스트레스 레벨 확인
    if (metrics.stressLevel !== undefined) {
      const stressAnomaly = this.checkStressLevel(metrics.stressLevel);
      if (stressAnomaly) {
        result.anomalies.push(stressAnomaly);
        result.anomalyDetected = true;
      }
    }

    // 심각도 결정
    if (result.anomalyDetected) {
      result.severity = this.determineSeverity(result.anomalies);

      // AI 응급 조언 생성
      const advice = await this.generateEmergencyAdvice(metrics, result.anomalies);
      result.emergencyAdvice = advice.advice;
      result.recommendedActions = advice.actions;
      result.aiAnalysis = advice.analysis;
    }

    // 히스토리에 저장
    this.anomalyHistory.push(result);

    return result;
  }

  /**
   * 심박수 이상 감지
   */
  private checkHeartRate(value: number): AnomalyDetectionResult["anomalies"][0] | null {
    const thresholds = this.thresholds.heartRate;

    if (value < thresholds.critical.min || value > thresholds.critical.max) {
      return {
        metric: "심박수",
        value,
        normalRange: { min: thresholds.min, max: thresholds.max },
        deviation: value < thresholds.min ? thresholds.min - value : value - thresholds.max,
        severity: value < 40 || value > 150 ? "critical" : value < thresholds.min || value > thresholds.max ? "high" : "medium",
      };
    }

    if (value < thresholds.min || value > thresholds.max) {
      return {
        metric: "심박수",
        value,
        normalRange: { min: thresholds.min, max: thresholds.max },
        deviation: value < thresholds.min ? thresholds.min - value : value - thresholds.max,
        severity: "medium",
      };
    }

    return null;
  }

  /**
   * 혈산소 포화도 이상 감지
   */
  private checkBloodOxygen(value: number): AnomalyDetectionResult["anomalies"][0] | null {
    const thresholds = this.thresholds.bloodOxygen;

    if (value < thresholds.critical.min) {
      return {
        metric: "혈산소 포화도",
        value,
        normalRange: { min: thresholds.min, max: thresholds.max },
        deviation: thresholds.min - value,
        severity: "critical",
      };
    }

    if (value < thresholds.min) {
      return {
        metric: "혈산소 포화도",
        value,
        normalRange: { min: thresholds.min, max: thresholds.max },
        deviation: thresholds.min - value,
        severity: "high",
      };
    }

    return null;
  }

  /**
   * 체온 이상 감지
   */
  private checkBodyTemperature(value: number): AnomalyDetectionResult["anomalies"][0] | null {
    const thresholds = this.thresholds.bodyTemperature;

    if (value < thresholds.critical.min || value > thresholds.critical.max) {
      return {
        metric: "체온",
        value,
        normalRange: { min: thresholds.min, max: thresholds.max },
        deviation: value < thresholds.min ? thresholds.min - value : value - thresholds.max,
        severity: value < 35 || value > 39.5 ? "critical" : "high",
      };
    }

    if (value < thresholds.min || value > thresholds.max) {
      return {
        metric: "체온",
        value,
        normalRange: { min: thresholds.min, max: thresholds.max },
        deviation: value < thresholds.min ? thresholds.min - value : value - thresholds.max,
        severity: "medium",
      };
    }

    return null;
  }

  /**
   * 혈압 이상 감지
   */
  private checkBloodPressure(systolic: number, diastolic: number): AnomalyDetectionResult["anomalies"][0][] {
    const anomalies: AnomalyDetectionResult["anomalies"][0][] = [];
    const thresholds = this.thresholds.bloodPressure;

    // 수축기 혈압 확인
    if (systolic < thresholds.systolic.min || systolic > thresholds.systolic.max) {
      anomalies.push({
        metric: "수축기 혈압",
        value: systolic,
        normalRange: { min: thresholds.systolic.min, max: thresholds.systolic.max },
        deviation: systolic < thresholds.systolic.min ? thresholds.systolic.min - systolic : systolic - thresholds.systolic.max,
        severity: systolic > 180 || systolic < 70 ? "high" : "medium",
      });
    }

    // 이완기 혈압 확인
    if (diastolic < thresholds.diastolic.min || diastolic > thresholds.diastolic.max) {
      anomalies.push({
        metric: "이완기 혈압",
        value: diastolic,
        normalRange: { min: thresholds.diastolic.min, max: thresholds.diastolic.max },
        deviation: diastolic < thresholds.diastolic.min ? thresholds.diastolic.min - diastolic : diastolic - thresholds.diastolic.max,
        severity: diastolic > 110 || diastolic < 50 ? "high" : "medium",
      });
    }

    return anomalies;
  }

  /**
   * 호흡수 이상 감지
   */
  private checkRespiratoryRate(value: number): AnomalyDetectionResult["anomalies"][0] | null {
    const thresholds = this.thresholds.respiratoryRate;

    if (value < thresholds.critical.min || value > thresholds.critical.max) {
      return {
        metric: "호흡수",
        value,
        normalRange: { min: thresholds.min, max: thresholds.max },
        deviation: value < thresholds.min ? thresholds.min - value : value - thresholds.max,
        severity: value < 8 || value > 30 ? "critical" : "high",
      };
    }

    if (value < thresholds.min || value > thresholds.max) {
      return {
        metric: "호흡수",
        value,
        normalRange: { min: thresholds.min, max: thresholds.max },
        deviation: value < thresholds.min ? thresholds.min - value : value - thresholds.max,
        severity: "medium",
      };
    }

    return null;
  }

  /**
   * 스트레스 레벨 이상 감지
   */
  private checkStressLevel(value: number): AnomalyDetectionResult["anomalies"][0] | null {
    const thresholds = this.thresholds.stressLevel;

    if (value > thresholds.critical.max) {
      return {
        metric: "스트레스 레벨",
        value,
        normalRange: { min: thresholds.min, max: thresholds.max },
        deviation: value - thresholds.max,
        severity: "high",
      };
    }

    if (value > thresholds.max) {
      return {
        metric: "스트레스 레벨",
        value,
        normalRange: { min: thresholds.min, max: thresholds.max },
        deviation: value - thresholds.max,
        severity: "medium",
      };
    }

    return null;
  }

  /**
   * 심각도 결정
   */
  private determineSeverity(anomalies: AnomalyDetectionResult["anomalies"][0][]): SeverityLevel {
    if (anomalies.some((a) => a.severity === "critical")) return "critical";
    if (anomalies.some((a) => a.severity === "high")) return "high";
    if (anomalies.some((a) => a.severity === "medium")) return "medium";
    return "low";
  }

  /**
   * AI 응급 조언 생성
   */
  private async generateEmergencyAdvice(
    metrics: Record<string, number | undefined>,
    anomalies: AnomalyDetectionResult["anomalies"][0][]
  ): Promise<{ advice: string; actions: string[]; analysis: string }> {
    const anomalyDescriptions = anomalies
      .map((a) => `${a.metric}: ${a.value} (정상범위: ${a.normalRange.min}-${a.normalRange.max})`)
      .join("\n");

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `당신은 응급 의료 상담 AI입니다. 사용자의 생체 데이터 이상을 분석하고 즉시 대응 조언을 제공합니다.`,
          },
          {
            role: "user",
            content: `생체 데이터 이상 감지:\n${anomalyDescriptions}\n\n다음 JSON 형식으로 응답하세요:\n{\n  "advice": "즉시 대응 조언 (1-2문장)",\n  "actions": ["권장 조치 1", "권장 조치 2", "권장 조치 3"],\n  "analysis": "상황 분석 및 설명"\n}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "emergency_advice",
            strict: true,
            schema: {
              type: "object",
              properties: {
                advice: { type: "string", description: "즉시 대응 조언" },
                actions: { type: "array", items: { type: "string" }, description: "권장 조치" },
                analysis: { type: "string", description: "상황 분석" },
              },
              required: ["advice", "actions", "analysis"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0]?.message?.content;
      if (typeof content === "string") {
        const parsed = JSON.parse(content);
        return {
          advice: parsed.advice || "의료 전문가의 상담을 받으세요.",
          actions: parsed.actions || ["휴식을 취하세요", "의료 전문가에게 연락하세요"],
          analysis: parsed.analysis || "생체 데이터에 이상이 감지되었습니다.",
        };
      }
    } catch (error) {
      console.error("AI 응급 조언 생성 실패:", error);
    }

    return {
      advice: "의료 전문가의 상담을 받으세요.",
      actions: ["휴식을 취하세요", "의료 전문가에게 연락하세요", "필요시 응급차를 부르세요"],
      analysis: "생체 데이터에 이상이 감지되었습니다.",
    };
  }

  /**
   * 이상 기록 조회
   */
  getAnomalyHistory(limit: number = 50): AnomalyDetectionResult[] {
    return this.anomalyHistory.slice(-limit);
  }

  /**
   * 특정 기간의 이상 기록 조회
   */
  getAnomaliesByDateRange(startDate: number, endDate: number): AnomalyDetectionResult[] {
    return this.anomalyHistory.filter((a) => a.timestamp >= startDate && a.timestamp <= endDate);
  }

  /**
   * 심각도별 이상 기록 조회
   */
  getAnomaliesBySeverity(severity: SeverityLevel): AnomalyDetectionResult[] {
    return this.anomalyHistory.filter((a) => a.severity === severity);
  }

  /**
   * 임계값 업데이트
   */
  updateThresholds(customThresholds: Partial<BiometricThresholds>): void {
    this.thresholds = {
      ...this.thresholds,
      ...customThresholds,
    };
  }

  /**
   * 이상 기록 확인 표시
   */
  acknowledgeAnomaly(anomalyId: string): boolean {
    const anomaly = this.anomalyHistory.find((a) => a.id === anomalyId);
    if (anomaly) {
      anomaly.userAcknowledged = true;
      return true;
    }
    return false;
  }
}

// 싱글톤 인스턴스 관리
const anomalyEngines = new Map<string, AnomalyDetectionEngine>();

export function getAnomalyDetectionEngine(userId: string, customThresholds?: Partial<BiometricThresholds>): AnomalyDetectionEngine {
  if (!anomalyEngines.has(userId)) {
    anomalyEngines.set(userId, new AnomalyDetectionEngine(userId, customThresholds));
  }
  return anomalyEngines.get(userId)!;
}

