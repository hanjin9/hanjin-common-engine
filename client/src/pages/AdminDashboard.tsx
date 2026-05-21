/**
 * AdminDashboard.tsx — 혼합형 관리자 대시보드
 * 메인: 핵심 요약 카드 + 최근 데이터 미리보기
 * 상세: 각 섹션 "자세히 보기" 클릭 → 전용 페이지 이동
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Users, Activity, AlertTriangle, Zap,
  CreditCard, DollarSign, Brain, TrendingUp,
  ArrowRight, RefreshCw, CheckCircle2, AlertCircle,
  ChevronRight, BarChart3, Moon, Shield, CalendarDays, Target
} from "lucide-react";
import { useLocation } from "wouter";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

// ─── 멤버십 10단계 색상 ───────────────────────────────────────────────────────
const TIER_COLORS: Record<string, string> = {
  bronze: "#cd7f32", silver: "#c0c0c0", gold: "#ffd700",
  emerald: "#50c878", green_emerald: "#2ecc71", sapphire: "#4f86f7",
  blue_sapphire: "#0f52ba", diamond: "#b9f2ff", blue_diamond: "#0047ab",
  platinum: "#e5e4e2", black_platinum: "#1a1a1a",
};
const TIER_LABELS: Record<string, string> = {
  bronze: "Bronze", silver: "Silver", gold: "Gold",
  emerald: "Emerald", green_emerald: "Green Emerald", sapphire: "Sapphire",
  blue_sapphire: "Blue Sapphire", diamond: "Diamond", blue_diamond: "Blue Diamond",
  platinum: "Platinum", black_platinum: "Black Platinum",
};

const MONTHLY_STATS = [
  { month: "1월", users: 400, revenue: 2400 },
  { month: "2월", users: 520, revenue: 2210 },
  { month: "3월", users: 680, revenue: 2290 },
  { month: "4월", users: 890, revenue: 2000 },
  { month: "5월", users: 1200, revenue: 2181 },
];

const ALL_PROJECTS = [
  { id: 1, name: "숨호흡", slug: "breathing-app", color: "#3b82f6", status: "active" },
  { id: 2, name: "GLWA 프랜차이즈", slug: "glwa-franchise", color: "#8b5cf6", status: "active" },
  { id: 3, name: "장부관리사", slug: "bread-coach", color: "#f59e0b", status: "active" },
  { id: 4, name: "스포츠회복사", slug: "sports-recovery", color: "#10b981", status: "active" },
  { id: 5, name: "로또", slug: "coin-lotto", color: "#06b6d4", status: "active" },
  { id: 6, name: "GLWA 커뮤니티", slug: "glwa-community", color: "#ec4899", status: "active" },
  { id: 7, name: "랜딩페이지", slug: "landing", color: "#6366f1", status: "planned" },
  { id: 8, name: "글로벌 앱", slug: "global-app", color: "#14b8a6", status: "planned" },
  { id: 9, name: "건강채널", slug: "health-channel", color: "#f97316", status: "planned" },
  { id: 10, name: "자산관리", slug: "asset-mgmt", color: "#84cc16", status: "planned" },
];

function KPISkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
      <CardContent><Skeleton className="h-8 w-20 mb-1" /><Skeleton className="h-3 w-32" /></CardContent>
    </Card>
  );
}

function SectionHeader({ title, desc, href, icon: Icon }: { title: string; desc: string; href: string; icon: React.ElementType }) {
  const [, setLocation] = useLocation();
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={() => { setLocation(href); toast.success(`${title} 페이지로 이동합니다`); }} className="text-xs gap-1">
        자세히 보기 <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [loadingState, setLoadingState] = useState<Record<string, boolean>>({});

  // ── API 호출 ──────────────────────────────────────────────────────────────
  const { data: dashStats, isLoading: statsLoading, refetch } = trpc.wellness.operator.getDashboardStats.useQuery(undefined);
  const { data: settlement, isLoading: settlementLoading } = trpc.payment.getSettlementSummary.useQuery({ period: "month" });
  const { data: recentPayments, isLoading: paymentsLoading } = trpc.payment.getPaymentList.useQuery({ period: "month", status: "all", page: 1, pageSize: 5 });
  const { data: recentSubs, isLoading: subsLoading } = trpc.payment.getSubscriptionList.useQuery({ period: "month", status: "all", page: 1, pageSize: 5 });
  const { data: aiStats, isLoading: aiLoading } = trpc.healthAi.getFeedbackStats.useQuery({ period: "week" });
  const { data: recentFeedbacks, isLoading: feedbackLoading } = trpc.healthAi.getRecentFeedbacks.useQuery({ limit: 5, period: "week" });
  const { data: memberships, isLoading: memberLoading } = trpc.wellness.membership.adminGetAllMemberships.useQuery({ limit: 1000, offset: 0 });
  const { data: alerts, isLoading: alertsLoading } = trpc.wellness.operator.getAlerts.useQuery({ resolved: false, limit: 5 });

  const resolveAlert = trpc.wellness.operator.resolveAlert.useMutation({ onSuccess: () => refetch() });

  const memberDistribution = useMemo(() => {
    if (!memberships) return [];
    const counts: Record<string, number> = {};
    for (const m of memberships) counts[m.tier] = (counts[m.tier] || 0) + 1;
    return Object.entries(TIER_LABELS)
      .map(([key, label]) => ({ name: label, value: counts[key] || 0, color: TIER_COLORS[key], key }))
      .filter(d => d.value > 0);
  }, [memberships]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <Shield className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">로그인이 필요합니다</p>
        </div>
      </div>
    );
  }

  const fmtKrw = (v: number) => v >= 10000 ? `₩${(v / 10000).toFixed(1)}만` : `₩${v.toLocaleString()}`;

  const handleNavigation = (path: string, label: string) => {
    setLoadingState(prev => ({ ...prev, [path]: true }));
    setTimeout(() => {
      setLocation(path);
      toast.success(`${label} 페이지로 이동합니다`);
      setLoadingState(prev => ({ ...prev, [path]: false }));
    }, 300);
  };

  return (
    <div className="flex-1 space-y-8 p-4 md:p-6 pb-16">

      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">관리자 대시보드</h1>
          <p className="text-sm text-muted-foreground">한진 공통 엔진 — {ALL_PROJECTS.length}개 프로젝트 통합 관제탑</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { refetch(); toast.success('대시보드를 새로고침했습니다'); }}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> 새로고침
        </Button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          섹션 1: KPI 핵심 지표 4개
      ══════════════════════════════════════════════════════════════════════ */}
      <section>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {statsLoading ? [...Array(4)].map((_, i) => <KPISkeleton key={i} />) : (
            <>
              <Card 
                className="border-blue-200 dark:border-blue-800 hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
                onClick={() => handleNavigation('/admin/monitoring', '모니터링')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">실시간 접속자</CardTitle>
                  <Zap className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
                    {(dashStats?.totalUsers ?? 0) > 0 ? 1 : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">현재 접속 중</p>
                </CardContent>
              </Card>
              <Card 
                className="hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
                onClick={() => handleNavigation('/admin/users', '사용자 관리')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">총 수련자</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(dashStats?.totalUsers ?? 0).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">전체 등록 사용자</p>
                </CardContent>
              </Card>
              <Card 
                className="hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
                onClick={() => handleNavigation('/admin/stats', '통계')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">평균 웰니스</CardTitle>
                  <Activity className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{dashStats?.averageWellness ?? 0}</div>
                  <p className="text-xs text-muted-foreground">수련자 평균 점수</p>
                </CardContent>
              </Card>
              <Card 
                className="hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
                onClick={() => handleNavigation('/admin/monitoring', '모니터링')}
              >
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
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          섹션 1-B: 이벤트 관리 + 미션 관리 (두 번째 줄)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* 이벤트 관리 카드 (왼쪽) */}
        <Card
          className="border-purple-200 dark:border-purple-800 hover:shadow-md transition-shadow cursor-pointer hover:scale-102"
          onClick={() => handleNavigation('/admin/events', '이벤트 관리')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-purple-500" />
              이벤트 관리
            </CardTitle>
            <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">캘린더 연동</span>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-2xl font-bold text-purple-600">0</div>
                <p className="text-xs text-muted-foreground">예약된 이벤트</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">0</div>
                <p className="text-xs text-muted-foreground">오늘 발송</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 text-xs bg-purple-600 hover:bg-purple-700 text-white py-1.5 px-3 rounded-md transition-colors active:scale-95"
                onClick={(e) => { e.stopPropagation(); handleNavigation('/admin/events?action=instant', '즉석 발송'); }}
              >
                ⚡ 즉석 발송
              </button>
              <button
                className="flex-1 text-xs border border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950 py-1.5 px-3 rounded-md transition-colors active:scale-95"
                onClick={(e) => { e.stopPropagation(); handleNavigation('/admin/events?action=schedule', '예약 등록'); }}
              >
                📅 예약 등록
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 미션 관리 카드 (오른쪽) */}
        <Card
          className="border-orange-200 dark:border-orange-800 hover:shadow-md transition-shadow cursor-pointer hover:scale-102"
          onClick={() => handleNavigation('/admin/missions', '미션 관리')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-500" />
              미션 관리
            </CardTitle>
            <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full">슬롯 선택</span>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-2xl font-bold text-orange-600">0</div>
                <p className="text-xs text-muted-foreground">활성 미션</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">0</div>
                <p className="text-xs text-muted-foreground">오늘 완료</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 text-xs bg-orange-600 hover:bg-orange-700 text-white py-1.5 px-3 rounded-md transition-colors active:scale-95"
                onClick={(e) => { e.stopPropagation(); handleNavigation('/admin/missions?action=send', '즉석 발송'); }}
              >
                🎯 즉석 발송
              </button>
              <button
                className="flex-1 text-xs border border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950 py-1.5 px-3 rounded-md transition-colors active:scale-95"
                onClick={(e) => { e.stopPropagation(); handleNavigation('/admin/missions?action=create', '미션 추가'); }}
              >
                ➕ 미션 추가
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* ══════════════════════════════════════════════════════════════════════
          섹션 2: 결제 / 정산 요약
      ══════════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader title="결제 / 정산" desc="이번 달 매출 · 입금 · 환불 · 구독 현황" href="/admin/payment" icon={DollarSign} />

        {/* 정산 요약 카드 4개 */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-4">
          {settlementLoading ? [...Array(4)].map((_, i) => <KPISkeleton key={i} />) : (
            <>
              <Card 
                className="bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 hover:shadow-md transition-all cursor-pointer hover:scale-102"
                onClick={() => handleNavigation('/admin/payment', '결제 상세')}
              >
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-xs text-emerald-700 dark:text-emerald-300">총 매출</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{fmtKrw(settlement?.totalRevenue ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">{settlement?.succeededCount ?? 0}건 결제</p>
                </CardContent>
              </Card>
              <Card 
                className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 hover:shadow-md transition-all cursor-pointer hover:scale-102"
                onClick={() => handleNavigation('/admin/payment', '결제 상세')}
              >
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-xs text-blue-700 dark:text-blue-300">순 매출</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{fmtKrw(settlement?.netRevenue ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">환불 차감 후</p>
                </CardContent>
              </Card>
              <Card 
                className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 hover:shadow-md transition-all cursor-pointer hover:scale-102"
                onClick={() => handleNavigation('/admin/payment', '결제 상세')}
              >
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-xs text-red-700 dark:text-red-300">환불액</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <p className="text-xl font-bold text-red-700 dark:text-red-300">{fmtKrw(settlement?.totalRefund ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">{settlement?.refundCount ?? 0}건 환불</p>
                </CardContent>
              </Card>
              <Card 
                className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 hover:shadow-md transition-all cursor-pointer hover:scale-102"
                onClick={() => handleNavigation('/admin/payment', '결제 상세')}
              >
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-xs text-purple-700 dark:text-purple-300">활성 구독</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{settlement?.activeSubscriptions ?? 0}명</p>
                  <p className="text-xs text-muted-foreground">현재 구독 중</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* 최근 입금 5건 */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm">최근 입금 내역</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {paymentsLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : !recentPayments?.items?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">결제 내역이 없습니다 (Stripe 클레임 후 테스트 가능)</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="text-left py-1.5 pr-3">이름</th>
                      <th className="text-left py-1.5 pr-3">프로젝트</th>
                      <th className="text-left py-1.5 pr-3">금액</th>
                      <th className="text-left py-1.5 pr-3">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments?.items?.slice(0, 5).map((p: any, i: number) => (
                      <tr key={i} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-2 pr-3 text-xs">{p.customerName || '미정'}</td>
                        <td className="py-2 pr-3 text-xs">{p.projectName || '미정'}</td>
                        <td className="py-2 pr-3 text-xs font-semibold">{fmtKrw(p.amount)}</td>
                        <td className="py-2 pr-3"><Badge variant="outline" className="text-xs">{p.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* ══════════════════════════════════════════════════════════════════════
          섹션 3: AI 피드백 / 건강 분석
      ══════════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader title="AI 피드백 / 건강 분석" desc="주간 피드백 · 사용자 인사이트 · 개선 제안" href="/admin/ai" icon={Brain} />
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {/* AI 통계 카드 */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="h-4 w-4 text-blue-500" />
                AI 분석 통계
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-muted-foreground">이주 피드백</span>
                <span className="font-semibold">{aiStats?.total ?? 0}건</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-muted-foreground">평균 응답시간</span>
                <span className="font-semibold text-green-600">{aiStats?.avgResponseMs ?? 0}ms</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-muted-foreground">긴급 알림</span>
                <span className="font-semibold text-orange-600">{aiStats?.criticalCount ?? 0}건</span>
              </div>
              <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => handleNavigation('/admin/ai', 'AI 분석')}>
                상세 분석 보기
              </Button>
            </CardContent>
          </Card>

          {/* 멤버십 분포 차트 */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">멤버십 분포</CardTitle>
            </CardHeader>
            <CardContent>
              {memberLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : memberDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={memberDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value">
                      {memberDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">멤버십 데이터 없음</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* ══════════════════════════════════════════════════════════════════════
          섹션 4: 프로젝트 관리
      ══════════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader title="프로젝트 관리" desc="6개 활성 프로젝트 · 4개 계획 중" href="/admin/projects" icon={BarChart3} />
        
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {ALL_PROJECTS.map(project => (
            <Card 
              key={project.id}
              className="hover:shadow-md transition-all cursor-pointer hover:scale-102"
              onClick={() => handleNavigation('/admin/projects', `${project.name} 관리`)}
              style={{ borderLeftColor: project.color, borderLeftWidth: '4px' }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{project.name}</CardTitle>
                  <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {project.status === 'active' ? '활성' : '계획'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-2">{project.slug}</p>
                <Button size="sm" variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); handleNavigation('/admin/projects', `${project.name} 설정`); }}>
                  설정 →
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* ══════════════════════════════════════════════════════════════════════
          섹션 5: 월별 통계
      ══════════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader title="월별 통계" desc="사용자 증가 · 매출 추이" href="/admin/stats" icon={TrendingUp} />
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={MONTHLY_STATS}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" name="사용자 수" />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" name="매출 (만원)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
