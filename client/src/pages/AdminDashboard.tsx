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
import { useMemo } from "react";
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
      <Button variant="ghost" size="sm" onClick={() => setLocation(href)} className="text-xs gap-1">
        자세히 보기 <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

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

  return (
    <div className="flex-1 space-y-8 p-4 md:p-6 pb-16">

      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">관리자 대시보드</h1>
          <p className="text-sm text-muted-foreground">한진 공통 엔진 — {ALL_PROJECTS.length}개 프로젝트 통합 관제탑</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
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
              <Card className="border-blue-200 dark:border-blue-800">
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
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          섹션 1-B: 이벤트 관리 + 미션 관리 (두 번째 줄)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* 이벤트 관리 카드 (왼쪽) */}
        <Card
          className="border-purple-200 dark:border-purple-800 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setLocation('/admin/events')}
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
                className="flex-1 text-xs bg-purple-600 hover:bg-purple-700 text-white py-1.5 px-3 rounded-md transition-colors"
                onClick={(e) => { e.stopPropagation(); setLocation('/admin/events?action=instant'); }}
              >
                ⚡ 즉석 발송
              </button>
              <button
                className="flex-1 text-xs border border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950 py-1.5 px-3 rounded-md transition-colors"
                onClick={(e) => { e.stopPropagation(); setLocation('/admin/events?action=schedule'); }}
              >
                📅 예약 등록
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 미션 관리 카드 (오른쪽) */}
        <Card
          className="border-orange-200 dark:border-orange-800 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setLocation('/admin/missions')}
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
                className="flex-1 text-xs bg-orange-600 hover:bg-orange-700 text-white py-1.5 px-3 rounded-md transition-colors"
                onClick={(e) => { e.stopPropagation(); setLocation('/admin/missions?action=send'); }}
              >
                🎯 즉석 발송
              </button>
              <button
                className="flex-1 text-xs border border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950 py-1.5 px-3 rounded-md transition-colors"
                onClick={(e) => { e.stopPropagation(); setLocation('/admin/missions?action=create'); }}
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
              <Card className="bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800">
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-xs text-emerald-700 dark:text-emerald-300">총 매출</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{fmtKrw(settlement?.totalRevenue ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">{settlement?.succeededCount ?? 0}건 결제</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-xs text-blue-700 dark:text-blue-300">순 매출</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{fmtKrw(settlement?.netRevenue ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">환불 차감 후</p>
                </CardContent>
              </Card>
              <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-xs text-red-700 dark:text-red-300">환불액</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <p className="text-xl font-bold text-red-700 dark:text-red-300">{fmtKrw(settlement?.totalRefund ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">{settlement?.refundCount ?? 0}건 환불</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
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
        <Card>
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
                      <th className="text-right py-1.5 pr-3">금액</th>
                      <th className="text-center py-1.5 pr-3">상태</th>
                      <th className="text-right py-1.5">일시</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.items.map((p: any) => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="py-2 pr-3 font-medium">{p.userName ?? p.userId}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{p.projectSlug}</td>
                        <td className="py-2 pr-3 text-right font-semibold">{fmtKrw(p.amountKrw ?? 0)}</td>
                        <td className="py-2 pr-3 text-center">
                          <Badge variant={p.status === "succeeded" ? "default" : p.status === "refunded" ? "destructive" : "secondary"} className="text-xs">
                            {p.status === "succeeded" ? "완료" : p.status === "refunded" ? "환불" : p.status}
                          </Badge>
                        </td>
                        <td className="py-2 text-right text-xs text-muted-foreground">
                          {new Date(p.createdAt).toLocaleDateString("ko-KR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 최근 구독 5건 */}
        <Card className="mt-3">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm">최근 구독 현황</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {subsLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : !recentSubs?.items?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">구독 내역이 없습니다</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="text-left py-1.5 pr-3">이름</th>
                      <th className="text-left py-1.5 pr-3">프로젝트</th>
                      <th className="text-left py-1.5 pr-3">등급</th>
                      <th className="text-center py-1.5 pr-3">상태</th>
                      <th className="text-right py-1.5">갱신일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSubs.items.map((s: any) => (
                      <tr key={s.id} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="py-2 pr-3 font-medium">{s.userName ?? s.userId}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{s.projectSlug}</td>
                        <td className="py-2 pr-3">{s.tierKey ?? "-"}</td>
                        <td className="py-2 pr-3 text-center">
                          <Badge variant={s.status === "active" ? "default" : "secondary"} className="text-xs">
                            {s.status === "active" ? "활성" : s.status === "canceled" ? "취소" : s.status}
                          </Badge>
                        </td>
                        <td className="py-2 text-right text-xs text-muted-foreground">
                          {s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString("ko-KR") : "-"}
                        </td>
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
          섹션 3: AI 건강 분석 / 피드백
      ══════════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader title="AI 건강 분석 / 피드백" desc="자동 AI 피드백 발송 현황 · 이상 감지 · 분석 통계" href="/admin/ai-analytics" icon={Brain} />

        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-4">
          {aiLoading ? [...Array(4)].map((_, i) => <KPISkeleton key={i} />) : (
            <>
              <Card>
                <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs text-muted-foreground">총 피드백</CardTitle></CardHeader>
                <CardContent className="px-4 pb-3">
                  <p className="text-xl font-bold">{aiStats?.total ?? 0}</p>
                  <p className="text-xs text-muted-foreground">누적 발송</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs text-muted-foreground">오늘 피드백</CardTitle></CardHeader>
                <CardContent className="px-4 pb-3">
                  <p className="text-xl font-bold text-blue-600">{aiStats?.uniqueUsers ?? 0}</p>
                  <p className="text-xs text-muted-foreground">분석 사용자</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs text-muted-foreground">이상 감지</CardTitle></CardHeader>
                <CardContent className="px-4 pb-3">
                  <p className={`text-xl font-bold ${(aiStats?.criticalCount ?? 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                    {aiStats?.criticalCount ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">긴급 피드백</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs text-muted-foreground">평균 점수</CardTitle></CardHeader>
                <CardContent className="px-4 pb-3">
                  <p className="text-xl font-bold text-green-600">{aiStats?.avgResponseMs ?? "-"}</p>
                  <p className="text-xs text-muted-foreground">평균 응답(ms)</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <Card>
          <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm">최근 AI 피드백 내역</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3">
            {feedbackLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : !recentFeedbacks?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">AI 피드백 데이터가 없습니다</p>
            ) : (
              <div className="space-y-2">
                {recentFeedbacks.map((f: any) => (
                  <div key={f.id} className="flex items-start justify-between py-2 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.userName ?? f.userId}</p>
                      <p className="text-xs text-muted-foreground truncate">{f.feedbackText ?? f.summary ?? "-"}</p>
                    </div>
                    <div className="ml-3 text-right shrink-0">
                      <Badge variant={f.level === "high" ? "destructive" : f.level === "medium" ? "secondary" : "outline"} className="text-xs mb-1">
                        {f.level === "high" ? "긴급" : f.level === "medium" ? "주의" : "정상"}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{new Date(f.createdAt).toLocaleDateString("ko-KR")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* ══════════════════════════════════════════════════════════════════════
          섹션 4: 멤버십 분포
      ══════════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader title="멤버십 관리" desc="10단계 VIP 등급별 회원 현황" href="/membership" icon={Shield} />
        <Card>
          <CardContent className="pt-4">
            {memberLoading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
            ) : memberDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">멤버십 데이터가 없습니다</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={memberDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" labelLine={false}>
                      {memberDistribution.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => [`${val}명`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5">
                  {memberDistribution.map((tier) => (
                    <div key={tier.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: tier.color }} />
                        <span className="text-sm">{tier.name}</span>
                      </div>
                      <span className="text-sm font-semibold">{tier.value}명</span>
                    </div>
                  ))}
                  <div className="border-t pt-1.5 flex justify-between">
                    <span className="text-sm font-semibold">합계</span>
                    <span className="text-sm font-semibold">{memberDistribution.reduce((s, d) => s + d.value, 0)}명</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* ══════════════════════════════════════════════════════════════════════
          섹션 5: 매출 추이 차트
      ══════════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader title="매출 / 사용자 추이" desc="최근 5개월 통계 (실제 데이터 연동 예정)" href="/admin/payment" icon={TrendingUp} />
        <Card>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={MONTHLY_STATS}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" name="사용자" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" name="매출($100)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* ══════════════════════════════════════════════════════════════════════
          섹션 6: 프로젝트 현황
      ══════════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader title="프로젝트 현황" desc="10개 프로젝트 활성 상태" href="/admin" icon={BarChart3} />
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {ALL_PROJECTS.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow cursor-pointer border-l-4" style={{ borderLeftColor: p.color }}>
              <CardContent className="pt-3 pb-3 px-3">
                <p className="text-sm font-semibold truncate">{p.name}</p>
                <Badge variant={p.status === "active" ? "default" : "secondary"} className="text-xs mt-1">
                  {p.status === "active" ? "활성" : "예정"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* ══════════════════════════════════════════════════════════════════════
          섹션 7: 긴급 알림 / 모니터링
      ══════════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader title="긴급 알림 / 모니터링" desc="미해결 알림 · 즉시 조치 필요 항목" href="/admin" icon={AlertTriangle} />
        <Card>
          <CardContent className="pt-4 pb-3">
            {alertsLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : !alerts?.length ? (
              <div className="flex items-center gap-2 py-4 justify-center text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-medium">미해결 알림 없음 — 정상 운영 중</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert: any) => (
                  <div key={alert.id} className="flex items-start justify-between p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {alert.severity === "high"
                        ? <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        : <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{alert.title ?? alert.message}</p>
                        <p className="text-xs text-muted-foreground">{new Date(alert.createdAt).toLocaleString("ko-KR")}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-2 shrink-0 text-xs h-7"
                      onClick={() => resolveAlert.mutate({ alertId: alert.id })}
                    >
                      해결
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
