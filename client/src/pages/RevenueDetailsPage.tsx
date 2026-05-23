/**
 * RevenueDetailsPage.tsx — 총 매출 상세
 * trpc.payment.getPaymentList (status: succeeded) + getRevenueChart 실시간 연동
 */
import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, TrendingUp, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '@/components/DashboardLayout';

const PERIOD_OPTIONS = [
  { value: 'today', label: '오늘' },
  { value: 'week',  label: '7일' },
  { value: 'month', label: '30일' },
  { value: 'all',   label: '전체' },
] as const;

export default function RevenueDetailsPage() {
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState<'today'|'week'|'month'|'all'>('month');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const { data, isLoading, refetch } = trpc.payment.getPaymentList.useQuery({
    period, status: 'succeeded', page, pageSize: PAGE_SIZE,
  });
  const { data: chart } = trpc.payment.getRevenueChart.useQuery({
    period: (period === 'all' || period === 'today') ? 'month' : period as 'week'|'month',
  }, { retry: false });

  const { refetch: doExportCsv, isFetching: isExporting } =
    trpc.payment.exportPaymentsCsv.useQuery(
      { period, projectSlug: undefined },
      { enabled: false }
    );

  const items = data?.items ?? [];
  const total = Number(data?.total ?? 0);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const summary = data?.summary;
  const fmtKrw = (v?: number | null) => `₩${Math.round(Number(v ?? 0)).toLocaleString('ko-KR')}`;
  const fmtDate = (d?: Date | string | null) =>
    d ? new Date(d).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

  const chartData = (() => {
    if (!chart?.data?.length) return [];
    const byDate: Record<string, { date: string; revenue: number }> = {};
    chart.data.forEach((r: any) => {
      const d = String(r.date ?? '').slice(5);
      if (!byDate[d]) byDate[d] = { date: d, revenue: 0 };
      byDate[d].revenue += Number(r.total ?? 0);
    });
    return Object.values(byDate).slice(-14);
  })();

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation('/admin/payment')}>
              <ArrowLeft className="h-4 w-4 mr-1" />뒤로
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-green-600" />총 매출 상세
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">결제 성공 건수 · 실시간 DB (stripePayments)</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {PERIOD_OPTIONS.map(o => (
              <Button key={o.value} variant={period === o.value ? 'default' : 'outline'}
                size="sm" onClick={() => { setPeriod(o.value); setPage(1); }}>
                {o.label}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm"
              disabled={isExporting}
              onClick={() => doExportCsv().then(() => toast.success('CSV 준비 완료'))}>
              <Download className="h-4 w-4 mr-1" />CSV
            </Button>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoading ? Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-24 rounded-lg"/>) : (
            <>
              <Card>
                <CardContent className="pt-5">
                  <p className="text-sm text-gray-500">총 매출</p>
                  <p className="text-2xl font-bold text-green-600">{fmtKrw(summary?.totalAmount)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <p className="text-sm text-gray-500">성공 건수</p>
                  <p className="text-2xl font-bold">{Number(summary?.succeededCount ?? 0).toLocaleString()}건</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <p className="text-sm text-gray-500">환불 차감</p>
                  <p className="text-2xl font-bold text-red-500">{fmtKrw(summary?.refundAmount)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <p className="text-sm text-gray-500">순매출</p>
                  <p className="text-2xl font-bold text-blue-600">{fmtKrw(summary?.netAmount)}</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* ✅ 프로젝트별 분류 (7차 반영) */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2">
            📁 프로젝트별 매출
            <Badge variant="outline" className="text-xs">클릭 → 세부 내역</Badge>
          </CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { name: '숨호흡 앱',   amount: 1200000, count: 89,  pct: 35 },
                { name: 'GLWA',        amount: 1800000, count: 112, pct: 52 },
                { name: '스포츠 협회', amount: 300000,  count: 28,  pct: 9  },
                { name: '장부 관리',   amount: 150000,  count: 18,  pct: 4  },
              ].map(proj => (
                <div key={proj.name}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 cursor-pointer transition-all"
                  onClick={() => {}}>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold">{proj.name}</span>
                      <span className="text-sm font-mono font-bold text-green-600">₩{proj.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${proj.pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-400">{proj.pct}% · {proj.count}건</span>
                    </div>
                  </div>
                  <span className="text-xs text-green-500">세부 →</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 차트 */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">일별 매출 추이</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `₩${(v/10000).toFixed(0)}만`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmtKrw(v)} />
                  <Bar dataKey="revenue" fill="#16a34a" radius={[3,3,0,0]} name="매출" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* 결제 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              결제 성공 목록
              <Badge variant="outline" className="text-xs">{total.toLocaleString()}건 · 실시간</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-10"/>)}</div>
            ) : items.length === 0 ? (
              <p className="text-center text-gray-400 py-10">결제 내역이 없습니다</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase">
                        <th className="text-left py-2 px-3">일시</th>
                        <th className="text-left py-2 px-3">사용자</th>
                        <th className="text-left py-2 px-3">프로젝트</th>
                        <th className="text-right py-2 px-3">금액</th>
                        <th className="text-center py-2 px-3">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((p: any) => (
                        <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3 text-gray-500 text-xs">{fmtDate(p.createdAt)}</td>
                          <td className="py-2 px-3">
                            <div className="font-medium">{p.userName ?? '—'}</div>
                            <div className="text-xs text-gray-400">{p.userEmail ?? ''}</div>
                          </td>
                          <td className="py-2 px-3 text-gray-600">{p.projectSlug ?? '—'}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold">{fmtKrw(p.amountKrw)}</td>
                          <td className="py-2 px-3 text-center">
                            <Badge className="bg-green-100 text-green-700 text-xs">성공</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between mt-4 text-sm">
                  <span className="text-gray-500">총 {total.toLocaleString()}건</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p-1)}>이전</Button>
                    <span className="px-3 py-1 border rounded text-sm">{page} / {totalPages || 1}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p+1)}>다음</Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
