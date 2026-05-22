/**
 * PaymentDashboard.tsx — 실제 Stripe DB 연동
 * 하드코딩 더미 데이터 완전 제거
 * stripePayments + stripeSubscriptions 테이블 실시간 조회
 */
import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  CreditCard, DollarSign, TrendingUp, AlertCircle,
  RefreshCw, Download, ExternalLink, Receipt, RotateCcw,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Period = 'week' | 'month' | 'all';
const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'week', label: '7일' },
  { value: 'month', label: '30일' },
  { value: 'all', label: '전체' },
];
const STATUS_STYLE: Record<string, string> = {
  succeeded: 'bg-green-100 text-green-700',
  pending:   'bg-yellow-100 text-yellow-700',
  failed:    'bg-red-100 text-red-700',
  refunded:  'bg-purple-100 text-purple-700',
  canceled:  'bg-gray-100 text-gray-600',
};
const STATUS_LABEL: Record<string, string> = {
  succeeded: '성공', pending: '대기', failed: '실패', refunded: '환불', canceled: '취소',
};

export default function PaymentDashboard() {
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState<Period>('month');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  // ── 실제 DB 데이터 ─────────────────────────────────────────────
  const { data: settlement, isLoading: stlLoading, refetch: refetchAll } =
    trpc.payment.getSettlementSummary.useQuery({ period }, { retry: false });

  const { data: paymentList, isLoading: pmtLoading, refetch: refetchPayments } =
    trpc.payment.getPaymentList.useQuery(
      { period, status: 'all', page, pageSize: PAGE_SIZE }, { retry: false }
    );

  const { data: revenueChart } =
    trpc.payment.getRevenueChart.useQuery({ period: period === 'all' ? 'month' : period as 'week' | 'month' }, { retry: false });

  const { refetch: doExportCsv, isFetching: isExporting } = trpc.payment.exportPaymentsCsv.useQuery({ period: period as any }, { enabled: false });

  const refundPayment = trpc.payment.refundPayment.useMutation({
    onSuccess: () => { toast.success('환불 처리 완료'); refetchPayments(); },
    onError: (e) => toast.error(`환불 실패: ${e.message}`),
  });

  const handleRefresh = async () => {
    toast.loading('새로고침 중...');
    await refetchAll();
    await refetchPayments();
    toast.success('업데이트 완료');
  };

  const payments = (paymentList as any)?.payments ?? (paymentList as any)?.items ?? [];
  const totalPayments = (paymentList as any)?.total ?? payments.length;
  const totalPages = Math.ceil(totalPayments / PAGE_SIZE);

  const fmtKrw = (v?: number | null) =>
    v ? `₩${Math.round(Number(v)).toLocaleString('ko-KR')}` : '₩0';

  // 차트 데이터 변환
  const chartData = (() => {
    if (!revenueChart?.data?.length) return [];
    const byDate: Record<string, { date: string; revenue: number }> = {};
    revenueChart.data.forEach((r: any) => {
      const d = String(r.date ?? '').slice(5);
      if (!byDate[d]) byDate[d] = { date: d, revenue: 0 };
      byDate[d].revenue += Number(r.total ?? 0);
    });
    return Object.values(byDate).slice(-14);
  })();

  const loading = stlLoading || pmtLoading;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8" />결제 관리
          </h1>
          <p className="text-gray-600 mt-1 text-sm">Stripe 실시간 · stripePayments 테이블 직접 조회</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {PERIOD_OPTIONS.map(o => (
            <Button
              key={o.value}
              variant={period === o.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setPeriod(o.value); setPage(1); }}
            >{o.label}</Button>
          ))}
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1">
            <RefreshCw className="h-4 w-4" />새로고침
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={() => doExportCsv().then(() => toast.success('CSV 준비 완료'))}
            disabled={isExporting}
            className="gap-1"
          >
            <Download className="h-4 w-4" />CSV
          </Button>
          <Button size="sm" onClick={() => setLocation('/admin/membership/checkout')} className="gap-1">
            <ExternalLink className="h-4 w-4" />결제 시작
          </Button>
        </div>
      </div>

      {/* KPI 카드 — 실제 DB */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)
        ) : (
          <>
            <Card className="hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
              onClick={() => setLocation('/admin/payment/revenue')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />이달 매출
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{fmtKrw(Number(settlement?.totalRevenue))}</div>
                <p className="text-xs text-gray-500 mt-1">{totalPayments}건 결제</p>
                <Badge className="mt-2 bg-green-100 text-green-700">실시간 DB</Badge>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
              onClick={() => setLocation('/admin/payment/refund')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-purple-500" />환불
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{fmtKrw(Number(settlement?.totalRefund ?? 0))}</div>
                <p className="text-xs text-gray-500 mt-1">환불 금액</p>
                <Badge className="mt-2 bg-purple-100 text-purple-700">실시간 DB</Badge>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
              onClick={() => setLocation('/admin/payment/settlement')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />순매출
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {fmtKrw(Number(settlement?.totalRevenue ?? 0) - Number(settlement?.totalRefund ?? 0))}
                </div>
                <p className="text-xs text-gray-500 mt-1">매출 - 환불</p>
                <Badge className="mt-2 bg-blue-100 text-blue-700">실시간 계산</Badge>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
              onClick={() => setLocation('/admin/payment/transaction')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-orange-500" />전체 건수
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{totalPayments.toLocaleString()}</div>
                <p className="text-xs text-gray-500 mt-1">결제 트랜잭션</p>
                <Badge className="mt-2 bg-orange-100 text-orange-700">실시간 DB</Badge>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* 매출 차트 */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">일별 매출 (실시간)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `₩${(v/1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmtKrw(v)} />
                <Bar dataKey="revenue" fill="#E53935" radius={[3, 3, 0, 0]} name="매출" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 결제 내역 테이블 — 실제 DB */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            결제 내역 <Badge variant="outline" className="text-xs">{totalPayments}건 · 실시간</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12 text-gray-400 space-y-3">
              <AlertCircle className="h-8 w-8 mx-auto" />
              <p className="font-medium">결제 내역이 없습니다</p>
              <p className="text-sm">Stripe 결제 완료 시 여기에 자동으로 표시됩니다</p>
              <Button variant="outline" size="sm" onClick={() => setLocation('/admin/membership/checkout')}>
                테스트 결제 하기
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase">
                      <th className="text-left py-2 px-3">날짜</th>
                      <th className="text-left py-2 px-3">프로젝트</th>
                      <th className="text-right py-2 px-3">금액</th>
                      <th className="text-center py-2 px-3">상태</th>
                      <th className="text-right py-2 px-3">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p: any, i: number) => (
                      <tr key={p.id ?? i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3 text-gray-500">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString('ko-KR') : '—'}
                        </td>
                        <td className="py-2 px-3 font-medium">{p.projectSlug ?? p.description ?? '—'}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          {fmtKrw(Number(p.amountKrw ?? 0))}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Badge className={`text-xs ${STATUS_STYLE[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABEL[p.status] ?? p.status}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-right">
                          {p.status === 'succeeded' && (
                            <Button
                              variant="ghost" size="sm"
                              className="text-xs text-red-500 hover:text-red-700 h-7"
                              onClick={() => {
                                if (confirm(`₩${Number(p.amountKrw).toLocaleString()} 환불하시겠습니까?`)) {
                                  refundPayment.mutate({
                                    paymentId: Number(p.id ?? 0),
                                    amount: p.amountKrw,
                                  });
                                }
                              }}
                            >환불</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* 페이지네이션 */}
              <div className="flex items-center justify-between mt-4 text-sm">
                <span className="text-gray-500">총 {totalPayments}건</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>이전</Button>
                  <span className="px-3 py-1 border rounded text-sm">{page} / {totalPages || 1}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>다음</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
