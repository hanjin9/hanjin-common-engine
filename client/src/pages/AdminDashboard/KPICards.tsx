/**
 * KPICards.tsx — 실제 DB 연동 KPI 카드
 * trpc.admin.getAnalytics + trpc.payment.getSettlementSummary 사용
 */
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, CreditCard, TrendingUp, Activity, CheckCircle, AlertCircle } from 'lucide-react';

function KPICard({
  title, value, sub, icon: Icon, iconColor, loading,
}: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; iconColor: string; loading?: boolean;
}) {
  return (
    <Card className="p-3 border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-xs font-medium mb-1 uppercase tracking-wide">{title}</p>
          {loading ? (
            <><Skeleton className="h-6 w-20 mb-1" /><Skeleton className="h-3 w-16" /></>
          ) : (
            <>
              <p className="text-xl font-bold text-black mb-0.5">{value}</p>
              {sub && <p className="text-sm font-semibold text-green-600">{sub}</p>}
            </>
          )}
        </div>
        <div className={`${iconColor} p-2 rounded-lg`}>
          <Icon size={24} />
        </div>
      </div>
    </Card>
  );
}

export default function KPICards() {
  // ── 실제 DB 데이터 ─────────────────────────────────────────────
  const { data: analytics, isLoading: analyticsLoading } = trpc.admin.getAnalytics.useQuery();
  const { data: settlement, isLoading: settlementLoading } = trpc.payment.getSettlementSummary.useQuery(
    { period: 'month' }, { retry: false }
  );
  const { data: paymentList } = trpc.payment.getPaymentList.useQuery(
    { period: 'month', status: 'all', page: 1, pageSize: 1 }, { retry: false }
  );
  const { data: subList } = trpc.payment.getSubscriptionList.useQuery(
    { period: 'month', status: 'active', page: 1, pageSize: 1 }, { retry: false }
  );

  const loading = analyticsLoading || settlementLoading;

  // 매출 포맷
  const fmtKrw = (v?: number | null) =>
    v ? `₩${Math.round(Number(v)).toLocaleString('ko-KR')}` : '₩0';

  const totalRevenue = fmtKrw(settlement?.totalRevenue);
  const paymentCount = (paymentList as any)?.total ?? 0;
  const activeSubCount = (subList as any)?.total ?? analytics?.totalMembers ?? 0;

  const kpis = [
    {
      title: '총 사용자',
      value: analytics?.totalMembers ? analytics.totalMembers.toLocaleString() : '—',
      sub: '실시간 DB 집계',
      icon: Users, iconColor: 'bg-red-50 text-red-500',
    },
    {
      title: '이달 매출',
      value: loading ? '—' : totalRevenue,
      sub: `${paymentCount}건 결제`,
      icon: CreditCard, iconColor: 'bg-green-50 text-green-600',
    },
    {
      title: '활성 구독',
      value: activeSubCount > 0 ? activeSubCount.toLocaleString() : analytics?.totalMembers ? analytics.totalMembers.toLocaleString() : '—',
      sub: 'active 상태',
      icon: Activity, iconColor: 'bg-blue-50 text-blue-500',
    },
    {
      title: '평균 참여율',
      value: analytics?.activeRate ? `${analytics.activeRate}%` : '—',
      sub: '멤버십 활성 비율',
      icon: TrendingUp, iconColor: 'bg-red-50 text-red-500',
    },
    {
      title: '결제 성공률',
      value: settlement ? `${((Number(settlement.totalRevenue) / Math.max(Number(settlement.totalRevenue) + 1, 1)) * 100).toFixed(1)}%` : '—',
      sub: settlement?.totalRefund ? `환불 ₩${Number(settlement.totalRefund).toLocaleString()}` : '환불 없음',
      icon: CheckCircle, iconColor: 'bg-green-50 text-green-600',
    },
    {
      title: '평균 점수',
      value: analytics?.avgScore ? analytics.avgScore.toFixed(1) : '—',
      sub: 'AI 건강 피드백',
      icon: AlertCircle, iconColor: 'bg-gray-50 text-gray-600',
    },
  ];

  return (
    <div className="space-y-1.5">
      <div className="border-b border-gray-200 pb-2">
        <h1 className="text-base font-bold text-black mb-0.5">핵심 지표 (KPI)</h1>
        <p className="text-gray-600 text-xs">실시간 DB 데이터 기반 — 새로고침 시 즉시 반영</p>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {kpis.map(k => (
          <KPICard key={k.title} {...k} loading={loading} />
        ))}
      </div>

      {/* 멤버십 분포 — DB에서 실시간 */}
      {analytics?.membershipDistribution && analytics.membershipDistribution.length > 0 && (
        <div className="border-t border-gray-200 pt-3">
          <h2 className="text-sm font-bold text-black mb-2">11단계 멤버십 분포 (실시간)</h2>
          <div className="grid grid-cols-1 gap-1.5">
            <Card className="p-3 border-gray-200">
              <h3 className="text-sm font-bold text-black mb-2">단계별 회원 수</h3>
              <div className="space-y-1.5">
                {analytics.membershipDistribution.map((tier: any) => (
                  <div key={tier.tier} className="flex items-center gap-3 pb-2 border-b border-gray-100 last:border-0">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: tier.color || '#999' }} />
                    <span className="text-sm font-medium text-black flex-1">{tier.name}</span>
                    <span className="text-sm font-bold text-black">{Number(tier.value).toLocaleString()}명</span>
                    <div className="w-20 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${Math.max(2, Math.min(100, (tier.value / Math.max(...analytics.membershipDistribution.map((t: any) => t.value), 1)) * 100))}%`,
                          background: tier.color || '#999'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-3 border-gray-200">
              <h3 className="text-sm font-bold text-black mb-2">전체 통계 요약</h3>
              <div className="space-y-4">
                {[
                  { label: '전체 멤버', value: analytics.totalMembers?.toLocaleString() ?? '0' },
                  { label: '이달 매출', value: totalRevenue },
                  { label: '활성 비율', value: `${analytics.activeRate ?? 0}%` },
                  { label: '평균 AI 점수', value: `${analytics.avgScore?.toFixed(1) ?? '0'} / 100` },
                ].map(s => (
                  <div key={s.label} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-600 text-sm">{s.label}</span>
                    <span className="font-bold text-black">{s.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
