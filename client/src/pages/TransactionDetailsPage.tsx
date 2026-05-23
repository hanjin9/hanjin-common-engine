/**
 * TransactionDetailsPage.tsx — 전체 거래 내역
 */
import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Receipt, RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';

const PERIOD_OPTIONS = [
  { value: 'today', label: '오늘' },
  { value: 'week', label: '7일' },
  { value: 'month', label: '30일' },
  { value: 'all', label: '전체' },
] as const;

const STATUS_OPTS = [
  { value: 'all', label: '전체' },
  { value: 'succeeded', label: '성공' },
  { value: 'pending', label: '대기' },
  { value: 'failed', label: '실패' },
  { value: 'refunded', label: '환불' },
] as const;

const STATUS_STYLE: Record<string, string> = {
  succeeded: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-purple-100 text-purple-700',
};
const STATUS_LABEL: Record<string, string> = {
  succeeded: '성공', pending: '대기', failed: '실패', refunded: '환불',
};

export default function TransactionDetailsPage() {
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState<'today'|'week'|'month'|'all'>('month');
  const [status, setStatus] = useState<'all'|'succeeded'|'pending'|'failed'|'refunded'>('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const { data, isLoading, refetch } = trpc.payment.getPaymentList.useQuery({
    period, status, page, pageSize: PAGE_SIZE,
  });

  const { refetch: doExportCsv, isFetching: isExporting } =
    trpc.payment.exportPaymentsCsv.useQuery({ period, projectSlug: undefined }, { enabled: false });

  const items = data?.items ?? [];
  const total = Number(data?.total ?? 0);
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
                <Receipt className="h-6 w-6 text-orange-500" />전체 거래 내역
              </h1>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">모든 결제 트랜잭션 · 실시간 DB</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {PERIOD_OPTIONS.map(o => (
              <Button key={o.value} variant={period===o.value?'default':'outline'}
                size="sm" onClick={()=>{setPeriod(o.value);setPage(1);}}>{o.label}</Button>
            ))}
            <Button variant="outline" size="sm" onClick={()=>refetch()}><RefreshCw className="h-4 w-4"/></Button>
            <Button variant="outline" size="sm" disabled={isExporting}
              onClick={()=>doExportCsv().then(()=>toast.success('CSV 준비 완료'))}>
              <Download className="h-4 w-4 mr-1"/>CSV
            </Button>
          </div>
        </div>

        {/* 상태 필터 */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTS.map(o => (
            <Button key={o.value} variant={status===o.value?'default':'outline'}
              size="sm" onClick={()=>{setStatus(o.value as any);setPage(1);}}>{o.label}</Button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              거래 목록 <Badge variant="outline" className="text-xs">{total.toLocaleString()}건 · 실시간</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-10"/>)}</div>
            ) : items.length === 0 ? (
              <p className="text-center text-gray-400 py-10">거래 내역이 없습니다</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-200 text-xs text-gray-500">
                      <th className="text-left py-2 px-3">일시</th>
                      <th className="text-left py-2 px-3">사용자</th>
                      <th className="text-left py-2 px-3">프로젝트</th>
                      <th className="text-right py-2 px-3">금액</th>
                      <th className="text-center py-2 px-3">상태</th>
                    </tr></thead>
                    <tbody>
                      {items.map((p: any) => (
                        <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3 text-xs text-gray-500">{fmtDate(p.createdAt)}</td>
                          <td className="py-2 px-3">
                            <div className="font-medium">{p.userName ?? '—'}</div>
                            <div className="text-xs text-gray-400">{p.userEmail ?? ''}</div>
                          </td>
                          <td className="py-2 px-3 text-gray-600">{p.projectSlug ?? '—'}</td>
                          <td className="py-2 px-3 text-right font-mono">{fmtKrw(p.amountKrw)}</td>
                          <td className="py-2 px-3 text-center">
                            <Badge className={`text-xs ${STATUS_STYLE[p.status]||'bg-gray-100 text-gray-600'}`}>
                              {STATUS_LABEL[p.status]??p.status}
                            </Badge>
                          </td>
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
