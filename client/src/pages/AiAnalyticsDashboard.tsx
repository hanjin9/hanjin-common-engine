/**
 * AiAnalyticsDashboard — AI 분석 현황 (최소 탭)
 *
 * 현재 실사용: GLWA 웰니스 앱 1개
 * 나머지 프로젝트는 단순 고객센터형 챗봇 수준
 * → 최소 테이블 뷰 + 통계 카드로 구성
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Brain, RefreshCw, Activity, Users, Zap, AlertCircle } from "lucide-react";

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

export default function AiAnalyticsDashboard() {
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("week");
  const [projectSlug, setProjectSlug] = useState<string>("all");

  const { data, isLoading, refetch } = trpc.healthAi.getFeedbackList.useQuery({
    period,
    projectSlug: projectSlug === "all" ? undefined : projectSlug,
    page: 1,
    pageSize: 100,
  });

  const { data: stats, isLoading: statsLoading } = trpc.healthAi.getFeedbackStats.useQuery({
    period,
  });

  const statCards = [
    {
      label: "총 AI 분석 건수",
      value: stats?.total ?? 0,
      icon: <Brain className="w-5 h-5 text-purple-500" />,
    },
    {
      label: "위험/경고 건수",
      value: stats?.criticalCount ?? 0,
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
    },
    {
      label: "분석 사용자 수",
      value: stats?.uniqueUsers ?? 0,
      icon: <Users className="w-5 h-5 text-blue-500" />,
    },
    {
      label: "평균 응답 시간",
      value: stats?.avgResponseMs ? `${Math.round(stats.avgResponseMs)}ms` : "-",
      icon: <Zap className="w-5 h-5 text-amber-500" />,
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">AI 분석 현황</h1>
          <p className="text-sm text-muted-foreground">
            GLWA 웰니스 앱 · 건강 데이터 AI 피드백 로그
          </p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

      {/* 필터 */}
      <div className="flex flex-wrap gap-2 mb-4">
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
            <SelectItem value="sports">스포츠 회복사</SelectItem>
            <SelectItem value="jangbu">장부관리사</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-1" /> 새로고침
        </Button>
      </div>

      {/* AI 피드백 로그 테이블 */}
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
                <TableRow key={i}>
                  {[...Array(7)].map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !data?.items?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                  <Brain className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>AI 분석 데이터가 없습니다.</p>
                  <p className="text-xs mt-1">GLWA 웰니스 앱에서 건강 데이터를 입력하면 여기에 표시됩니다.</p>
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((item: any, idx: number) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="font-mono text-xs">{item.userId}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{item.projectSlug || "glwa"}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{item.feedbackType || "건강 분석"}</TableCell>
                  <TableCell><LevelBadge level={item.level} /></TableCell>
                  <TableCell className="text-sm max-w-[240px] truncate text-muted-foreground">
                    {item.summary || item.content?.slice(0, 60) || "-"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data?.total && data.total > 100 && (
        <p className="text-xs text-muted-foreground mt-3 text-right">
          총 {data.total}건 중 최근 100건 표시
        </p>
      )}

      {/* 안내 카드 */}
      <Card className="mt-6 border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-start gap-3">
            <Activity className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground">
              <strong className="text-foreground">AI 분석 엔진 현황:</strong>{" "}
              GLWA 웰니스 앱에서 풀 LLM 피드백 엔진 운영 중.
              장부관리사·스포츠회복사는 고객센터형 심플 챗봇 수준으로 운영.
              숨 호흡 앱은 텍스트 + 간단 음성 안내 수준으로 예정.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
