import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, X, Target, Zap, Gift } from "lucide-react";

interface Mission {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  reward: number;
  icon: React.ReactNode;
  category: "health" | "activity" | "wellness";
}

const SAMPLE_MISSIONS: Mission[] = [
  {
    id: "1",
    title: "일일 보행 목표",
    description: "하루 10,000보 달성",
    progress: 7250,
    target: 10000,
    reward: 100,
    icon: <Target className="w-5 h-5" />,
    category: "activity",
  },
  {
    id: "2",
    title: "수면 시간",
    description: "7시간 이상 숙면",
    progress: 6,
    target: 7,
    reward: 150,
    icon: <Zap className="w-5 h-5" />,
    category: "wellness",
  },
  {
    id: "3",
    title: "물 마시기",
    description: "하루 2L 이상",
    progress: 1.5,
    target: 2,
    reward: 50,
    icon: <Gift className="w-5 h-5" />,
    category: "health",
  },
];

export default function SlidingMissionDashboard() {
  const [isOpen, setIsOpen] = useState(false);

  const totalProgress = SAMPLE_MISSIONS.reduce((acc, m) => acc + m.progress, 0);
  const totalTarget = SAMPLE_MISSIONS.reduce((acc, m) => acc + m.target, 0);
  const progressPercentage = Math.round((totalProgress / totalTarget) * 100);

  return (
    <>
      {/* Trigger Button - Center Bottom */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-16 h-16 rounded-full bg-gradient-to-br from-[#d4af37] to-[#f4d03f] shadow-2xl flex items-center justify-center text-black hover:shadow-3xl transition-shadow"
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronUp className="w-6 h-6" />
        </motion.div>
      </motion.button>

      {/* Sliding Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-30"
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border-b border-[#d4af37]/30 max-h-[80vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-b from-[#1a1a1a] to-transparent px-6 py-6 border-b border-[#d4af37]/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-[#d4af37]">
                    오늘의 미션
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-[#d4af37]/10 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-[#d4af37]" />
                  </motion.button>
                </div>

                {/* Overall Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#d4af37]/70">
                      전체 진행률
                    </span>
                    <span className="text-lg font-bold text-[#d4af37]">
                      {progressPercentage}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#0a0a0a] rounded-full overflow-hidden border border-[#d4af37]/20">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f]"
                    />
                  </div>
                </div>
              </div>

              {/* Missions List */}
              <div className="px-6 py-6 space-y-4">
                {SAMPLE_MISSIONS.map((mission, idx) => {
                  const missionProgress = Math.round(
                    (mission.progress / mission.target) * 100
                  );

                  return (
                    <motion.div
                      key={mission.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 rounded-lg bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#d4af37]/20 hover:border-[#d4af37]/40 transition-colors"
                    >
                      {/* Mission Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 rounded-lg bg-[#d4af37]/10 text-[#d4af37] mt-0.5">
                            {mission.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">
                              {mission.title}
                            </h3>
                            <p className="text-sm text-[#d4af37]/60">
                              {mission.description}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-[#d4af37]">
                            +{mission.reward}
                          </div>
                          <div className="text-xs text-[#d4af37]/50">포인트</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#d4af37]/70">
                            {mission.progress.toFixed(1)} / {mission.target}
                          </span>
                          <span className="text-[#d4af37] font-semibold">
                            {missionProgress}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#0a0a0a] rounded-full overflow-hidden border border-[#d4af37]/20">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${missionProgress}%` }}
                            transition={{
                              duration: 0.8,
                              ease: "easeOut",
                              delay: idx * 0.1 + 0.2,
                            }}
                            className="h-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f]"
                          />
                        </div>
                      </div>

                      {/* Completion Badge */}
                      {missionProgress === 100 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="mt-3 inline-block px-3 py-1 rounded-full bg-[#d4af37]/20 text-[#d4af37] text-xs font-semibold"
                        >
                          ✓ 완료됨
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer CTA */}
              <div className="sticky bottom-0 px-6 py-6 bg-gradient-to-t from-[#0a0a0a] to-transparent border-t border-[#d4af37]/20">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-3 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-black font-semibold rounded-lg hover:shadow-lg transition-shadow"
                >
                  미션 상세 보기
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
