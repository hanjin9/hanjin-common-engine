/**
 * RefundDetailsPage.tsx — 환불 상세
 */
import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, RotateCcw, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';

const PERIOD_OPTIONS = [
  { value: 'today', label: '오늘' },
  { value: 'week', label: '7일' },
  { value: 'month', label: '30일' },
  { value: 'all', label: '전체' },
] as const;

export default function RefundDetailsPage() {
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState<'today'|'week'|'month'|'all'>('month');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const { data: refundList, isLoading, refetch } = trpc.payment.getPaymentList.useQuery({
    period, status: 'refunded', page, pageSize: PAGE_SIZE,
  });

  const { data: succeeded, isLoading: sLoading } = trpc.payment.getPaymentList.useQuery({
    period, status: 'succeeded', page: 1, pageSize: 50,
  });

  const refundPayment = trpc.payment.refundPayment.useMutation({
    onSuccess: () => { toast.success('환불 처리 완료'); refetch(); },
    onError: (e) => toast.error(`환불 실패: ${e.message}`),
  });

  const items = refundList?.items ?? [];
  const succeededItems = succeeded?.items ?? [];
  const total = Number(refundList?.total ?? 0);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const fmtKrw = (v?: number | null) => `₩${Math.round(Number(v ?? 0)).toLocaleString('ko-KR')}`;
  const fmtDate = (d?: Date | string | null) =>
    d ? new Date(d).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <DashboardLayout>
      <div className="space-y-3 p-3 md:p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation('/admin/payment')}>
              <ArrowLeft className="h-4 w-4 mr-1" />뒤로
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <RotateCcw className="h-6 w-6 text-red-500" />환불 상세
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">환불 내역 조회 · 환불 처리</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {PERIOD_OPTIONS.map(o => (
              <Button key={o.value} variant={period === o.value ? 'default' : 'outline'}
                size="sm" onClick={() => { setPeriod(o.value); setPage(1); }}>{o.label}</Button>
            ))}
            <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Card><CardContent className="pt-5">
            <p className="text-sm text-gray-500">환불 건수</p>
            <p className="text-xl font-bold text-red-500">{total.toLocaleString()}건</p>
          </CardContent></Card>
          <Card><CardContent className="pt-5">
            <p className="text-sm text-gray-500">총 환불액</p>
            <p className="text-xl font-bold text-red-500">{fmtKrw(refundList?.summary?.refundAmount)}</p>
          </CardContent></Card>
        </div>

        {/* 환불 가능 목록 (succeeded → 환불 버튼) */}
        <Card>
          <CardHeader><CardTitle className="text-sm">환불 처리 가능 목록 (결제 성공)</CardTitle></CardHeader>
          <CardContent>
            {sLoading ? <Skeleton className="h-40"/> : succeededItems.length === 0 ? (
              <p className="text-center text-gray-400 py-8">환불 가능한 결제가 없습니다</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-200 text-xs text-gray-500">
                    <th className="text-left py-2 px-3">일시</th>
                    <th className="text-left py-2 px-3">사용자</th>
                    <th className="text-right py-2 px-3">금액</th>
                    <th className="text-right py-2 px-3">환불</th>
                  </tr></thead>
                  <tbody>
                    {succeededItems.slice(0,10).map((p: any) => (
                      <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3 text-xs text-gray-500">{fmtDate(p.createdAt)}</td>
                        <td className="py-2 px-3 font-medium">{p.userName ?? p.userEmail ?? '—'}</td>
                        <td className="py-2 px-3 text-right font-mono">{fmtKrw(p.amountKrw)}</td>
                        <td className="py-2 px-3 text-right">
                          <Button variant="outline" size="sm" className="text-red-500 border-red-200 text-xs h-7"
                            disabled={refundPayment.isPending}
                            onClick={() => {
                              if (confirm(`${fmtKrw(p.amountKrw)} 환불하시겠습니까?`)) {
                                refundPayment.mutate({ paymentId: Number(p.id) });
                              }
                            }}>환불</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 환불 완료 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              환불 완료 내역 <Badge variant="outline" className="text-xs">{total.toLocaleString()}건</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-40"/> : items.length === 0 ? (
              <p className="text-center text-gray-400 py-8">환불 내역이 없습니다</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-200 text-xs text-gray-500">
                      <th className="text-left py-2 px-3">일시</th>
                      <th className="text-left py-2 px-3">사용자</th>
                      <th className="text-left py-2 px-3">프로젝트</th>
                      <th className="text-right py-2 px-3">금액</th>
                    </tr></thead>
                    <tbody>
                      {items.map((p: any) => (
                        <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3 text-xs text-gray-500">{fmtDate(p.createdAt)}</td>
                          <td className="py-2 px-3 font-medium">{p.userName ?? '—'}</td>
                          <td className="py-2 px-3 text-gray-500">{p.projectSlug ?? '—'}</td>
                          <td className="py-2 px-3 text-right font-mono text-red-500">{fmtKrw(p.amountKrw)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between mt-4 text-sm">
                  <span className="text-gray-500">총 {total.toLocaleString()}건</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>이전</Button>
                    <span className="px-3 py-1 border rounded">{page} / {totalPages||1}</span>
                    <Button variant="outline" size="sm" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>다음</Button>
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
