/**
 * GLWA 평생 수련 10단계 승급 및 권한 부여 마스터플랜
 * 10-Tier Lifetime Training System with Authority & Rewards
 * Shared between client and server
 */

export interface TenTierLevel {
  id: number;
  nameKo: string;
  nameEn: string;
  coreSubject: string;
  boneStructure: string;
  status: string;
  daysRequired: number;
  daysMax: number;
  badge: string;
  color: string;
  features: string[];
  permissions: string[];
  rewards: {
    points: number;
    badge: string;
    unlocks: string[];
  };
}

/**
 * 10단계 체계 - 최종 고정
 */
export const TEN_TIER_SYSTEM: TenTierLevel[] = [
  {
    id: 1,
    nameKo: "1단계 - 숨 알아차림",
    nameEn: "Level 1 - Breath Awareness",
    coreSubject: "숨 알아차림",
    boneStructure: "뼈대 01",
    status: "최종 고정",
    daysRequired: 0,
    daysMax: 9,
    badge: "🌬️",
    color: "#87CEEB",
    features: [
      "기초 호흡 가이드",
      "숨 추적 센서",
      "일일 호흡 미션",
    ],
    permissions: [
      "기초 콘텐츠 접근",
      "커뮤니티 열람",
    ],
    rewards: {
      points: 100,
      badge: "숨의 시작",
      unlocks: ["호흡 분석 도구"],
    },
  },
  {
    id: 2,
    nameKo: "2단계 - 쉼 (몸 알아차림)",
    nameEn: "Level 2 - Rest (Body Awareness)",
    coreSubject: "쉼 (몸 알아차림)",
    boneStructure: "뼈대 02",
    status: "최종 고정",
    daysRequired: 10,
    daysMax: 29,
    badge: "🧘",
    color: "#90EE90",
    features: [
      "신체 감각 개발",
      "휴식 프로토콜",
      "신체 스캔 명상",
    ],
    permissions: [
      "고급 호흡 콘텐츠",
      "신체 매핑 도구",
    ],
    rewards: {
      points: 200,
      badge: "몸의 목소리",
      unlocks: ["신체 진단 AI"],
    },
  },
  {
    id: 3,
    nameKo: "3단계 - 좋은 잠 (마인드셋)",
    nameEn: "Level 3 - Good Sleep (Mindset)",
    coreSubject: "좋은 잠 (마인드셋)",
    boneStructure: "뼈대 03",
    status: "정밀 수정 완료",
    daysRequired: 30,
    daysMax: 59,
    badge: "😴",
    color: "#DDA0DD",
    features: [
      "수면 질 추적",
      "수면 유도 명상",
      "마인드셋 개발",
    ],
    permissions: [
      "수면 분석 도구",
      "개인 코칭 신청",
    ],
    rewards: {
      points: 300,
      badge: "숙면의 마법사",
      unlocks: ["AI 수면 코칭"],
    },
  },
  {
    id: 4,
    nameKo: "4단계 - 스트레칭, 절, 요가",
    nameEn: "Level 4 - Stretching, Bowing, Yoga",
    coreSubject: "스트레칭, 절, 요가",
    boneStructure: "뼈대 04",
    status: "최종 고정",
    daysRequired: 60,
    daysMax: 99,
    badge: "🤸",
    color: "#FFB6C1",
    features: [
      "요가 클래스",
      "스트레칭 가이드",
      "유연성 추적",
    ],
    permissions: [
      "라이브 클래스 참여",
      "개인 세션 예약",
    ],
    rewards: {
      points: 400,
      badge: "유연함의 경지",
      unlocks: ["맞춤 요가 프로그램"],
    },
  },
  {
    id: 5,
    nameKo: "5단계 - 명상 (선, 나눔, 감사, 균형, 절제)",
    nameEn: "Level 5 - Meditation (Zen, Sharing, Gratitude, Balance, Moderation)",
    coreSubject: "명상 (선, 나눔, 감사, 균형, 절제)",
    boneStructure: "뼈대 05",
    status: "최종 고정",
    daysRequired: 100,
    daysMax: 149,
    badge: "🧘‍♀️",
    color: "#FFD700",
    features: [
      "고급 명상 프로그램",
      "감사 저널",
      "균형 추적",
    ],
    permissions: [
      "명상 마스터 클래스",
      "커뮤니티 리더십",
    ],
    rewards: {
      points: 500,
      badge: "명상의 경지",
      unlocks: ["심화 명상 코스"],
    },
  },
  {
    id: 6,
    nameKo: "6단계 - 중력 (바른 자세/걸음)",
    nameEn: "Level 6 - Gravity (Proper Posture/Walking)",
    coreSubject: "중력 (바른 자세/걸음)",
    boneStructure: "뼈대 06",
    status: "최종 고정",
    daysRequired: 150,
    daysMax: 199,
    badge: "🚶",
    color: "#20B2AA",
    features: [
      "자세 분석 AI",
      "보행 추적",
      "중력 정렬 가이드",
    ],
    permissions: [
      "자세 교정 세션",
      "1:1 코칭",
    ],
    rewards: {
      points: 600,
      badge: "자세의 대가",
      unlocks: ["고급 자세 분석"],
    },
  },
  {
    id: 7,
    nameKo: "7단계 - 운동 (맞춤 스포츠)",
    nameEn: "Level 7 - Exercise (Customized Sports)",
    coreSubject: "운동 (맞춤 스포츠)",
    boneStructure: "뼈대 07",
    status: "최종 고정",
    daysRequired: 200,
    daysMax: 299,
    badge: "⚽",
    color: "#FF6347",
    features: [
      "스포츠 추천 AI",
      "운동 성과 추적",
      "맞춤 운동 프로그램",
    ],
    permissions: [
      "프리미엄 스포츠 클래스",
      "리조트 운동 시설 예약",
    ],
    rewards: {
      points: 700,
      badge: "운동의 정수",
      unlocks: ["AI 운동 코칭"],
    },
  },
  {
    id: 8,
    nameKo: "8단계 - 교제, 교류/여가, 호르몬 케어",
    nameEn: "Level 8 - Socializing, Exchange/Leisure, Hormone Care",
    coreSubject: "교제, 교류/여가, 호르몬 케어",
    boneStructure: "뼈대 08",
    status: "최종 고정",
    daysRequired: 300,
    daysMax: 499,
    badge: "👥",
    color: "#9370DB",
    features: [
      "커뮤니티 이벤트",
      "호르몬 추적",
      "여가 계획 AI",
    ],
    permissions: [
      "VIP 라운지 접근",
      "글로벌 네트워크",
      "호르몬 분석 도구",
    ],
    rewards: {
      points: 800,
      badge: "사교의 대사",
      unlocks: ["호르몬 케어 프로그램"],
    },
  },
  {
    id: 9,
    nameKo: "9단계 - 영양/식치 (염증 관리)",
    nameEn: "Level 9 - Nutrition/Dietary Therapy (Inflammation Management)",
    coreSubject: "영양/식치 (염증 관리)",
    boneStructure: "뼈대 09",
    status: "최종 고정",
    daysRequired: 500,
    daysMax: 999,
    badge: "🥗",
    color: "#32CD32",
    features: [
      "영양 분석 AI",
      "식치 프로그램",
      "염증 추적",
    ],
    permissions: [
      "영양사 상담",
      "맞춤 식단 계획",
      "건강 검진 예약",
    ],
    rewards: {
      points: 900,
      badge: "영양의 전문가",
      unlocks: ["AI 영양 코칭"],
    },
  },
  {
    id: 10,
    nameKo: "10단계 - 깊고 고운 숨과 쉼",
    nameEn: "Level 10 - Deep, Refined Breath and Rest",
    coreSubject: "깊고 고운 숨과 쉼",
    boneStructure: "뼈대 10",
    status: "최종 고정",
    daysRequired: 1000,
    daysMax: Infinity,
    badge: "👑",
    color: "#FFD700",
    features: [
      "마스터 프로그램",
      "전체 통합 분석",
      "개인 맞춤 AI",
    ],
    permissions: [
      "무한 권한 보유",
      "제국의 황제 지위",
      "모든 시설 무제한 접근",
      "1:1 전담 코칭",
    ],
    rewards: {
      points: 1000,
      badge: "평생 수련의 완성",
      unlocks: ["모든 프리미엄 기능"],
    },
  },
];

/**
 * 사용자 10단계 진행 상태 조회
 */
export function getUserTierLevel(daysCompleted: number): TenTierLevel {
  return TEN_TIER_SYSTEM.find(
    (tier) => daysCompleted >= tier.daysRequired && daysCompleted <= tier.daysMax
  ) || TEN_TIER_SYSTEM[0];
}

/**
 * 다음 단계까지 남은 일수
 */
export function getDaysUntilNextTier(daysCompleted: number): number {
  const currentTier = getUserTierLevel(daysCompleted);
  if (currentTier.id === 10) return 0;
  const nextTier = TEN_TIER_SYSTEM[currentTier.id];
  return Math.max(0, nextTier.daysRequired - daysCompleted);
}

/**
 * 현재 단계의 진행률 (%)
 */
export function getTierProgress(daysCompleted: number): number {
  const currentTier = getUserTierLevel(daysCompleted);
  if (currentTier.id === 10) return 100;
  
  const tierRange = currentTier.daysMax - currentTier.daysRequired;
  const daysInTier = daysCompleted - currentTier.daysRequired;
  return Math.round((daysInTier / tierRange) * 100);
}

/**
 * 단계 업그레이드 확인
 */
export function checkTierUpgrade(previousDays: number, currentDays: number): TenTierLevel | null {
  const previousTier = getUserTierLevel(previousDays);
  const currentTier = getUserTierLevel(currentDays);
  
  return previousTier.id !== currentTier.id ? currentTier : null;
}
