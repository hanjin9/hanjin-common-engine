/**
 * PaymentChart.tsx — 실제 Stripe DB 연동 결제 차트
 * trpc.payment.getRevenueChart + getPaymentList + getSubscriptionList 사용
 */
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { RefreshCw, Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  succeeded: '#2E7D32', pending: '#F57C00', failed: '#D32F2F',
  refunded: '#7B1FA2', canceled: '#757575',
};
const STATUS_LABELS: Record<string, string> = {
  succeeded: '성공', pending: '대기', failed: '실패', refunded: '환불', canceled: '취소',
};

export default function PaymentChart() {
  const [period, setPeriod] = useState<'week' | 'month'>('month');

  // ── 실제 DB 데이터 ─────────────────────────────────────────────
  const { data: revenueChart, isLoading: chartLoading, refetch } = trpc.payment.getRevenueChart.useQuery(
    { period }, { retry: false }
  );
  const { data: paymentData, isLoading: pmtLoading } = trpc.payment.getPaymentList.useQuery(
    { period, status: 'all', page: 1, pageSize: 10 }, { retry: false }
  );
  const { data: settlement } = trpc.payment.getSettlementSummary.useQuery(
    { period }, { retry: false }
  );

  const exportCsv = trpc.payment.exportPaymentsCsv.useQuery({ period: period as any }, { enabled: false }); //


  // 월별 집계 변환
  const chartData = (() => {
    if (!revenueChart?.data?.length) return [];
    const byDate: Record<string, { date: string; revenue: number; count: number }> = {};
    revenueChart.data.forEach((r: any) => {
      const d = r.date?.slice(5) ?? ''; // MM-DD
      if (!byDate[d]) byDate[d] = { date: d, revenue: 0, count: 0 };
      byDate[d].revenue += Number(r.total ?? 0);
      byDate[d].count += Number(r.count ?? 0);
    });
    return Object.values(byDate).slice(-14);
  })();

  // 상태별 분포
  const payments = (paymentData as any)?.payments ?? (paymentData as any)?.items ?? [];
  const statusDist = (() => {
    const m: Record<string, number> = {};
    payments.forEach((p: any) => {
      const s = p.status ?? 'unknown';
      m[s] = (m[s] ?? 0) + 1;
    });
    return Object.entries(m).map(([status, value]) => ({
      name: STATUS_LABELS[status] ?? status,
      value,
      color: STATUS_COLORS[status] ?? '#9E9E9E',
    }));
  })();

  const fmtKrw = (v: number) => `₩${Math.round(v).toLocaleString('ko-KR')}`;
  const loading = chartLoading || pmtLoading;

  return (
    <div className="space-y-3">
      <div className="border-b border-gray-200 pb-2 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-base font-bold text-black mb-0.5">결제 및 구독 현황</h1>
          <p className="text-gray-600 text-xs">Stripe · 실시간 DB 연동 · stripePayments 테이블</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('week')}
          >7일</Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('month')}
          >30일</Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => { exportCsv?.refetch?.(); toast.success('CSV 준비 완료'); }}>
            <Download className="h-4 w-4 mr-1" />CSV
          </Button>
        </div>
      </div>

      {/* 정산 요약 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '총 매출', value: settlement ? fmtKrw(Number(settlement.totalRevenue)) : '—', color: 'text-green-600' },
          { label: '환불', value: settlement ? fmtKrw(Number(settlement.totalRefund ?? 0)) : '—', color: 'text-red-500' },
          { label: '순매출', value: settlement ? fmtKrw(Number(settlement.totalRevenue) - Number(settlement.totalRefund ?? 0)) : '—', color: 'text-black' },
        ].map(s => (
          <Card key={s.label} className="p-4 border-gray-200 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* 매출 추이 차트 */}
      <Card className="p-8 border-gray-200">
        <h2 className="text-base font-semibold text-black mb-2">일별 매출 추이 (실시간)</h2>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-lg font-medium">결제 데이터 없음</p>
              <p className="text-sm mt-1">Stripe 결제 후 자동으로 표시됩니다</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey="date" stroke="#757575" tick={{ fontSize: 12 }} />
              <YAxis stroke="#757575" tickFormatter={v => `₩${(v/1000).toFixed(0)}K`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => fmtKrw(v)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#E53935" strokeWidth={2.5} dot={{ r: 3 }} name="매출" />
              <Line type="monotone" dataKey="count" stroke="#424242" strokeWidth={1.5} dot={{ r: 3 }} name="건수" yAxisId="right" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* 상태 분포 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <Card className="p-8 border-gray-200">
          <h2 className="text-base font-semibold text-black mb-2">결제 상태 분포 (실시간)</h2>
          {loading ? <Skeleton className="h-48 w-full" /> : statusDist.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">결제 데이터 없음</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={statusDist} cx="50%" cy="50%" outerRadius={75} dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {statusDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {statusDist.map(s => (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ background: s.color }} />
                      <span className="text-gray-600">{s.name}</span>
                    </div>
                    <span className="font-bold text-black">{s.value}건</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* 최근 결제 내역 */}
        <Card className="p-8 border-gray-200">
          <h2 className="text-base font-semibold text-black mb-2">최근 결제 내역 (실시간)</h2>
          {loading ? (
            <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : payments.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400 gap-3">
              <p className="text-sm">결제 내역 없음</p>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/membership/checkout'}>
                <ExternalLink className="h-4 w-4 mr-1" />테스트 결제 하기
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.slice(0, 6).map((p: any, i: number) => (
                <div key={p.id ?? i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-black">{p.projectSlug ?? p.description ?? '—'}</p>
                    <p className="text-xs text-gray-500">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('ko-KR') : '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-black">{fmtKrw(Number(p.amountKrw ?? 0))}</p>
                    <Badge className="text-xs" style={{ background: STATUS_COLORS[p.status] + '20', color: STATUS_COLORS[p.status] }}>
                      {STATUS_LABELS[p.status] ?? p.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
