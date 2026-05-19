/**
 * PaymentDashboard — 결제/정산 관리자 화면
 *
 * 탭 구성:
 * 1. 입금 명단 (엑셀형 테이블)
 * 2. 구독 현황 (갱신/취소/만료)
 * 3. 환불 처리
 * 4. 금액 정산 요약
 * 5. CSV 내보내기
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard,
  RefreshCw,
  Download,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

// ─── 유틸 ─────────────────────────────────────────────────────────────────
function formatKRW(amount: number | null | undefined): string {
  if (!amount) return "₩0";
  return `₩${amount.toLocaleString("ko-KR")}`;
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "-";
  return new Date(d).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    succeeded: { label: "결제완료", variant: "default" },
    pending: { label: "대기중", variant: "secondary" },
    failed: { label: "실패", variant: "destructive" },
    refunded: { label: "환불됨", variant: "outline" },
    active: { label: "활성", variant: "default" },
    canceled: { label: "취소됨", variant: "destructive" },
    past_due: { label: "연체", variant: "destructive" },
    trialing: { label: "체험중", variant: "secondary" },
    incomplete: { label: "미완료", variant: "outline" },
  };
  const cfg = map[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

// ─── CSV 내보내기 ─────────────────────────────────────────────────────────
function exportToCSV(data: any[], filename: string) {
  if (!data.length) {
    toast.error("내보낼 데이터가 없습니다.");
    return;
  }
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return "";
      const str = String(val);
      return str.includes(",") ? `"${str}"` : str;
    }).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`${filename} CSV 다운로드 완료`);
}

// ─── 통계 카드 ────────────────────────────────────────────────────────────
function SummaryCards({ period }: { period: "today" | "week" | "month" | "all" }) {
  const { data, isLoading } = trpc.payment.getSettlementSummary.useQuery({ period });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "총 결제금액",
      value: formatKRW(data?.totalRevenue),
      icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
      sub: `${data?.succeededCount ?? 0}건 성공`,
    },
    {
      label: "환불 금액",
      value: formatKRW(data?.totalRefund),
      icon: <RefreshCw className="w-5 h-5 text-amber-500" />,
      sub: `${data?.refundCount ?? 0}건`,
    },
    {
      label: "활성 구독",
      value: `${data?.activeSubscriptions ?? 0}명`,
      icon: <Users className="w-5 h-5 text-blue-500" />,
      sub: `연체 ${data?.activeSubscriptions ?? 0}명 구독`,
    },
    {
      label: "실패/미완료",
      value: `${data?.failedCount ?? 0}건`,
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      sub: "즉시 확인 필요",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((c) => (
        <Card key={c.label} className="border border-border/50 bg-card/80">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{c.label}</span>
              {c.icon}
            </div>
            <div className="text-xl font-bold">{c.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{c.sub}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── 입금 명단 탭 ─────────────────────────────────────────────────────────
function PaymentListTab() {
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("month");
  const [status, setStatus] = useState<"all" | "succeeded" | "pending" | "failed" | "refunded">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = trpc.payment.getPaymentList.useQuery({
    period,
    status,
    page,
    pageSize: 50,
  });

  const filtered = useMemo(() => {
    if (!data?.items) return [];
    if (!search) return data.items;
    const q = search.toLowerCase();
    return data.items.filter(
      (p) =>
        p.userId?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.stripePaymentIntentId?.toLowerCase().includes(q)
    );
  }, [data?.items, search]);

  return (
    <div>
      <SummaryCards period={period} />

      {/* 필터 바 */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={period} onValueChange={(v) => { setPeriod(v as any); setPage(1); }}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">오늘</SelectItem>
            <SelectItem value="week">최근 7일</SelectItem>
            <SelectItem value="month">최근 30일</SelectItem>
            <SelectItem value="all">전체</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => { setStatus(v as any); setPage(1); }}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="succeeded">결제완료</SelectItem>
            <SelectItem value="pending">대기중</SelectItem>
            <SelectItem value="failed">실패</SelectItem>
            <SelectItem value="refunded">환불됨</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="사용자ID / 설명 / 결제ID 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />

        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-1" /> 새로고침
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => exportToCSV(filtered, "입금명단")}
        >
          <Download className="w-4 h-4 mr-1" /> CSV
        </Button>
      </div>

      {/* 테이블 */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12">#</TableHead>
              <TableHead>사용자 ID</TableHead>
              <TableHead>프로젝트</TableHead>
              <TableHead>금액</TableHead>
              <TableHead>통화</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>설명</TableHead>
              <TableHead>결제일시</TableHead>
              <TableHead>결제 ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(9)].map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  결제 내역이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p, idx) => (
                <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-muted-foreground text-xs">{(page - 1) * 50 + idx + 1}</TableCell>
                  <TableCell className="font-mono text-xs">{p.userId}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{p.projectSlug}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold">{formatKRW(p.amountKrw)}</TableCell>
                  <TableCell className="uppercase text-xs text-muted-foreground">{p.currency}</TableCell>
                  <TableCell><StatusBadge status={p.status ?? "pending"} /></TableCell>
                  <TableCell className="text-sm max-w-[180px] truncate">{p.description || "-"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[120px]">
                    {p.stripePaymentIntentId || p.stripeInvoiceId || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 */}
      {data && data.total > 50 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground">
            총 {data.total}건 중 {(page - 1) * 50 + 1}–{Math.min(page * 50, data.total)}건
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>이전</Button>
            <Button variant="outline" size="sm" disabled={page * 50 >= data.total} onClick={() => setPage(p => p + 1)}>다음</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 구독 현황 탭 ─────────────────────────────────────────────────────────
function SubscriptionTab() {
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("month");
  const [statusFilter, setStatusFilter] = useState<string>("all");

    const { data: subResult, isLoading, refetch } = trpc.payment.getSubscriptionList.useQuery({ period, status: "all", page: 1, pageSize: 100 });
  const filtered = useMemo(() => {
    const items = subResult?.items ?? [];
    if (statusFilter === "all") return items;
    return items.filter((s) => s.status === statusFilter);
  }, [subResult, statusFilter]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">오늘</SelectItem>
            <SelectItem value="week">최근 7일</SelectItem>
            <SelectItem value="month">최근 30일</SelectItem>
            <SelectItem value="all">전체</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="active">활성</SelectItem>
            <SelectItem value="canceled">취소됨</SelectItem>
            <SelectItem value="past_due">연체</SelectItem>
            <SelectItem value="trialing">체험중</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-1" /> 새로고침
        </Button>
        <Button variant="outline" size="sm" onClick={() => exportToCSV(filtered, "구독현황")}>
          <Download className="w-4 h-4 mr-1" /> CSV
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>#</TableHead>
              <TableHead>사용자 ID</TableHead>
              <TableHead>프로젝트</TableHead>
              <TableHead>플랜</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>구독 시작</TableHead>
              <TableHead>다음 갱신</TableHead>
              <TableHead>구독 ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(8)].map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  구독 내역이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s, idx) => (
                <TableRow key={s.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                  <TableCell className="font-mono text-xs">{s.userId}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{s.projectSlug}</Badge></TableCell>
                  <TableCell className="text-xs">{s.tierKey || "-"}</TableCell>
                  <TableCell><StatusBadge status={s.status ?? "incomplete"} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(s.createdAt)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(s.currentPeriodEnd)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[120px]">
                    {s.stripeSubscriptionId || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── 환불 처리 탭 ─────────────────────────────────────────────────────────
function RefundTab() {
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [reason, setReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const refundMutation = trpc.payment.refundPayment.useMutation({
    onSuccess: (data) => {
      toast.success(`환불 처리 완료: ${data.refundId}`);
      setPaymentIntentId("");
      setReason("");
      setIsProcessing(false);
    },
    onError: (err) => {
      toast.error(`환불 실패: ${err.message}`);
      setIsProcessing(false);
    },
  });

  const { data: refundHistory, isLoading } = trpc.payment.getPaymentList.useQuery({ period: "all", status: "refunded", page: 1, pageSize: 50 });

  return (
    <div className="space-y-6">
      {/* 환불 처리 폼 */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-amber-500" />
            환불 처리
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">결제 Intent ID (pi_...)</label>
            <Input
              placeholder="pi_xxxxxxxxxxxxxxxxxxxxxxxx"
              value={paymentIntentId}
              onChange={(e) => setPaymentIntentId(e.target.value)}
              className="font-mono"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">환불 사유</label>
            <Input
              placeholder="고객 요청, 서비스 불만족 등"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <Button
            variant="destructive"
            disabled={!paymentIntentId || isProcessing}
            onClick={() => {
              setIsProcessing(true);
              const found = (refundHistory?.items ?? []).find((r: any) => r.stripePaymentIntentId === paymentIntentId);
              if (!found) { toast.error("결제 ID를 찾을 수 없습니다. 입금 명단에서 확인하세요."); setIsProcessing(false); return; }
              refundMutation.mutate({ paymentId: found.id, reason: "requested_by_customer" });
            }}
          >
            {isProcessing ? "처리 중..." : "환불 처리"}
          </Button>
          <p className="text-xs text-muted-foreground">
            ⚠️ 환불은 되돌릴 수 없습니다. Stripe 대시보드에서도 확인하세요.
          </p>
        </CardContent>
      </Card>

      {/* 환불 이력 */}
      <div>
        <h3 className="text-sm font-semibold mb-3">환불 이력</h3>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>#</TableHead>
                <TableHead>사용자 ID</TableHead>
                <TableHead>금액</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>설명</TableHead>
                <TableHead>환불일시</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !refundHistory?.items?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    환불 내역이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                refundHistory?.items?.map((r, idx) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-mono text-xs">{r.userId}</TableCell>
                    <TableCell className="font-semibold">{formatKRW(r.amountKrw)}</TableCell>
                    <TableCell><StatusBadge status={r.status ?? "refunded"} /></TableCell>
                    <TableCell className="text-xs">{r.description || "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// ─── 정산 요약 탭 ─────────────────────────────────────────────────────────
function SettlementTab() {
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("month");
  const { data, isLoading } = trpc.payment.getSettlementSummary.useQuery({ period });

  const projectBreakdown = useMemo(() => {
    return [];
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">오늘</SelectItem>
            <SelectItem value="week">최근 7일</SelectItem>
            <SelectItem value="month">최근 30일</SelectItem>
            <SelectItem value="all">전체</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => exportToCSV(projectBreakdown, "정산요약")}>
          <Download className="w-4 h-4 mr-1" /> 정산 CSV
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : (
        <>
          {/* 종합 정산 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "총 수익", value: formatKRW(data?.totalRevenue), color: "text-emerald-500" },
              { label: "총 환불", value: formatKRW(data?.totalRefund), color: "text-amber-500" },
              { label: "순 수익", value: formatKRW((data?.totalRevenue ?? 0) - (data?.totalRefund ?? 0)), color: "text-blue-500" },
              { label: "결제 성공", value: `${data?.succeededCount ?? 0}건`, color: "text-foreground" },
              { label: "결제 실패", value: `${data?.failedCount ?? 0}건`, color: "text-red-500" },
              { label: "활성 구독", value: `${data?.activeSubscriptions ?? 0}명`, color: "text-foreground" },
            ].map((item) => (
              <Card key={item.label} className="border-border/50">
                <CardContent className="pt-4 pb-3">
                  <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                  <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 프로젝트별 정산 */}
          {projectBreakdown.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">프로젝트별 정산</h3>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>프로젝트</TableHead>
                      <TableHead>결제 건수</TableHead>
                      <TableHead>총 금액</TableHead>
                      <TableHead>환불 금액</TableHead>
                      <TableHead>순 수익</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectBreakdown.map((p: any) => (
                      <TableRow key={p.projectSlug}>
                        <TableCell><Badge variant="outline">{p.projectSlug}</Badge></TableCell>
                        <TableCell>{p.count}건</TableCell>
                        <TableCell className="font-semibold">{formatKRW(p.totalAmount)}</TableCell>
                        <TableCell className="text-amber-600">{formatKRW(p.refundedAmount)}</TableCell>
                        <TableCell className="font-bold text-emerald-600">
                          {formatKRW((p.totalAmount ?? 0) - (p.refundedAmount ?? 0))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────
export default function PaymentDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">결제 / 정산 관리</h1>
          <p className="text-sm text-muted-foreground">입금 명단 · 구독 현황 · 환불 처리 · 금액 정산</p>
        </div>
      </div>

      <Tabs defaultValue="payments">
        <TabsList className="mb-6 flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="payments" className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> 입금 명단
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> 구독 현황
          </TabsTrigger>
          <TabsTrigger value="refunds" className="flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" /> 환불 처리
          </TabsTrigger>
          <TabsTrigger value="settlement" className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> 정산 요약
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments"><PaymentListTab /></TabsContent>
        <TabsContent value="subscriptions"><SubscriptionTab /></TabsContent>
        <TabsContent value="refunds"><RefundTab /></TabsContent>
        <TabsContent value="settlement"><SettlementTab /></TabsContent>
      </Tabs>
    </div>
  );
}
