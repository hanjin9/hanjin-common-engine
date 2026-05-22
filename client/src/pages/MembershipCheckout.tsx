/**
 * MembershipCheckout.tsx
 * 3개 레포 (jangbu-quantum-assoc, glwa-wellness-app, sports-recovery-association)
 * 결제 모듈 정수 이식 + 한진 공통 엔진 11단계 완전 통합
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  CheckCircle2, Lock, Shield, Loader2, CreditCard,
  Star, Zap, Crown, Gem, ChevronRight
} from "lucide-react";

// ─── 11단계 멤버십 정의 (jangbu + sports 레포 구조 + 한진 스펙 완전 통합) ─────
const MEMBERSHIP_TIERS = [
  {
    key: "bronze",
    name: "브론즈",
    nameEn: "Bronze",
    amountKrw: 29000,
    color: "from-orange-700 to-orange-900",
    borderColor: "border-orange-700/40",
    badgeColor: "bg-orange-900/30 text-orange-300",
    icon: "🥉",
    period: "월",
    features: ["기초 콘텐츠 접근", "커뮤니티 열람", "일일 미션 5개", "기본 AI 피드백"],
    daysRequired: 0,
  },
  {
    key: "silver",
    name: "실버",
    nameEn: "Silver",
    amountKrw: 49000,
    color: "from-slate-400 to-slate-600",
    borderColor: "border-slate-400/40",
    badgeColor: "bg-slate-700/30 text-slate-300",
    icon: "🥈",
    period: "월",
    features: ["Bronze 전체 포함", "고급 호흡 콘텐츠", "신체 매핑 도구", "주간 리포트"],
    daysRequired: 10,
  },
  {
    key: "gold",
    name: "골드",
    nameEn: "Gold",
    amountKrw: 79000,
    color: "from-yellow-500 to-yellow-700",
    borderColor: "border-yellow-500/40",
    badgeColor: "bg-yellow-900/30 text-yellow-300",
    icon: "🥇",
    period: "월",
    popular: true,
    features: ["Silver 전체 포함", "AI 맞춤 코칭", "무제한 미션", "수면 추적", "전문가 피드백"],
    daysRequired: 30,
  },
  {
    key: "emerald",
    name: "에메랄드",
    nameEn: "Emerald",
    amountKrw: 99000,
    color: "from-emerald-500 to-emerald-700",
    borderColor: "border-emerald-500/40",
    badgeColor: "bg-emerald-900/30 text-emerald-300",
    icon: "💚",
    period: "월",
    features: ["Gold 전체 포함", "그룹 코칭 참여", "고급 생체 분석", "커뮤니티 글쓰기"],
    daysRequired: 60,
  },
  {
    key: "green_emerald",
    name: "그린에메랄드",
    nameEn: "Green Emerald",
    amountKrw: 129000,
    color: "from-green-400 to-green-600",
    borderColor: "border-green-400/40",
    badgeColor: "bg-green-900/30 text-green-300",
    icon: "🌿",
    period: "월",
    features: ["Emerald 전체 포함", "강의 진행 권한", "회원 상담 진행", "월간 워크숍"],
    daysRequired: 90,
  },
  {
    key: "sapphire",
    name: "사파이어",
    nameEn: "Sapphire",
    amountKrw: 159000,
    color: "from-blue-500 to-blue-700",
    borderColor: "border-blue-500/40",
    badgeColor: "bg-blue-900/30 text-blue-300",
    icon: "💎",
    period: "월",
    features: ["Green Emerald 전체 포함", "수료증 발급 권한", "프리미엄 커뮤니티", "분기 세미나"],
    daysRequired: 120,
  },
  {
    key: "blue_sapphire",
    name: "블루사파이어",
    nameEn: "Blue Sapphire",
    amountKrw: 199000,
    color: "from-indigo-500 to-indigo-700",
    borderColor: "border-indigo-500/40",
    badgeColor: "bg-indigo-900/30 text-indigo-300",
    icon: "🔵",
    period: "월",
    features: ["Sapphire 전체 포함", "1:1 전문가 멘토링", "전담 매니저", "우선 지원 1시간"],
    daysRequired: 150,
  },
  {
    key: "diamond",
    name: "다이아몬드",
    nameEn: "Diamond",
    amountKrw: 259000,
    color: "from-cyan-300 to-cyan-500",
    borderColor: "border-cyan-300/40",
    badgeColor: "bg-cyan-900/30 text-cyan-300",
    icon: "💠",
    period: "월",
    features: ["Blue Sapphire 전체 포함", "마스터 커뮤니티", "최고 수준 교육", "월간 마스터 세미나"],
    daysRequired: 180,
  },
  {
    key: "blue_diamond",
    name: "블루다이아몬드",
    nameEn: "Blue Diamond",
    amountKrw: 329000,
    color: "from-sky-400 to-blue-600",
    borderColor: "border-sky-400/40",
    badgeColor: "bg-sky-900/30 text-sky-300",
    icon: "🌊",
    period: "월",
    features: ["Diamond 전체 포함", "무제한 상담 + 비디오", "협회 이벤트 기획 참여", "자격증 지원"],
    daysRequired: 210,
  },
  {
    key: "platinum",
    name: "플래티넘",
    nameEn: "Platinum",
    amountKrw: 429000,
    color: "from-gray-300 to-gray-500",
    borderColor: "border-gray-300/40",
    badgeColor: "bg-gray-700/30 text-gray-200",
    icon: "⚡",
    period: "월",
    features: ["Blue Diamond 전체 포함", "협회 운영 참여", "회원 관리 권한", "통계·분석 대시보드"],
    daysRequired: 270,
  },
  {
    key: "black_platinum",
    name: "블랙플래티넘",
    nameEn: "Black Platinum",
    amountKrw: 599000,
    color: "from-gray-800 to-black",
    borderColor: "border-yellow-500/40",
    badgeColor: "bg-yellow-900/30 text-yellow-300",
    icon: "👑",
    period: "월",
    features: ["Platinum 전체 포함", "VIP 전용 커뮤니티", "협회장 직접 멘토링", "시스템 설정 관리", "수익 배분 참여"],
    daysRequired: 365,
  },
] as const;

type TierKey = typeof MEMBERSHIP_TIERS[number]["key"];

const PROJECT_OPTIONS = [
  { slug: "glwa-franchise", name: "GLWA 프랜차이즈" },
  { slug: "glwa-community", name: "GLWA 커뮤니티" },
  { slug: "breathing-app", name: "숨호흡 앱" },
  { slug: "sports-recovery", name: "스포츠회복사" },
  { slug: "accounting", name: "장부관리사협회" },
];

export default function MembershipCheckout() {
  const [, navigate] = useLocation();
  const [selectedProject, setSelectedProject] = useState("glwa-franchise");
  const [selectedTier, setSelectedTier] = useState<TierKey | null>(null);
  const [processingTier, setProcessingTier] = useState<TierKey | null>(null);
  const [paymentMode, setPaymentMode] = useState<"subscription" | "payment">("subscription");

  const createCheckoutSession = trpc.payment.createCheckoutSession.useMutation({
    onSuccess: ({ checkoutUrl }) => {
      if (checkoutUrl) {
        // 장부 레포 방식: 새 탭에서 Stripe 결제 페이지 열기
        window.open(checkoutUrl, "_blank");
        toast.success("Stripe 결제 페이지로 이동합니다", {
          description: "새 탭에서 결제를 완료해주세요",
        });
      }
    },
    onError: (err) => {
      toast.error("결제 세션 생성 실패", { description: err.message });
    },
    onSettled: () => {
      setProcessingTier(null);
    },
  });

  const handleCheckout = (tierKey: TierKey) => {
    const tier = MEMBERSHIP_TIERS.find(t => t.key === tierKey);
    if (!tier) return;

    setProcessingTier(tierKey);
    createCheckoutSession.mutate({
      projectSlug: selectedProject,
      tierKey: tier.key,
      tierName: `${tier.name} (${tier.nameEn})`,
      amountKrw: tier.amountKrw,
      mode: paymentMode,
    });
  };

  const selectedTierData = selectedTier
    ? MEMBERSHIP_TIERS.find(t => t.key === selectedTier)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-10">
      <div className="container mx-auto px-4 max-w-7xl">

        {/* ── 헤더 ─────────────────────────────────────────── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-4 py-1.5 rounded-full text-yellow-400 text-sm font-medium mb-4">
            <Crown className="w-4 h-4" /> 한진 공통 엔진 · 11단계 멤버십 시스템
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            멤버십 선택
          </h1>
          <p className="text-slate-400 text-lg">
            브론즈에서 블랙플래티넘까지 — 당신의 여정을 시작하세요
          </p>
        </div>

        {/* ── 프로젝트 + 결제 방식 선택 ─────────────────────── */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">프로젝트:</span>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {PROJECT_OPTIONS.map(p => (
                  <SelectItem key={p.slug} value={p.slug} className="text-white hover:bg-slate-700">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">결제 방식:</span>
            <Select value={paymentMode} onValueChange={(v: any) => setPaymentMode(v)}>
              <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="subscription" className="text-white">월간 구독</SelectItem>
                <SelectItem value="payment" className="text-white">일회성 결제</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── 11단계 티어 그리드 ─────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {MEMBERSHIP_TIERS.map((tier) => {
            const isSelected = selectedTier === tier.key;
            const isProcessing = processingTier === tier.key;

            return (
              <Card
                key={tier.key}
                className={`relative bg-slate-900/80 cursor-pointer transition-all duration-200 overflow-hidden
                  ${isSelected
                    ? "ring-2 ring-yellow-400 border-yellow-400/50 scale-[1.02]"
                    : `border ${tier.borderColor} hover:border-yellow-500/50 hover:scale-[1.01]`
                  }`}
                onClick={() => setSelectedTier(tier.key)}
              >
                {(tier as any).popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-900 text-xs font-bold px-3 py-1">
                    <Star className="w-3 h-3 inline mr-1" />인기
                  </div>
                )}

                {/* 그라디언트 상단 바 */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${tier.color}`} />

                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{tier.icon}</span>
                    <div>
                      <CardTitle className="text-white text-base">{tier.name}</CardTitle>
                      <p className="text-slate-500 text-xs">{tier.nameEn}</p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-bold text-white">
                      ₩{tier.amountKrw.toLocaleString()}
                    </span>
                    <span className="text-slate-400 text-sm">/{tier.period}</span>
                  </div>
                  {tier.daysRequired > 0 && (
                    <Badge className={`w-fit text-xs mt-1 ${tier.badgeColor} border-0`}>
                      {tier.daysRequired}일+ 수련 후 승급
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="space-y-3">
                  <ul className="space-y-1.5">
                    {tier.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-slate-300">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full text-sm font-semibold bg-gradient-to-r ${tier.color} 
                      text-white border-0 hover:opacity-90 transition-opacity`}
                    onClick={(e) => { e.stopPropagation(); handleCheckout(tier.key); }}
                    disabled={isProcessing || createCheckoutSession.isPending}
                  >
                    {isProcessing ? (
                      <><Loader2 className="animate-spin w-4 h-4 mr-1.5" />처리 중...</>
                    ) : (
                      <><CreditCard className="w-4 h-4 mr-1.5" />선택하기</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── 선택된 티어 요약 카드 ───────────────────────────── */}
        {selectedTierData && (
          <div className="max-w-2xl mx-auto mb-8">
            <Card className="bg-slate-800/60 border-yellow-500/30">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedTierData.icon}</span>
                    <div>
                      <p className="text-white font-bold text-lg">{selectedTierData.name} 플랜</p>
                      <p className="text-slate-400 text-sm">
                        {PROJECT_OPTIONS.find(p => p.slug === selectedProject)?.name} ·{" "}
                        {paymentMode === "subscription" ? "월간 구독" : "일회성 결제"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-yellow-400">
                      ₩{selectedTierData.amountKrw.toLocaleString()}
                    </span>
                    <Button
                      size="lg"
                      className={`bg-gradient-to-r ${selectedTierData.color} text-white font-bold border-0 hover:opacity-90 gap-2`}
                      onClick={() => handleCheckout(selectedTierData.key)}
                      disabled={processingTier === selectedTierData.key || createCheckoutSession.isPending}
                    >
                      {processingTier === selectedTierData.key ? (
                        <><Loader2 className="animate-spin w-4 h-4" />처리 중...</>
                      ) : (
                        <>결제하기 <ChevronRight className="w-4 h-4" /></>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── 보안 안내 (jangbu 레포 이식) ────────────────────── */}
        <div className="max-w-3xl mx-auto">
          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span className="text-white font-semibold text-sm">안전한 결제 보장</span>
                <span className="text-slate-500 text-xs">Stripe 보안 결제 · PCI DSS 준수</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Lock, title: "256-bit SSL", desc: "모든 거래 암호화" },
                  { icon: Shield, title: "PCI DSS 준수", desc: "국제 보안 기준" },
                  { icon: CheckCircle2, title: "언제든 취소", desc: "위험 없는 구독" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <item.icon className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-white text-xs font-semibold">{item.title}</p>
                      <p className="text-slate-500 text-xs">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── FAQ (장부 레포 이식) ────────────────────────────── */}
        <div className="max-w-3xl mx-auto mt-8 space-y-3">
          {[
            { q: "언제부터 결제가 시작되나요?", a: "결제 완료 후 즉시 해당 멤버십 권한이 활성화됩니다. 월간 구독은 매월 같은 날짜에 자동 갱신됩니다." },
            { q: "업그레이드/다운그레이드가 가능한가요?", a: "언제든지 관리자 대시보드에서 플랜을 변경할 수 있습니다. 차액은 일할 계산으로 자동 처리됩니다." },
            { q: "환불 정책은 어떻게 되나요?", a: "결제 후 7일 이내 미이용 시 전액 환불 가능합니다. 이후에는 잔여 기간에 대해 비례 환불됩니다." },
          ].map((faq, i) => (
            <Card key={i} className="bg-slate-800/40 border-slate-700/40">
              <CardContent className="pt-4 pb-3">
                <p className="text-white text-sm font-semibold mb-1">{faq.q}</p>
                <p className="text-slate-400 text-xs leading-relaxed">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── 하단 버튼 ──────────────────────────────────────── */}
        <div className="text-center mt-8">
          <Button variant="ghost" className="text-slate-500 hover:text-slate-300" onClick={() => navigate("/admin")}>
            나중에 하기
          </Button>
        </div>
      </div>
    </div>
  );
}
