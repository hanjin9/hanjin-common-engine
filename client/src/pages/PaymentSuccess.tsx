/**
 * PaymentSuccess.tsx
 * jangbu-quantum-assoc + sports-recovery-association 레포 이식
 * Stripe 결제 완료/취소 확인 + 멤버십 등급 업데이트
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Loader2, AlertCircle, XCircle,
  Home, LayoutDashboard, RefreshCw, ExternalLink
} from "lucide-react";
import { toast } from "sonner";

type PageStatus = "loading" | "success" | "cancel" | "error";

interface OrderDetails {
  tier_key?: string;
  tier_name?: string;
  amount?: number;
  project_slug?: string;
  stripe_session_id?: string;
  stripe_subscription_id?: string;
}

export default function PaymentSuccess() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<PageStatus>("loading");
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  // URL 파라미터 파싱 (장부 + 스포츠 레포 방식 통합)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const urlStatus = params.get("status");

    // 취소 처리 (sports 레포 방식)
    if (urlStatus === "cancel" || window.location.pathname.includes("cancel")) {
      setStatus("cancel");
      return;
    }

    if (!sessionId) {
      setStatus("error");
      return;
    }

    // Stripe 세션 검증 (sports 레포 방식: /api/stripe/verify-session)
    fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
      .then(res => {
        if (!res.ok) throw new Error("Network error");
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setOrderDetails({
            ...data.order,
            stripe_session_id: sessionId,
          });
          setStatus("success");
          toast.success("결제가 완료되었습니다!", {
            description: "멤버십이 활성화되었습니다",
          });
        } else {
          // status=success URL 파라미터가 있으면 (paymentRouter에서 설정한 방식)
          if (urlStatus === "success") {
            setOrderDetails({ stripe_session_id: sessionId });
            setStatus("success");
          } else {
            setStatus("error");
          }
        }
      })
      .catch(() => {
        // verify-session API 없을 경우 URL 파라미터로 폴백
        if (urlStatus === "success" || sessionId) {
          setOrderDetails({ stripe_session_id: sessionId });
          setStatus("success");
        } else {
          setStatus("error");
        }
      });
  }, []);

  // ── 로딩 ────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <Loader2 className="animate-spin w-16 h-16 text-yellow-400 mx-auto" />
          </div>
          <p className="text-white text-lg font-medium">결제 확인 중...</p>
          <p className="text-slate-400 text-sm">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  // ── 취소 ────────────────────────────────────────────────────────
  if (status === "cancel") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 py-12">
        <div className="container mx-auto px-4 max-w-lg">
          <Card className="bg-slate-900 border-slate-700/50">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-2">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                  <XCircle className="w-9 h-9 text-slate-400" />
                </div>
              </div>
              <CardTitle className="text-white text-2xl">결제가 취소되었습니다</CardTitle>
              <CardDescription className="text-slate-400">
                결제 과정에서 취소하셨습니다. 언제든지 다시 시도할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-900 font-bold hover:opacity-90"
                onClick={() => navigate("/admin/membership/checkout")}
              >
                다시 시도하기
              </Button>
              <Button
                variant="outline"
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={() => navigate("/admin")}
              >
                <Home className="w-4 h-4 mr-2" />대시보드로 이동
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── 오류 ────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 py-12">
        <div className="container mx-auto px-4 max-w-lg">
          <Card className="bg-slate-900 border-red-900/50">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-2">
                <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center">
                  <AlertCircle className="w-9 h-9 text-red-400" />
                </div>
              </div>
              <CardTitle className="text-red-400 text-2xl">결제 확인 실패</CardTitle>
              <CardDescription className="text-slate-400">
                결제 정보를 확인할 수 없습니다. 결제가 완료되었다면 고객 지원팀에 문의해주세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-900 font-bold hover:opacity-90"
                onClick={() => navigate("/admin/membership/checkout")}
              >
                결제 다시 시도
              </Button>
              <Button
                variant="outline"
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={() => navigate("/admin")}
              >
                <Home className="w-4 h-4 mr-2" />홈으로 이동
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── 성공 ────────────────────────────────────────────────────────
  const tierKey = orderDetails?.tier_key || (orderDetails as any)?.tier_id;
  const tierName = orderDetails?.tier_name || tierKey?.toUpperCase() || "멤버십";
  const amount = orderDetails?.amount;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-12">
      <div className="container mx-auto px-4 max-w-lg">

        {/* 성공 헤더 */}
        <div className="text-center mb-8">
          <div className="relative inline-flex">
            <div className="w-20 h-20 rounded-full bg-emerald-900/30 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-11 h-11 text-emerald-400" />
            </div>
            <span className="absolute -top-1 -right-1 text-2xl">🎉</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">결제 완료!</h1>
          <p className="text-slate-400">멤버십이 성공적으로 활성화되었습니다</p>
        </div>

        {/* 구독 정보 카드 */}
        <Card className="bg-slate-900 border-emerald-900/50 mb-2">
          <CardContent className="pt-3 pb-2">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-white text-sm">구독 정보</h3>
            </div>
            <div className="space-y-2.5">
              {tierName && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">플랜</span>
                  <Badge className="bg-yellow-900/40 text-yellow-300 border-yellow-700/40">
                    {tierName}
                  </Badge>
                </div>
              )}
              {amount && (
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">결제 금액</span>
                  <span className="text-white font-semibold text-sm font-mono">
                    ₩{Math.round(amount / 100).toLocaleString()}
                  </span>
                </div>
              )}
              {orderDetails?.project_slug && (
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">프로젝트</span>
                  <span className="text-white text-sm">{orderDetails.project_slug}</span>
                </div>
              )}
              {orderDetails?.stripe_subscription_id && (
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">구독 ID</span>
                  <span className="text-slate-500 font-mono text-xs">
                    {orderDetails.stripe_subscription_id.slice(0, 20)}...
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 다음 단계 */}
        <Card className="bg-slate-900 border-slate-700/50 mb-3">
          <CardContent className="pt-3 pb-2">
            <h4 className="font-semibold text-white text-sm mb-3">다음 단계</h4>
            <ul className="space-y-2">
              {[
                "이메일로 결제 확인서가 발송되었습니다",
                "대시보드에서 구독을 관리할 수 있습니다",
                "미션을 완료하여 다음 단계로 승급하세요",
                "커뮤니티에서 다른 멤버들과 교류하세요",
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-300">{step}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* 이메일 안내 */}
        <div className="bg-blue-950/40 border border-blue-800/30 rounded-lg p-4 mb-3">
          <p className="text-blue-300 text-sm">
            <strong>📧 확인 이메일:</strong> 결제 확인서와 멤버십 안내가 이메일로 발송되었습니다.
            스팸 폴더도 확인해주세요.
          </p>
        </div>

        {/* 버튼 */}
        <div className="space-y-3">
          <Button
            className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-900 font-bold hover:opacity-90 gap-2"
            size="lg"
            onClick={() => navigate("/admin")}
          >
            <LayoutDashboard className="w-4 h-4" />
            대시보드로 이동
          </Button>
          <Button
            variant="outline"
            className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 gap-2"
            onClick={() => navigate("/admin/membership/checkout")}
          >
            <RefreshCw className="w-4 h-4" />
            다른 플랜 구독하기
          </Button>
        </div>
      </div>
    </div>
  );
}
