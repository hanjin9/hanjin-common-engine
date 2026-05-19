/**
 * AiAnalyticsDashboard — AI 분석 + % 랭킹 통합 대시보드 (4탭)
 * 탭1: AI 피드백 현황 | 탭2: % 랭킹 분포 | 탭3: TOP 사용자 | 탭4: 내 랭킹
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Brain, RefreshCw, Activity, Users, Zap, AlertCircle,
  TrendingUp, Trophy, Star, Crown
} from "lucide-react";

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "-";
  return new Date(d).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LevelBadge({ level }: { level: string | null | undefined }) {
  if (!level) return <Badge variant="outline">-</Badge>;
  const colorMap: Record<string, string> = {
    critical: "bg-red-500/20 text-red-600 border-red-500/30",
    warning: "bg-amber-500/20 text-amber-600 border-amber-500/30",
    normal: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
    excellent: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorMap[level] ?? "bg-muted text-muted-foreground"}`}>
      {level}
    </span>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const map: Record<string, { label: string; color: string }> = {
    top_1:    { label: "상위 1%",  color: "text-amber-400 border-amber-500/50 bg-amber-500/10" },
    top_5:    { label: "상위 5%",  color: "text-blue-400 border-blue-500/50 bg-blue-500/10" },
    top_10:   { label: "상위 10%", color: "text-emerald-400 border-emerald-500/50 bg-emerald-500/10" },
    top_20:   { label: "상위 20%", color: "text-purple-400 border-purple-500/50 bg-purple-500/10" },
    bottom_20:{ label: "성장 중",  color: "text-red-400 border-red-500/50 bg-red-500/10" },
    normal:   { label: "일반",     color: "text-slate-400 border-slate-500/50 bg-slate-500/10" },
  };
  const info = map[tier] ?? map.normal;
  return <Badge variant="outline" className={`text-xs ${info.color}`}>{info.label}</Badge>;
}

// ─── 탭1: AI 피드백 현황 ──────────────────────────────────────────────────────
function FeedbackTab() {
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("week");
  const [projectSlug, setProjectSlug] = useState<string>("all");

  const { data, isLoading, refetch } = trpc.healthAi.getFeedbackList.useQuery({
    period,
    projectSlug: projectSlug === "all" ? undefined : projectSlug,
    page: 1,
    pageSize: 100,
  });
  const { data: stats, isLoading: statsLoading } = trpc.healthAi.getFeedbackStats.useQuery({ period });

  const statCards = [
    { label: "총 AI 분석 건수", value: stats?.total ?? 0, icon: <Brain className="w-5 h-5 text-purple-500" /> },
    { label: "위험/경고 건수",  value: stats?.criticalCount ?? 0, icon: <AlertCircle className="w-5 h-5 text-red-500" /> },
    { label: "분석 사용자 수",  value: stats?.uniqueUsers ?? 0, icon: <Users className="w-5 h-5 text-blue-500" /> },
    { label: "평균 응답 시간",  value: stats?.avgResponseMs ? `${Math.round(stats.avgResponseMs)}ms` : "-", icon: <Zap className="w-5 h-5 text-amber-500" /> },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsLoading
          ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          : statCards.map((c) => (
              <Card key={c.label} className="border-border/50 bg-card/80">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{c.label}</span>
                    {c.icon}
                  </div>
                  <div className="text-2xl font-bold">{c.value}</div>
                </CardContent>
              </Card>
            ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">오늘</SelectItem>
            <SelectItem value="week">최근 7일</SelectItem>
            <SelectItem value="month">최근 30일</SelectItem>
            <SelectItem value="all">전체</SelectItem>
          </SelectContent>
        </Select>
        <Select value={projectSlug} onValueChange={setProjectSlug}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 프로젝트</SelectItem>
            <SelectItem value="glwa">GLWA 웰니스</SelectItem>
            <SelectItem value="sports-recovery">스포츠 회복사</SelectItem>
            <SelectItem value="bread-coach">장부관리사</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-1" /> 새로고침
        </Button>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10">#</TableHead>
              <TableHead>사용자 ID</TableHead>
              <TableHead>프로젝트</TableHead>
              <TableHead>분석 유형</TableHead>
              <TableHead>레벨</TableHead>
              <TableHead>피드백 요약</TableHead>
              <TableHead>분석 일시</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <TableRow key={i}>{[...Array(7)].map((__, j) => (<TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>))}</TableRow>
              ))
            ) : !data?.items?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                  <Brain className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>AI 분석 데이터가 없습니다.</p>
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((item: any, idx: number) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="font-mono text-xs">{item.userId}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{item.projectSlug || "glwa"}</Badge></TableCell>
                  <TableCell className="text-xs">{item.feedbackType || "건강 분석"}</TableCell>
                  <TableCell><LevelBadge level={item.level} /></TableCell>
                  <TableCell className="text-sm max-w-[240px] truncate text-muted-foreground">{item.summary || item.content?.slice(0, 60) || "-"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── 탭2: % 랭킹 분포 ────────────────────────────────────────────────────────
function RankingDistributionTab() {
  const { data, isLoading } = trpc.ranking.getRankingStats.useQuery({});
  if (isLoading) return <div className="space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  if (!data || data.totalUsers === 0) return (
    <div className="text-center py-16 text-muted-foreground">
      <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p>랭킹 데이터가 없습니다.</p>
    </div>
  );
  const total = data.totalUsers;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="border-border/50 bg-card/80"><CardContent className="pt-4 pb-3"><div className="text-xs text-muted-foreground mb-1">총 사용자</div><div className="text-2xl font-bold">{total.toLocaleString()}</div></CardContent></Card>
        <Card className="border-border/50 bg-card/80"><CardContent className="pt-4 pb-3"><div className="text-xs text-muted-foreground mb-1">평균 피드백 수</div><div className="text-2xl font-bold">{data.avgFeedbackCount}</div></CardContent></Card>
        <Card className="border-border/50 bg-card/80"><CardContent className="pt-4 pb-3"><div className="text-xs text-muted-foreground mb-1">상위 1% 인원</div><div className="text-2xl font-bold text-amber-500">{data.top1pct}명</div></CardContent></Card>
      </div>
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-3"><CardTitle className="text-sm">% 구간별 사용자 분포</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {data.distribution.map((d) => {
            const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
            return (
              <div key={d.tier} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{d.label}</span>
                  <span className="text-muted-foreground">{d.count}명 ({pct}%)</span>
                </div>
                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                  <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── 탭3: TOP 사용자 리더보드 ────────────────────────────────────────────────
function LeaderboardTab() {
  const { data, isLoading } = trpc.ranking.getTopUsers.useQuery({ limit: 20 });
  if (isLoading) return <div className="space-y-2">{[...Array(10)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;
  if (!data?.length) return (
    <div className="text-center py-16 text-muted-foreground">
      <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p>리더보드 데이터가 없습니다.</p>
    </div>
  );
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12">순위</TableHead>
            <TableHead>사용자 ID</TableHead>
            <TableHead>피드백 수</TableHead>
            <TableHead>티어</TableHead>
            <TableHead>백분위</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((user) => (
            <TableRow key={user.userId} className="hover:bg-muted/30">
              <TableCell>
                <div className="flex items-center gap-1">
                  {user.rank === 1 && <Crown className="w-4 h-4 text-amber-400" />}
                  {user.rank === 2 && <Star className="w-4 h-4 text-slate-400" />}
                  {user.rank === 3 && <Star className="w-4 h-4 text-amber-600" />}
                  <span className={`font-bold text-sm ${user.rank <= 3 ? "text-amber-500" : "text-muted-foreground"}`}>{user.rank}</span>
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs">{user.userId}</TableCell>
              <TableCell className="font-semibold">{user.feedbackCount}</TableCell>
              <TableCell><TierBadge tier={user.tier} /></TableCell>
              <TableCell className="text-muted-foreground text-sm">상위 {user.percentile}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── 탭4: 내 랭킹 ────────────────────────────────────────────────────────────
function MyRankingTab() {
  const { user } = useAuth();
  const { data, isLoading } = trpc.ranking.getUserRankPercentile.useQuery(undefined, { enabled: !!user });
  if (!user) return (
    <div className="text-center py-16 text-muted-foreground">
      <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p>로그인 후 내 랭킹을 확인할 수 있습니다.</p>
    </div>
  );
  if (isLoading) return <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  if (!data) return null;
  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <Card className="border-border/50 bg-card/80">
        <CardContent className="pt-6 pb-6 text-center">
          <div className="text-6xl font-black mb-2">{data.rank}<span className="text-2xl text-muted-foreground">위</span></div>
          <div className="text-muted-foreground text-sm mb-4">전체 {data.totalUsers}명 중</div>
          <TierBadge tier={data.tier} />
          <div className="text-sm mt-2">{data.tierName}</div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/50 bg-card/80"><CardContent className="pt-4 pb-3 text-center"><div className="text-xs text-muted-foreground mb-1">상위 백분위</div><div className="text-2xl font-bold text-amber-500">{data.percentile}%</div></CardContent></Card>
        <Card className="border-border/50 bg-card/80"><CardContent className="pt-4 pb-3 text-center"><div className="text-xs text-muted-foreground mb-1">AI 피드백 수</div><div className="text-2xl font-bold text-blue-500">{data.feedbackCount}</div></CardContent></Card>
        <Card className="border-border/50 bg-card/80"><CardContent className="pt-4 pb-3 text-center"><div className="text-xs text-muted-foreground mb-1">미션 완료 수</div><div className="text-2xl font-bold text-emerald-500">{data.missionCount}</div></CardContent></Card>
        <Card className="border-border/50 bg-card/80"><CardContent className="pt-4 pb-3 text-center"><div className="text-xs text-muted-foreground mb-1">전체 사용자</div><div className="text-2xl font-bold">{data.totalUsers}</div></CardContent></Card>
      </div>
      <Card className="border-border/50 bg-card/80">
        <CardContent className="pt-4 pb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>상위 1%</span>
            <span>현재: 상위 {data.percentile}%</span>
            <span>하위 20%</span>
          </div>
          <Progress value={100 - data.percentile} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2 text-center">활동을 늘려 더 높은 티어로 올라가세요!</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export default function AiAnalyticsDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">AI 분석 &amp; 랭킹 대시보드</h1>
          <p className="text-sm text-muted-foreground">AI 피드백 현황 · % 랭킹 분포 · 리더보드 통합 관리</p>
        </div>
      </div>
      <Tabs defaultValue="feedback">
        <TabsList className="mb-4">
          <TabsTrigger value="feedback"><Activity className="w-4 h-4 mr-1.5" />피드백 현황</TabsTrigger>
          <TabsTrigger value="ranking"><TrendingUp className="w-4 h-4 mr-1.5" />% 랭킹 분포</TabsTrigger>
          <TabsTrigger value="leaderboard"><Trophy className="w-4 h-4 mr-1.5" />TOP 사용자</TabsTrigger>
          <TabsTrigger value="myrank"><Star className="w-4 h-4 mr-1.5" />내 랭킹</TabsTrigger>
        </TabsList>
        <TabsContent value="feedback"><FeedbackTab /></TabsContent>
        <TabsContent value="ranking"><RankingDistributionTab /></TabsContent>
        <TabsContent value="leaderboard"><LeaderboardTab /></TabsContent>
        <TabsContent value="myrank"><MyRankingTab /></TabsContent>
      </Tabs>
    </div>
  );
}
