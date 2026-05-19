/**
 * HanJin 레벨 스펙트럼 색상 시스템
 * -10 ~ +10 (11단계)
 * 
 * 건강 상태, 스트레스, 감정, 에너지 등 모든 지표에 사용
 */

export type HanJinLevel = -10 | -8 | -6 | -4 | -2 | 0 | 2 | 4 | 6 | 8 | 10;

export interface HanJinLevelConfig {
  level: HanJinLevel;
  label: string;
  labelKo: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  emoji: string;
  description: string;
  descriptionKo: string;
  severity: "critical" | "warning" | "caution" | "neutral" | "good" | "excellent" | "optimal";
}

/**
 * HanJin 레벨 스펙트럼 정의
 * 
 * -10: 빨강 (극도 악화) - 긴급 상황
 * -8: 핑크 (심각 악화) - 경고
 * -6: 밤색 (악화) - 주의
 * -4: 주황 (약간 악화) - 부주의
 * -2: 노랑 (약간 저하) - 낮음
 * 0: 회색 (정상) - 중립
 * +2: 연녹색 (약간 향상) - 개선
 * +4: 녹색 (향상) - 좋음
 * +6: 연파랑 (우수) - 우수
 * +8: 파랑 (매우 우수) - 매우 좋음
 * +10: 보라 (최고) - 최상
 */

export const HANJIN_LEVEL_SPECTRUM: Record<HanJinLevel, HanJinLevelConfig> = {
  "-10": {
    level: -10,
    label: "Critical",
    labelKo: "극도 악화",
    color: "#FF0000",
    bgColor: "bg-red-600/30",
    textColor: "text-red-100",
    borderColor: "border-red-500/60",
    emoji: "🔴",
    description: "Critical condition - Immediate action required",
    descriptionKo: "극도 악화 - 즉시 조치 필요",
    severity: "critical",
  },
  "-8": {
    level: -8,
    label: "Severe Warning",
    labelKo: "심각 악화",
    color: "#FF1493",
    bgColor: "bg-pink-600/30",
    textColor: "text-pink-100",
    borderColor: "border-pink-500/60",
    emoji: "🟥",
    description: "Severe warning - Urgent attention needed",
    descriptionKo: "심각 악화 - 긴급 주의 필요",
    severity: "critical",
  },
  "-6": {
    level: -6,
    label: "Severe",
    labelKo: "악화",
    color: "#8B0000",
    bgColor: "bg-red-900/30",
    textColor: "text-red-200",
    borderColor: "border-red-700/60",
    emoji: "🔺",
    description: "Severe deterioration - Close monitoring required",
    descriptionKo: "악화 - 밀접한 모니터링 필요",
    severity: "warning",
  },
  "-4": {
    level: -4,
    label: "Caution",
    labelKo: "약간 악화",
    color: "#FF8C00",
    bgColor: "bg-orange-600/30",
    textColor: "text-orange-100",
    borderColor: "border-orange-500/60",
    emoji: "🟠",
    description: "Caution - Attention needed",
    descriptionKo: "약간 악화 - 주의 필요",
    severity: "caution",
  },
  "-2": {
    level: -2,
    label: "Low",
    labelKo: "약간 저하",
    color: "#FFD700",
    bgColor: "bg-yellow-600/30",
    textColor: "text-yellow-100",
    borderColor: "border-yellow-500/60",
    emoji: "🟡",
    description: "Below normal - Slight concern",
    descriptionKo: "약간 저하 - 약간의 우려",
    severity: "caution",
  },
  "0": {
    level: 0,
    label: "Normal",
    labelKo: "정상",
    color: "#808080",
    bgColor: "bg-gray-600/30",
    textColor: "text-gray-100",
    borderColor: "border-gray-500/60",
    emoji: "⚪",
    description: "Normal - Neutral state",
    descriptionKo: "정상 - 중립 상태",
    severity: "neutral",
  },
  "2": {
    level: 2,
    label: "Improved",
    labelKo: "약간 향상",
    color: "#90EE90",
    bgColor: "bg-green-400/30",
    textColor: "text-green-100",
    borderColor: "border-green-400/60",
    emoji: "🟢",
    description: "Improved - Positive trend",
    descriptionKo: "약간 향상 - 긍정적 추세",
    severity: "good",
  },
  "4": {
    level: 4,
    label: "Good",
    labelKo: "향상",
    color: "#00AA00",
    bgColor: "bg-green-600/30",
    textColor: "text-green-100",
    borderColor: "border-green-500/60",
    emoji: "✅",
    description: "Good - Positive status",
    descriptionKo: "향상 - 긍정적 상태",
    severity: "good",
  },
  "6": {
    level: 6,
    label: "Excellent",
    labelKo: "우수",
    color: "#87CEEB",
    bgColor: "bg-sky-400/30",
    textColor: "text-sky-100",
    borderColor: "border-sky-400/60",
    emoji: "🔵",
    description: "Excellent - Very good status",
    descriptionKo: "우수 - 매우 좋은 상태",
    severity: "excellent",
  },
  "8": {
    level: 8,
    label: "Very Excellent",
    labelKo: "매우 우수",
    color: "#0000FF",
    bgColor: "bg-blue-600/30",
    textColor: "text-blue-100",
    borderColor: "border-blue-500/60",
    emoji: "💙",
    description: "Very excellent - Outstanding status",
    descriptionKo: "매우 우수 - 뛰어난 상태",
    severity: "excellent",
  },
  "10": {
    level: 10,
    label: "Optimal",
    labelKo: "최고",
    color: "#9370DB",
    bgColor: "bg-purple-600/30",
    textColor: "text-purple-100",
    borderColor: "border-purple-500/60",
    emoji: "👑",
    description: "Optimal - Peak condition",
    descriptionKo: "최고 - 최상의 상태",
    severity: "optimal",
  },
};

/**
 * HanJin 레벨 배열 (정렬된)
 */
export const HANJIN_LEVELS: HanJinLevel[] = [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10];

/**
 * 숫자 값을 HanJin 레벨로 변환
 * @param value 0-100 범위의 값
 * @returns HanJin 레벨 (-10 ~ +10)
 */
export function valueToHanJinLevel(value: number): HanJinLevel {
  // 값을 0-100 범위로 정규화
  const normalized = Math.max(0, Math.min(100, value));

  if (normalized < 10) return -10;
  if (normalized < 20) return -8;
  if (normalized < 30) return -6;
  if (normalized < 40) return -4;
  if (normalized < 45) return -2;
  if (normalized < 55) return 0;
  if (normalized < 60) return 2;
  if (normalized < 70) return 4;
  if (normalized < 80) return 6;
  if (normalized < 90) return 8;
  return 10;
}

/**
 * HanJin 레벨을 점수로 변환 (0-100)
 * @param level HanJin 레벨
 * @returns 0-100 범위의 점수
 */
export function hanJinLevelToScore(level: HanJinLevel): number {
  const scores: Record<HanJinLevel, number> = {
    "-10": 0,
    "-8": 10,
    "-6": 20,
    "-4": 30,
    "-2": 40,
    "0": 50,
    "2": 60,
    "4": 70,
    "6": 80,
    "8": 90,
    "10": 100,
  };
  return scores[level];
}

/**
 * HanJin 레벨 설정 가져오기
 * @param level HanJin 레벨
 * @returns HanJin 레벨 설정
 */
export function getHanJinLevelConfig(level: HanJinLevel): HanJinLevelConfig {
  return HANJIN_LEVEL_SPECTRUM[level];
}

/**
 * HanJin 레벨 색상 가져오기
 * @param level HanJin 레벨
 * @returns 색상 코드 (HEX)
 */
export function getHanJinLevelColor(level: HanJinLevel): string {
  return HANJIN_LEVEL_SPECTRUM[level].color;
}

/**
 * HanJin 레벨 배경색 클래스 가져오기
 * @param level HanJin 레벨
 * @returns Tailwind CSS 클래스
 */
export function getHanJinLevelBgClass(level: HanJinLevel): string {
  return HANJIN_LEVEL_SPECTRUM[level].bgColor;
}

/**
 * HanJin 레벨 텍스트색 클래스 가져오기
 * @param level HanJin 레벨
 * @returns Tailwind CSS 클래스
 */
export function getHanJinLevelTextClass(level: HanJinLevel): string {
  return HANJIN_LEVEL_SPECTRUM[level].textColor;
}

/**
 * HanJin 레벨 테두리색 클래스 가져오기
 * @param level HanJin 레벨
 * @returns Tailwind CSS 클래스
 */
export function getHanJinLevelBorderClass(level: HanJinLevel): string {
  return HANJIN_LEVEL_SPECTRUM[level].borderColor;
}

/**
 * HanJin 레벨 라벨 가져오기 (다국어)
 * @param level HanJin 레벨
 * @param language 언어 코드 (ko, en, ja, zh, es)
 * @returns 라벨 텍스트
 */
export function getHanJinLevelLabel(level: HanJinLevel, language: string = "ko"): string {
  const config = HANJIN_LEVEL_SPECTRUM[level];
  return language === "ko" ? config.labelKo : config.label;
}

/**
 * HanJin 레벨 설명 가져오기 (다국어)
 * @param level HanJin 레벨
 * @param language 언어 코드 (ko, en, ja, zh, es)
 * @returns 설명 텍스트
 */
export function getHanJinLevelDescription(level: HanJinLevel, language: string = "ko"): string {
  const config = HANJIN_LEVEL_SPECTRUM[level];
  return language === "ko" ? config.descriptionKo : config.description;
}

/**
 * HanJin 레벨 이모지 가져오기
 * @param level HanJin 레벨
 * @returns 이모지
 */
export function getHanJinLevelEmoji(level: HanJinLevel): string {
  return HANJIN_LEVEL_SPECTRUM[level].emoji;
}

/**
 * HanJin 레벨 심각도 가져오기
 * @param level HanJin 레벨
 * @returns 심각도 (critical, warning, caution, neutral, good, excellent, optimal)
 */
export function getHanJinLevelSeverity(level: HanJinLevel): string {
  return HANJIN_LEVEL_SPECTRUM[level].severity;
}

/**
 * 두 HanJin 레벨 사이의 변화 계산
 * @param from 이전 레벨
 * @param to 현재 레벨
 * @returns 변화 (양수: 향상, 음수: 악화, 0: 유지)
 */
export function calculateHanJinLevelChange(from: HanJinLevel, to: HanJinLevel): number {
  const fromIndex = HANJIN_LEVELS.indexOf(from);
  const toIndex = HANJIN_LEVELS.indexOf(to);
  return toIndex - fromIndex;
}

/**
 * HanJin 레벨 범위 검증
 * @param level 검증할 값
 * @returns 유효한 HanJin 레벨 또는 가장 가까운 레벨
 */
export function validateHanJinLevel(level: number): HanJinLevel {
  const validLevels = HANJIN_LEVELS;
  const closest = validLevels.reduce((prev, curr) => {
    return Math.abs(curr - level) < Math.abs(prev - level) ? curr : prev;
  });
  return closest;
}

/**
 * HanJin 레벨 범위 생성 (min ~ max)
 * @param min 최소 레벨
 * @param max 최대 레벨
 * @returns 범위 내의 HanJin 레벨 배열
 */
export function getHanJinLevelRange(min: HanJinLevel, max: HanJinLevel): HanJinLevel[] {
  const minIndex = HANJIN_LEVELS.indexOf(min);
  const maxIndex = HANJIN_LEVELS.indexOf(max);
  return HANJIN_LEVELS.slice(minIndex, maxIndex + 1) as HanJinLevel[];
}
