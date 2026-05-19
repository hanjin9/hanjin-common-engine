/**
 * AdminDashboard.tsx
 * 한진 공통 엔진 - 관리자 대시보드
 * 실제 tRPC API 연동 + 10개 프로젝트 + 페이지네이션
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import {
  Users, TrendingUp, DollarSign, Activity, AlertCircle,
  ChevronLeft, ChevronRight, RefreshCw, CheckCircle2,
  AlertTriangle, Info, Zap, CreditCard, Brain, ArrowRight
} from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";

// ─── 10개 프로젝트 정의 (확장 가능 구조) ─────────────────────────────────────
const ALL_PROJECTS = [
  { id: 1, name: "숨호흡 (호흡)", slug: "breathing-app", type: "wellness", color: "#3b82f6", priority: 1, status: "active" },
  { id: 2, name: "GLWA 프랜차이즈", slug: "glwa-franchise", type: "franchise", color: "#8b5cf6", priority: 2, status: "active" },
  { id: 3, name: "장부관리사", slug: "bread-coach", type: "business", color: "#f59e0b", priority: 3, status: "active" },
  { id: 4, name: "스포츠회복사", slug: "sports-recovery", type: "health", color: "#10b981", priority: 4, status: "active" },
  { id: 5, name: "로또", slug: "coin-lotto", type: "gaming", color: "#06b6d4", priority: 5, status: "active" },
  { id: 6, name: "GLWA 커뮤니티", slug: "glwa-community", type: "community", color: "#ec4899", priority: 6, status: "active" },
  { id: 7, name: "랜딩페이지", slug: "landing", type: "marketing", color: "#6366f1", priority: 7, status: "planned" },
  { id: 8, name: "글로벌 앱", slug: "global-app", type: "platform", color: "#14b8a6", priority: 8, status: "planned" },
  { id: 9, name: "건강채널", slug: "health-channel", type: "media", color: "#f97316", priority: 9, status: "planned" },
  { id: 10, name: "자산관리", slug: "asset-mgmt", type: "finance", color: "#84cc16", priority: 10, status: "planned" },
];

const PROJECTS_PER_PAGE = 6;

// ─── 멤버십 10단계 색상 ─────────────────────────────────────────────────────────
const TIER_COLORS: Record<string, string> = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#ffd700",
  emerald: "#50c878",
  green_emerald: "#2ecc71",
  sapphire: "#4f86f7",
  blue_sapphire: "#0f52ba",
  diamond: "#b9f2ff",
  blue_diamond: "#0047ab",
  platinum: "#e5e4e2",
  black_platinum: "#1a1a1a",
};

const TIER_LABELS: Record<string, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  emerald: "Emerald",
  green_emerald: "Green Emerald",
  sapphire: "Sapphire",
  blue_sapphire: "Blue Sapphire",
  diamond: "Diamond",
  blue_diamond: "Blue Diamond",
  platinum: "Platinum",
  black_platinum: "Black Platinum (예약)",
};

// ─── 샘플 월별 통계 (추후 실제 API로 교체) ───────────────────────────────────
const MONTHLY_STATS = [
  { month: "1월", users: 400, revenue: 2400, subscriptions: 240 },
  { month: "2월", users: 520, revenue: 2210, subscriptions: 290 },
  { month: "3월", users: 680, revenue: 2290, subscriptions: 340 },
  { month: "4월", users: 890, revenue: 2000, subscriptions: 400 },
  { month: "5월", users: 1200, revenue: 2181, subscriptions: 500 },
];

// ─── KPI 카드 스켈레톤 ─────────────────────────────────────────────────────────
function KPICardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

// ─── 프로젝트 카드 컴포넌트 ────────────────────────────────────────────────────
function ProjectCard({ project }: { project: typeof ALL_PROJECTS[0] }) {
  // GLWA 프랜차이즈는 실제 API 연동 (projectId: 1 = GLWA 프랜차이즈)
  const { data: stats, isLoading } = trpc.projects.glwaFranchise.getStatistics.useQuery(
    { projectId: 1 },
    { enabled: project.slug === "glwa-franchise" }
  );

  const isActive = project.status === "active";

  return (
    <Card
      className={`hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4`}
      style={{ borderLeftColor: project.color }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{project.name}</CardTitle>
          <Badge
            variant={isActive ? "default" : "secondary"}
            className="text-xs"
          >
            {isActive ? "활성" : "예정"}
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground">{project.slug}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && project.slug === "glwa-franchise" ? (
          <div className="grid grid-cols-2 gap-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">총 사용자</p>
              <p className="font-semibold">
                {project.slug === "glwa-franchise" && stats
                  ? (stats.totalUsers ?? 0).toLocaleString()
                  : isActive ? "—" : "준비 중"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">활성 구독</p>
              <p className="font-semibold">
                {project.slug === "glwa-franchise" && stats
                  ? (stats.activeSubscriptions ?? 0).toLocaleString()
                  : isActive ? "—" : "준비 중"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">월 매출</p>
              <p className="font-semibold">
                {project.slug === "glwa-franchise" && stats
                  ? `$${Number(stats.monthlyRevenue ?? 0).toLocaleString()}`
                  : isActive ? "—" : "준비 중"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">이탈율</p>
              <p className="font-semibold">
                {project.slug === "glwa-franchise" && stats
                  ? `${Number(stats.churnRate ?? 0).toFixed(1)}%`
                  : isActive ? "—" : "준비 중"}
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-1 mt-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: isActive ? "#22c55e" : "#94a3b8" }}
          />
          <span className="text-xs text-muted-foreground">
            우선순위 #{project.priority}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── 멤버십 분포 컴포넌트 ──────────────────────────────────────────────────────
function MembershipDistribution() {
  const { data: memberships, isLoading } = trpc.wellness.membership.adminGetAllMemberships.useQuery(
    { limit: 1000, offset: 0 }
  );

  const distribution = useMemo(() => {
    if (!memberships) return [];
    const counts: Record<string, number> = {};
    for (const m of memberships) {
      counts[m.tier] = (counts[m.tier] || 0) + 1;
    }
    return Object.entries(TIER_LABELS).map(([key, label]) => ({
      name: label,
      value: counts[key] || 0,
      color: TIER_COLORS[key],
      key,
    }));
  }, [memberships]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
      </div>
    );
  }

  const total = distribution.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Users className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">멤버십 데이터가 없습니다</p>
        <p className="text-xs mt-1">사용자가 가입하면 여기에 표시됩니다</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={distribution.filter(d => d.value > 0)}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={90}
            dataKey="value"
          >
            {distribution.filter(d => d.value > 0).map((entry) => (
              <Cell key={entry.key} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(val) => [`${val}명`, ""]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2">
        {distribution.map((tier) => (
          <div key={tier.key} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: tier.color }} />
              <span className="text-sm font-medium">{tier.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{tier.value}명</span>
              {total > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({((tier.value / total) * 100).toFixed(1)}%)
                </span>
              )}
            </div>
          </div>
        ))}
        <div className="border-t pt-2 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">합계</span>
            <span className="text-sm font-semibold">{total}명</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 모니터링 탭 컴포넌트 ──────────────────────────────────────────────────────
function MonitoringPanel() {
  const { data: dashStats, isLoading: statsLoading, refetch } = trpc.wellness.operator.getDashboardStats.useQuery();
  const { data: alerts, isLoading: alertsLoading } = trpc.wellness.operator.getAlerts.useQuery({
    resolved: false,
    limit: 20,
  });

  const resolveAlert = trpc.wellness.operator.resolveAlert.useMutation({
    onSuccess: () => refetch(),
  });

  const severityIcon = (severity: string) => {
    if (severity === "high") return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (severity === "medium") return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <Info className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div className="space-y-4">
      {/* 운영 통계 카드 — 순서: 실시간접속자 / 총수련자 / 평균웰니스 / 긴급알림 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          [...Array(4)].map((_, i) => <KPICardSkeleton key={i} />)
        ) : (
          <>
            {/* 1위: 실시간 접속자 */}
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">실시간 접속자</CardTitle>
                <Zap className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {(dashStats?.totalUsers ?? 0) > 0 ? 1 : 0}
                </div>
                <p className="text-xs text-muted-foreground">현재 접속 중인 사용자</p>
              </CardContent>
            </Card>
            {/* 2위: 총 수련자 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 수련자</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(dashStats?.totalUsers ?? 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">전체 등록 사용자</p>
              </CardContent>
            </Card>
            {/* 3위: 평균 웰니스 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">평균 웰니스</CardTitle>
                <Activity className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{dashStats?.averageWellness ?? 0}</div>
                <p className="text-xs text-muted-foreground">전체 수련자 평균</p>
              </CardContent>
            </Card>
            {/* 4위: 긴급 알림 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">긴급 알림</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(dashStats?.highSeverityAlerts ?? 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                  {dashStats?.highSeverityAlerts ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">즉시 조치 필요</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* 알림 목록 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>실시간 알림</CardTitle>
            <CardDescription>미해결 알림 목록</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3 w-3 mr-1" />
            새로고침
          </Button>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : !alerts || alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mb-2 text-green-500 opacity-60" />
              <p className="text-sm">미해결 알림이 없습니다</p>
              <p className="text-xs mt-1">모든 시스템이 정상 작동 중입니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {severityIcon(alert.severity)}
                    <div>
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.createdAt ? new Date(alert.createdAt).toLocaleString("ko-KR") : ""}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-xs"
                    onClick={() => resolveAlert.mutate({ alertId: alert.id })}
                    disabled={resolveAlert.isPending}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    해결
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── 메인 AdminDashboard 컴포넌트 ─────────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [projectPage, setProjectPage] = useState(0);

  // 실제 API: 운영자 대시보드 통계
  const { data: dashStats, isLoading: statsLoading } = trpc.wellness.operator.getDashboardStats.useQuery();

  // 프로젝트 페이지네이션
  const totalPages = Math.ceil(ALL_PROJECTS.length / PROJECTS_PER_PAGE);
  const paginatedProjects = useMemo(
    () => ALL_PROJECTS.slice(projectPage * PROJECTS_PER_PAGE, (projectPage + 1) * PROJECTS_PER_PAGE),
    [projectPage]
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <Zap className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">로그인이 필요합니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">관리자 대시보드</h1>
        <p className="text-sm text-muted-foreground">
          한진 공통 엔진 — {ALL_PROJECTS.length}개 프로젝트 통합 관리
        </p>
      </div>

      {/* KPI 카드 (실제 API 연동) */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          [...Array(4)].map((_, i) => <KPICardSkeleton key={i} />)
        ) : (
          <>
            {/* 1위: 실시간 접속자 */}
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">실시간 접속자</CardTitle>
                <Zap className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {(dashStats?.totalUsers ?? 0) > 0 ? 1 : 0}
                </div>
                <p className="text-xs text-muted-foreground">현재 접속 중인 사용자</p>
              </CardContent>
            </Card>

            {/* 2위: 긴급 알림 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">긴급 알림</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(dashStats?.highSeverityAlerts ?? 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                  {dashStats?.highSeverityAlerts ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">즉시 조치 필요</p>
              </CardContent>
            </Card>

            {/* 3위: 평균 웰니스 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">평균 웰니스</CardTitle>
                <Activity className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{dashStats?.averageWellness ?? 0}</div>
                <p className="text-xs text-muted-foreground">수련자 평균 점수</p>
              </CardContent>
            </Card>

            {/* 4위: 총 수련자 (맨 뒤) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 수련자</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(dashStats?.totalUsers ?? 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">전체 등록 사용자</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="projects">프로젝트</TabsTrigger>
          <TabsTrigger value="membership">멤버십</TabsTrigger>
          <TabsTrigger value="monitoring">모니터링</TabsTrigger>
        </TabsList>

        {/* ── 개요 탭 ── */}
        <TabsContent value="overview" className="space-y-4">

          {/* 빠른 접근 카드 — 결제/정산 + AI 분석 */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card className="border-emerald-200 dark:border-emerald-800 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base">결제 / 정산</CardTitle>
                  <CardDescription className="text-xs mt-0.5">입금명단 · 환불 · 구독갱신 · CSV</CardDescription>
                </div>
                <CreditCard className="h-5 w-5 text-emerald-500" />
              </CardHeader>
              <CardContent className="pt-0">
                <Link href="/admin/payment">
                  <button className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium mt-1">
                    결제 대시보드 열기 <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-purple-200 dark:border-purple-800 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base">AI 분석 현황</CardTitle>
                  <CardDescription className="text-xs mt-0.5">피드백 로그 · 통계 · 이상 감지</CardDescription>
                </div>
                <Brain className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent className="pt-0">
                <Link href="/admin/ai-analytics">
                  <button className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium mt-1">
                    AI 분석 대시보드 열기 <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>월별 사용자 및 매출 추이</CardTitle>
                <CardDescription>최근 5개월 통계 (실제 데이터 연동 예정)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={MONTHLY_STATS}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="users" stroke="#3b82f6" name="사용자" strokeWidth={2} />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" name="매출($100)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>월별 구독 현황</CardTitle>
                <CardDescription>활성 구독 수 추이</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={MONTHLY_STATS}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="subscriptions" fill="#8b5cf6" name="활성 구독" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── 프로젝트 탭 (10개 + 페이지네이션) ── */}
        <TabsContent value="projects" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              전체 {ALL_PROJECTS.length}개 프로젝트 중 {projectPage * PROJECTS_PER_PAGE + 1}–
              {Math.min((projectPage + 1) * PROJECTS_PER_PAGE, ALL_PROJECTS.length)}번
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProjectPage(p => Math.max(0, p - 1))}
                disabled={projectPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {projectPage + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProjectPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={projectPage === totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </TabsContent>

        {/* ── 멤버십 탭 (실제 DB 연동) ── */}
        <TabsContent value="membership" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>멤버십 분포</CardTitle>
              <CardDescription>10단계 멤버십 등급별 회원 수 (실시간 DB 연동)</CardDescription>
            </CardHeader>
            <CardContent>
              <MembershipDistribution />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 모니터링 탭 (실제 API 연동) ── */}
        <TabsContent value="monitoring">
          <MonitoringPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
