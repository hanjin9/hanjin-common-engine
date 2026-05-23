/**
 * SettlementDetailsPage.tsx — 정산 상세 (순매출)
 */
import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, DollarSign, RefreshCw } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

const PERIOD_OPTIONS = [
  { value: 'today', label: '오늘' },
  { value: 'week', label: '7일' },
  { value: 'month', label: '30일' },
  { value: 'all', label: '전체' },
] as const;

export default function SettlementDetailsPage() {
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState<'today'|'week'|'month'|'all'>('month');

  const { data: settlement, isLoading, refetch } = trpc.payment.getSettlementSummary.useQuery(
    { period }, { retry: false }
  );

  const fmtKrw = (v?: number | null) => `₩${Math.round(Number(v ?? 0)).toLocaleString('ko-KR')}`;

  return (
    <DashboardLayout>
      <div className="space-y-3 p-3 md:p-4">
        <div className="flex items-center justify-between flex-wrap gap-1.5">
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => setLocation('/admin/payment')}>
              <ArrowLeft className="h-4 w-4 mr-1" />뒤로
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-1.5">
                <DollarSign className="h-6 w-6 text-blue-600" />정산 상세
              </h1>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">순매출 · 기간별 정산 현황</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {PERIOD_OPTIONS.map(o => (
              <Button key={o.value} variant={period === o.value ? 'default' : 'outline'}
                size="sm" onClick={() => setPeriod(o.value)}>{o.label}</Button>
            ))}
            <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-1.5">
            {Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-24 rounded-lg"/>)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-1.5">
              <Card><CardContent className="pt-5">
                <p className="text-sm text-gray-500">총 매출</p>
                <p className="text-2xl font-bold text-green-600">{fmtKrw(settlement?.totalRevenue)}</p>
              </CardContent></Card>
              <Card><CardContent className="pt-5">
                <p className="text-sm text-gray-500">환불액</p>
                <p className="text-xl font-bold text-red-500">{fmtKrw(settlement?.totalRefund)}</p>
              </CardContent></Card>
              <Card><CardContent className="pt-5">
                <p className="text-sm text-gray-500">순매출</p>
                <p className="text-2xl font-bold text-blue-600">{fmtKrw(settlement?.netRevenue)}</p>
              </CardContent></Card>
              <Card><CardContent className="pt-5">
                <p className="text-sm text-gray-500">활성 구독</p>
                <p className="text-base font-bold truncate">{Number(settlement?.activeSubscriptions ?? 0).toLocaleString()}건</p>
              </CardContent></Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">정산 요약</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {[
                    { label: '결제 성공 건수', value: `${Number(settlement?.succeededCount ?? 0).toLocaleString()}건`, color: 'text-green-600' },
                    { label: '총 매출', value: fmtKrw(settlement?.totalRevenue), color: 'text-green-600' },
                    { label: '환불 건수', value: `${Number(settlement?.refundCount ?? 0).toLocaleString()}건`, color: 'text-red-500' },
                    { label: '환불액', value: fmtKrw(settlement?.totalRefund), color: 'text-red-500' },
                    { label: '실패 건수', value: `${Number(settlement?.failedCount ?? 0).toLocaleString()}건`, color: 'text-gray-500' },
                    { label: '순매출 (정산액)', value: fmtKrw(settlement?.netRevenue), color: 'text-blue-600 font-bold text-lg' },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-gray-600">{row.label}</span>
                      <span className={`text-sm font-semibold ${row.color}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
