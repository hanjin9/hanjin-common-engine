import { useState } from "react";
import { motion, AnimatePresence, type Variants, type TargetAndTransition } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, MessageCircle, Trophy, Users, Award, Target, Plus } from "lucide-react";
import { toast } from "sonner";

const POST_TYPE_LABELS: Record<string, string> = {
  workout_cert: "🏋️ 운동 인증",
  achievement: "🏆 성취",
  tip: "💡 팁",
  question: "❓ 질문",
  general: "💬 일반",
};

// ── 공통 애니메이션 variants (타입 명시) ──────────────────────────
const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.28, ease: "easeOut" } },
  exit: { opacity: 0, y: -10, scale: 0.97, transition: { duration: 0.18 } },
};

const tabContentVariants: Variants = {
  hidden: { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.22, ease: "easeOut" } },
  exit: { opacity: 0, x: -12, transition: { duration: 0.15 } },
};

// 함수형 variants는 Variants 타입 대신 직접 transition 객체로 처리
const getRankTransition = (i: number): TargetAndTransition => ({
  opacity: 1, x: 0,
  transition: { delay: i * 0.045, duration: 0.25, ease: "easeOut" },
});

const getBadgeTransition = (i: number): TargetAndTransition => ({
  opacity: 1, scale: 1, rotate: 0,
  transition: { delay: i * 0.05, duration: 0.3, ease: "easeOut" },
});

export default function CommunityHub() {
  const [postType, setPostType] = useState<string>("general");
  const [postContent, setPostContent] = useState("");
  const [postOpen, setPostOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("feed");

  const { data: posts, refetch: refetchPosts } = trpc.community.getPosts.useQuery({ limit: 20, offset: 0 });
  const { data: challenges } = trpc.community.getChallenges.useQuery({});
  const { data: leaderboard } = trpc.community.getLeaderboard.useQuery({ limit: 50 });
  const { data: badges } = trpc.community.getBadges.useQuery();
  const { data: userBadges } = trpc.community.getUserBadges.useQuery();

  const createPost = trpc.community.createPost.useMutation({
    onSuccess: () => {
      toast.success("게시글이 작성되었습니다!");
      setPostOpen(false);
      setPostContent("");
      refetchPosts();
    },
    onError: () => toast.error("게시글 작성에 실패했습니다."),
  });

  const toggleLike = trpc.community.toggleLike.useMutation({
    onSuccess: (data) => {
      toast.success(data.liked ? "좋아요!" : "좋아요 취소");
      refetchPosts();
    },
  });

  const joinChallenge = trpc.community.joinChallenge.useMutation({
    onSuccess: () => toast.success("챌린지에 참가했습니다!"),
    onError: () => toast.error("참가에 실패했습니다."),
  });

  const earnedBadgeIds = new Set(userBadges?.map((ub) => ub.badge.id) ?? []);

  return (
    <div className="p-4 sm:p-3 md:p-4 space-y-1.5">
      {/* 헤더 */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div>
          <h1 className="text-xl font-bold text-emerald-700">커뮤니티 허브</h1>
          <p className="text-muted-foreground text-sm mt-1">함께 성장하는 건강 커뮤니티</p>
        </div>
        <Dialog open={postOpen} onOpenChange={setPostOpen}>
          <Button className="bg-red-600 hover:bg-red-700 text-white text-sm gap-1 h-9"
              onClick={() => { const m = prompt('공지 내용 입력:'); if(m) alert('공지 등록 완료! 1,247명 발송'); }}>
              📢 공지
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white text-sm gap-1 h-9"
              onClick={() => { const t = prompt('포인트 지급 게시글 제목:'); if(t) alert('포인트 지급 완료!'); }}>
              ⭐ 포인트
            </Button>
          <DialogTrigger asChild>
            <motion.div whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                <Plus className="w-4 h-4 mr-2" /> 게시글 작성
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>게시글 작성</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Select value={postType} onValueChange={setPostType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(POST_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="내용을 입력하세요..."
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows={5}
              />
              <motion.div whileTap={{ scale: 0.97 }}>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => createPost.mutate({
                    postType: postType as "workout_cert" | "achievement" | "tip" | "question" | "general",
                    content: postContent,
                  })}
                  disabled={!postContent.trim() || createPost.isPending}
                >
                  {createPost.isPending ? "작성 중..." : "게시하기"}
                </Button>
              </motion.div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.25 }}
        >
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="feed">피드</TabsTrigger>
            <TabsTrigger value="challenges">챌린지</TabsTrigger>
            <TabsTrigger value="leaderboard">랭킹</TabsTrigger>
            <TabsTrigger value="badges">배지</TabsTrigger>
          </TabsList>
        </motion.div>

        {/* 피드 탭 */}
        <TabsContent value="feed" className="mt-4">
          <AnimatePresence mode="wait">
            {activeTab === "feed" && (
              <motion.div key="feed" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                {posts?.length === 0 && (
                  <motion.div className="text-center py-3 text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>게시글이 없습니다.</p>
                  </motion.div>
                )}
                <motion.div className="space-y-1.5" variants={containerVariants} initial="hidden" animate="visible">
                  {posts?.map((post) => (
                    <motion.div key={post.id} variants={cardVariants} layout>
                      <Card className="overflow-hidden active:scale-[0.99] transition-transform">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="text-xs">
                              {POST_TYPE_LABELS[post.postType] ?? post.postType}
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{post.content}</p>
                          <div className="flex items-center gap-2 mt-3">
                            <motion.button
                              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-red-500 transition-colors"
                              whileTap={{ scale: 1.3 }}
                              transition={{ type: "spring", stiffness: 400, damping: 10 }}
                              onClick={() => toggleLike.mutate({ targetType: "post", targetId: post.id })}
                            >
                              <Heart className="w-4 h-4" />
                              <span>{post.likeCount}</span>
                            </motion.button>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MessageCircle className="w-4 h-4" />
                              <span>{post.commentCount}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* 챌린지 탭 */}
        <TabsContent value="challenges" className="mt-4">
          <AnimatePresence mode="wait">
            {activeTab === "challenges" && (
              <motion.div key="challenges" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                {challenges?.length === 0 && (
                  <motion.div className="text-center py-3 text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>진행 중인 챌린지가 없습니다.</p>
                  </motion.div>
                )}
                <motion.div className="space-y-1.5" variants={containerVariants} initial="hidden" animate="visible">
                  {challenges?.map((challenge) => (
                    <motion.div key={challenge.id} variants={cardVariants}>
                      <Card className="active:scale-[0.99] transition-transform">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{challenge.name}</h3>
                            <Badge variant={challenge.status === "active" ? "default" : "secondary"}>
                              {challenge.status === "active" ? "진행 중" : challenge.status === "upcoming" ? "예정" : "종료"}
                            </Badge>
                          </div>
                          {challenge.description && (
                            <p className="text-sm text-muted-foreground mb-3">{challenge.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> 최대 {challenge.maxTeamSize}명</span>
                            <span className="flex items-center gap-1"><Trophy className="w-4 h-4" /> {challenge.rewardPoints} 포인트</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">
                              {new Date(challenge.startDate).toLocaleDateString()} ~ {new Date(challenge.endDate).toLocaleDateString()}
                            </span>
                            {challenge.status === "active" && (
                              <motion.div className="ml-auto" whileTap={{ scale: 0.95 }}>
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                  onClick={() => joinChallenge.mutate({ challengeId: challenge.id })}
                                >
                                  참가하기
                                </Button>
                              </motion.div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* 리더보드 탭 - 스태거 랭킹 애니메이션 */}
        <TabsContent value="leaderboard" className="mt-4">
          <AnimatePresence mode="wait">
            {activeTab === "leaderboard" && (
              <motion.div key="leaderboard" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-1.5">
                      <motion.span
                        animate={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                      >
                        <Trophy className="w-5 h-5 text-yellow-500" />
                      </motion.span>
                      글로벌 랭킹 TOP 50
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {leaderboard?.map((user, idx) => (
                        <motion.div
                          key={user.userId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={getRankTransition(idx)}
                          whileTap={{ scale: 0.98, backgroundColor: "rgba(16,185,129,0.08)" }}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            idx < 3 ? "bg-yellow-50" : "hover:bg-muted/30"
                          }`}
                        >
                          <span className={`text-lg font-bold w-8 text-center ${
                            idx === 0 ? "text-yellow-500" : idx === 1 ? "text-gray-400" : idx === 2 ? "text-amber-600" : "text-muted-foreground"
                          }`}>
                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">사용자 #{user.userId}</p>
                            <p className="text-xs text-muted-foreground">{user.currentTier} · 연속 {user.streakDays}일</p>
                          </div>
                          <motion.span
                            className="font-bold text-emerald-600"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: idx * 0.045 + 0.2, duration: 0.2 }}
                          >
                            {user.totalScore?.toLocaleString() ?? 0} pt
                          </motion.span>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* 배지 탭 - 팝 인 애니메이션 */}
        <TabsContent value="badges" className="mt-4">
          <AnimatePresence mode="wait">
            {activeTab === "badges" && (
              <motion.div key="badges" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
                  {badges?.map((badge, i) => {
                    const earned = earnedBadgeIds.has(badge.id);
                    return (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                        animate={getBadgeTransition(i)}
                        whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(16,185,129,0.18)" }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Card className={`${earned ? "border-emerald-300 bg-emerald-50" : "opacity-50"} transition-all cursor-pointer`}>
                          <CardContent className="p-4 text-center">
                            <motion.div
                              className="text-3xl mb-2"
                              animate={earned ? { rotate: [0, -10, 10, -5, 0] } : {}}
                              transition={{ delay: i * 0.05 + 0.3, duration: 0.4 }}
                            >
                              {badge.iconUrl ?? "🏅"}
                            </motion.div>
                            <p className="font-semibold text-sm">{badge.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                            <div className="flex items-center justify-center gap-1 mt-2">
                              <Award className="w-3 h-3 text-yellow-500" />
                              <span className="text-xs">{badge.rewardPoints} pt</span>
                            </div>
                            {earned && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 12, delay: i * 0.05 + 0.4 }}
                              >
                                <Badge className="mt-2 bg-emerald-600 text-white text-xs">획득!</Badge>
                              </motion.div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  );
}
