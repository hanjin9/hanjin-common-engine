import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Heart, MessageCircle, Trophy, Users, Award, Target, Plus } from "lucide-react";
import { toast } from "sonner";

const POST_TYPE_LABELS: Record<string, string> = {
  workout_cert: "🏋️ 운동 인증",
  achievement: "🏆 성취",
  tip: "💡 팁",
  question: "❓ 질문",
  general: "💬 일반",
};

export default function CommunityHub() {
  const [postType, setPostType] = useState<string>("general");
  const [postContent, setPostContent] = useState("");
  const [postOpen, setPostOpen] = useState(false);

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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-700">커뮤니티 허브</h1>
          <p className="text-muted-foreground text-sm mt-1">함께 성장하는 건강 커뮤니티</p>
        </div>
        <Dialog open={postOpen} onOpenChange={setPostOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="w-4 h-4 mr-2" /> 게시글 작성
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>게시글 작성</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Select value={postType} onValueChange={setPostType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => createPost.mutate({ postType: postType as "workout_cert" | "achievement" | "tip" | "question" | "general", content: postContent })}
                disabled={!postContent.trim() || createPost.isPending}
              >
                {createPost.isPending ? "작성 중..." : "게시하기"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="feed">
        <TabsList>
          <TabsTrigger value="feed">피드</TabsTrigger>
          <TabsTrigger value="challenges">챌린지</TabsTrigger>
          <TabsTrigger value="leaderboard">리더보드</TabsTrigger>
          <TabsTrigger value="badges">배지</TabsTrigger>
        </TabsList>

        {/* 피드 탭 */}
        <TabsContent value="feed" className="mt-4 space-y-4">
          {posts?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>게시글이 없습니다.</p>
            </div>
          )}
          {posts?.map((post) => (
            <Card key={post.id}>
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
                <div className="flex items-center gap-4 mt-3">
                  <button
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-red-500 transition-colors"
                    onClick={() => toggleLike.mutate({ targetType: "post", targetId: post.id })}
                  >
                    <Heart className="w-4 h-4" />
                    <span>{post.likeCount}</span>
                  </button>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.commentCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* 챌린지 탭 */}
        <TabsContent value="challenges" className="mt-4 space-y-4">
          {challenges?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>진행 중인 챌린지가 없습니다.</p>
            </div>
          )}
          {challenges?.map((challenge) => (
            <Card key={challenge.id}>
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
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" /> 최대 {challenge.maxTeamSize}명</span>
                  <span className="flex items-center gap-1"><Trophy className="w-4 h-4" /> {challenge.rewardPoints} 포인트</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(challenge.startDate).toLocaleDateString()} ~ {new Date(challenge.endDate).toLocaleDateString()}
                  </span>
                  {challenge.status === "active" && (
                    <Button
                      size="sm"
                      className="ml-auto bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => joinChallenge.mutate({ challengeId: challenge.id })}
                    >
                      참가하기
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* 리더보드 탭 */}
        <TabsContent value="leaderboard" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" /> 글로벌 랭킹 TOP 50
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard?.map((user, idx) => (
                  <div key={user.userId} className={`flex items-center gap-3 p-3 rounded-lg ${idx < 3 ? "bg-yellow-50" : "hover:bg-muted/30"}`}>
                    <span className={`text-lg font-bold w-8 text-center ${idx === 0 ? "text-yellow-500" : idx === 1 ? "text-gray-400" : idx === 2 ? "text-amber-600" : "text-muted-foreground"}`}>
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">사용자 #{user.userId}</p>
                      <p className="text-xs text-muted-foreground">{user.currentTier} · 연속 {user.streakDays}일</p>
                    </div>
                    <span className="font-bold text-emerald-600">{user.totalScore?.toLocaleString() ?? 0} pt</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 배지 탭 */}
        <TabsContent value="badges" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {badges?.map((badge) => {
              const earned = earnedBadgeIds.has(badge.id);
              return (
                <Card key={badge.id} className={`${earned ? "border-emerald-300 bg-emerald-50" : "opacity-50"}`}>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl mb-2">{badge.iconUrl ?? "🏅"}</div>
                    <p className="font-semibold text-sm">{badge.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <Award className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs">{badge.rewardPoints} pt</span>
                    </div>
                    {earned && <Badge className="mt-2 bg-emerald-600 text-white text-xs">획득!</Badge>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
