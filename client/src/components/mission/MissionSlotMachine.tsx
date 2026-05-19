import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Zap, Flame, ChevronDown } from "lucide-react";

// 미션 난이도별 색상 및 설정
const MISSION_CONFIG = {
  high: {
    label: "Gold",
    color: "#d4af37",
    bgColor: "from-[#d4af37]/20 to-[#f4d03f]/10",
    borderColor: "#d4af37",
    icon: Trophy,
    points: 500,
    missions: [
      "마라톤 5km 🏅",
      "고강도 운동 1시간 💪",
      "냉수 샤워 🚿",
      "디지털 디톡스 📵",
      "새벽 5시 기상 🌅",
      "설탕 완전 금지 🚫",
    ],
  },
  medium: {
    label: "Silver",
    color: "#c0c0c0",
    bgColor: "from-[#c0c0c0]/20 to-[#e8e8e8]/10",
    borderColor: "#c0c0c0",
    icon: Zap,
    points: 300,
    missions: [
      "조깅 30분 🏃",
      "요가 20분 🧘",
      "자전거 20분 🚴",
      "줄넘기 100회 🤸",
      "수영 30분 🏊",
      "등산 1시간 ⛰️",
    ],
  },
  low: {
    label: "Bronze",
    color: "#cd7f32",
    bgColor: "from-[#cd7f32]/20 to-[#d4a574]/10",
    borderColor: "#cd7f32",
    icon: Flame,
    points: 100,
    missions: [
      "걷기 15분 🚶",
      "물 8잔 마시기 💧",
      "스트레칭 5분 🧘",
      "심호흡 3분 🌬️",
      "과일 1개 먹기 🍎",
      "계단 3층 오르기 🪜",
    ],
  },
};

interface MissionSlotMachineProps {
  onMissionSelect?: (mission: string, difficulty: string) => void;
}

function LuxurySlotColumn({
  missions,
  speed,
  difficulty,
  onSelect,
}: {
  missions: string[];
  speed: number;
  difficulty: "high" | "medium" | "low";
  onSelect: (mission: string) => void;
}) {
  const [offset, setOffset] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const config = MISSION_CONFIG[difficulty];

  useEffect(() => {
    if (isPaused) return;
    intervalRef.current = setInterval(() => {
      setOffset((prev) => (prev + 1) % missions.length);
    }, speed);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [missions.length, speed, isPaused]);

  const getVisibleMissions = () => {
    const visible = [];
    for (let i = 0; i < 3; i++) {
      visible.push(missions[(offset + i) % missions.length]);
    }
    return visible;
  };

  const Icon = config.icon;

  return (
    <div className="flex-1">
      {/* 난이도 헤더 */}
      <div
        className="text-center mb-2 px-2 py-2 rounded-lg border-2 backdrop-blur-sm"
        style={{
          borderColor: config.borderColor,
          backgroundColor: `${config.color}15`,
        }}
      >
        <div className="flex items-center justify-center gap-1">
          <Icon className="w-4 h-4" style={{ color: config.color }} />
          <span
            className="text-xs font-bold tracking-wider"
            style={{ color: config.color }}
          >
            {config.label}
          </span>
          <span
            className="text-[10px] font-light"
            style={{ color: `${config.color}80` }}
          >
            +{config.points}P
          </span>
        </div>
      </div>

      {/* 슬롯 컨테이너 */}
      <div
        className="relative h-[140px] overflow-hidden rounded-lg border-2 backdrop-blur-sm"
        style={{
          borderColor: `${config.borderColor}50`,
          backgroundColor: "rgba(26, 26, 26, 0.6)",
        }}
      >
        {/* 상단 그라데이션 오버레이 */}
        <div
          className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b to-transparent z-20 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(26, 26, 26, 0.8), transparent)`,
          }}
        />

        {/* 하단 그라데이션 오버레이 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t to-transparent z-20 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to top, rgba(26, 26, 26, 0.8), transparent)`,
          }}
        />

        {/* 슬롯 미션 */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={offset}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="space-y-2 p-2"
          >
            {getVisibleMissions().map((mission, i) => (
              <motion.button
                key={`${offset}-${i}`}
                className={`w-full text-left p-2 rounded-lg transition-all border-2 ${
                  i === 1 ? "ring-2 scale-105" : "opacity-50 hover:opacity-75"
                }`}
                style={{
                  borderColor:
                    i === 1 ? config.borderColor : `${config.borderColor}30`,
                  backgroundColor:
                    i === 1
                      ? `${config.color}20`
                      : `${config.color}05`,
                  boxShadow:
                    i === 1
                      ? `0 0 20px ${config.color}40, inset 0 0 10px ${config.color}20`
                      : "none",
                } as any}
                onClick={() => {
                  setIsPaused(true);
                  onSelect(mission);
                }}
                whileTap={{ scale: 0.95 }}
              >
                <p
                  className="text-xs font-semibold leading-tight"
                  style={{ color: config.color }}
                >
                  {mission}
                </p>
              </motion.button>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 일시정지 상태 표시 */}
      {isPaused && (
        <Button
          size="sm"
          variant="ghost"
          className="w-full mt-1 text-[10px] h-6"
          style={{ color: config.color }}
          onClick={() => setIsPaused(false)}
        >
          ▶️ 계속 돌리기
        </Button>
      )}
    </div>
  );
}

export function MissionSlotMachine({
  onMissionSelect,
}: MissionSlotMachineProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedMission, setSelectedMission] = useState<{
    text: string;
    difficulty: string;
  } | null>(null);

  const handleSelect = (
    mission: string,
    difficulty: "high" | "medium" | "low"
  ) => {
    const config = MISSION_CONFIG[difficulty];
    setSelectedMission({ text: mission, difficulty: config.label });
    onMissionSelect?.(mission, config.label);
  };

  return (
    <Card className="border-2 border-[#d4af37]/50 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] overflow-hidden shadow-2xl">
      {/* 헤더 - 럭셔리 블랙 & 골드 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-[#1a1a1a] to-[#0a0a0a] border-b-2 border-[#d4af37]/30 hover:border-[#d4af37]/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#d4af37]/20 to-[#f4d03f]/10 flex items-center justify-center border-2 border-[#d4af37]/50">
            <span className="text-lg">🎰</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-[#f4d03f]">
              미션 룰렛 🎲
            </p>
            <p className="text-[10px] text-[#d4af37]/60">
              오늘의 미션을 선택하세요
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5" style={{ color: "#d4af37" }} />
        </motion.div>
      </button>

      {/* 슬롯머신 콘텐츠 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4 space-y-4">
              {/* 선택된 미션 표시 */}
              {selectedMission && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg border-2 border-[#d4af37]/50 bg-gradient-to-r from-[#d4af37]/10 to-[#f4d03f]/5 backdrop-blur-sm"
                >
                  <p className="text-[10px] text-[#d4af37]/60 uppercase tracking-widest font-light">
                    ✓ 선택된 미션
                  </p>
                  <p className="text-sm font-bold text-[#d4af37] mt-1">
                    {selectedMission.text}
                  </p>
                  <p className="text-[10px] text-[#d4af37]/70 mt-1">
                    난이도: {selectedMission.difficulty}
                  </p>
                </motion.div>
              )}

              {/* 3칸 슬롯머신 */}
              <div className="flex gap-3">
                <LuxurySlotColumn
                  missions={MISSION_CONFIG.low.missions}
                  speed={2500}
                  difficulty="low"
                  onSelect={(m) => handleSelect(m, "low")}
                />
                <LuxurySlotColumn
                  missions={MISSION_CONFIG.medium.missions}
                  speed={2000}
                  difficulty="medium"
                  onSelect={(m) => handleSelect(m, "medium")}
                />
                <LuxurySlotColumn
                  missions={MISSION_CONFIG.high.missions}
                  speed={1500}
                  difficulty="high"
                  onSelect={(m) => handleSelect(m, "high")}
                />
              </div>

              {/* 안내 텍스트 */}
              <p className="text-[10px] text-center text-[#d4af37]/60 font-light">
                원하는 미션을 터치하여 선택하세요 • 난이도별 포인트 지급
              </p>

              {/* 액션 버튼 */}
              <Button className="w-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-black hover:shadow-lg hover:shadow-[#d4af37]/50 font-bold h-10">
                🚀 선택한 미션 시작하기
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
export default MissionSlotMachine;
