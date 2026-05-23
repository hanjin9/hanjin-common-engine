/**
 * MembershipDashboard.tsx
 * 프로젝트별 멤버십/구독 관리 대시보드
 * - GLWA: 10단계 VIP 멤버십 (Bronze → Platinum, Black Platinum 예약)
 * - 숨호흡 MVP: 5단계 구독 레벨
 * - 단계별 정책 편집 (혜택/연회비/포인트/색상/이미지)
 * - 정책 변경 이력 조회
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Crown, Users, Lock, Unlock, Pencil, History,
  ChevronDown, ChevronUp, Plus, Trash2, Image as ImageIcon,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

// ─── 프로젝트 탭 정의 ─────────────────────────────────────────────────────────
const PROJECT_TABS = [
  { slug: "glwa",            label: "GLWA VIP 멤버십",   type: "membership" as const },
  { slug: "breathing-app",  label: "숨호흡 구독 레벨", type: "subscription" as const },
  { slug: "sports-recovery",label: "스포츠회복사 자격", type: "subscription" as const },
  { slug: "bread-coach",    label: "장부관리사 자격", type: "subscription" as const },
  { slug: "glwa-community", label: "GLWA 커뮤니티",   type: "membership" as const },
];

// ─── 단계 정책 편집 모달 ──────────────────────────────────────────────────────
type TierData = {
  id?: number;
  tierOrder: number;
  tierKey: string;
  tierLabel: string;
  tierColor: string | null;
  annualFeeKrw: number | null;
  isActive: boolean | null;
  benefits: string[];
  count: number;
  percentage: number;
};

function EditTierModal({
  tier,
  projectSlug,
  open,
  onClose,
  onSaved,
}: {
  tier: TierData;
  projectSlug: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState(tier.tierLabel);
  const [color, setColor] = useState(tier.tierColor ?? "#94a3b8");
  const [fee, setFee] = useState(String(tier.annualFeeKrw ?? 0));
  const [benefits, setBenefits] = useState<string[]>(tier.benefits.length > 0 ? [...tier.benefits] : [""]);
  const [changeNote, setChangeNote] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const utils = trpc.useUtils();
  const updateMutation = trpc.projectMembership.adminUpdateTier.useMutation({
    onSuccess: () => {
      toast.success(`${label} 단계 정책이 저장되었습니다.`);
      utils.projectMembership.adminGetTierStats.invalidate({ projectSlug });
      utils.projectMembership.adminGetPolicyHistory.invalidate({ projectSlug });
      onSaved();
      onClose();
    },
    onError: (e) => toast.error(`저장 실패: ${e.message}`),
  });

  const handleSave = () => {
    if (!tier.id) { toast.error("단계 ID가 없습니다. 시드 데이터를 먼저 삽입하세요."); return; }
    const filteredBenefits = benefits.filter(b => b.trim() !== "");
    updateMutation.mutate({
      tierId: tier.id,
      tierLabel: label,
      tierColor: color,
      annualFeeKrw: Number(fee) || 0,
      benefits: filteredBenefits,
      changeNote: changeNote || undefined,
    });
  };

  const addBenefit = () => setBenefits(prev => [...prev, ""]);
  const removeBenefit = (i: number) => setBenefits(prev => prev.filter((_, idx) => idx !== i));
  const updateBenefit = (i: number, val: string) =>
    setBenefits(prev => prev.map((b, idx) => idx === i ? val : b));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded-full inline-block"
              style={{ backgroundColor: color }}
            />
            {tier.tierOrder}단계 — {tier.tierLabel} 정책 편집
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 단계명 */}
          <div className="space-y-1">
            <Label className="text-slate-300 text-xs">단계명</Label>
            <Input
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
              placeholder="예: Gold"
            />
          </div>

          {/* 색상 */}
          <div className="space-y-1">
            <Label className="text-slate-300 text-xs">단계 색상 (HEX)</Label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
              />
              <Input
                value={color}
                onChange={e => setColor(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white font-mono text-sm"
                placeholder="#D4AF37"
              />
            </div>
          </div>

          {/* 연회비/구독료 */}
          <div className="space-y-1">
            <Label className="text-slate-300 text-xs">
              연회비 / 구독료 (원, 0 = 무료)
            </Label>
            <Input
              type="number"
              value={fee}
              onChange={e => setFee(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
              placeholder="예: 1200000"
            />
            {Number(fee) > 0 && (
              <p className="text-xs text-slate-400">
                = {Number(fee).toLocaleString()}원
              </p>
            )}
          </div>

          {/* 혜택 목록 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-slate-300 text-xs">혜택 목록</Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={addBenefit}
                className="h-6 text-xs text-slate-400 hover:text-white px-2"
              >
                <Plus className="w-3 h-3 mr-1" /> 추가
              </Button>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {benefits.map((b, i) => (
                <div key={i} className="flex gap-1.5">
                  <Input
                    value={b}
                    onChange={e => updateBenefit(i, e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white text-sm h-8"
                    placeholder={`혜택 ${i + 1}`}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeBenefit(i)}
                    className="h-8 w-8 p-0 text-slate-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* 이미지 URL (나중에 업로드 연동) */}
          <div className="space-y-1">
            <Label className="text-slate-300 text-xs flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              단계 이미지 URL
              <span className="text-slate-500 font-normal">(선택 — 나중에 업로드 가능)</span>
            </Label>
            <Input
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white text-sm"
              placeholder="https://... 또는 /manus-storage/..."
            />
          </div>

          {/* 변경 사유 */}
          <div className="space-y-1">
            <Label className="text-slate-300 text-xs">변경 사유 / 메모 (선택)</Label>
            <Textarea
              value={changeNote}
              onChange={e => setChangeNote(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white text-sm resize-none"
              rows={2}
              placeholder="예: 2026년 상반기 연회비 인상"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} className="text-slate-400">
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          >
            {updateMutation.isPending ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 단계 카드 ────────────────────────────────────────────────────────────────
function TierCard({
  tier,
  projectSlug,
  type,
  onRefresh,
}: {
  tier: TierData;
  projectSlug: string;
  type: "membership" | "subscription";
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const color = tier.tierColor ?? "#94a3b8";
  const isReserved = !tier.isActive;

  return (
    <>
      <div
        className={`rounded-lg border p-3 transition-all ${
          isReserved
            ? "border-dashed border-slate-700 opacity-60"
            : "border-slate-700 hover:border-slate-500"
        }`}
        style={{ borderLeftColor: color, borderLeftWidth: 3 }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: color }}
            >
              {tier.tierOrder}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-sm text-white">{tier.tierLabel}</span>
                {isReserved && (
                  <Badge variant="outline" className="text-xs border-slate-600 text-slate-500 py-0 px-1.5">
                    <Lock className="w-2.5 h-2.5 mr-0.5" />예약
                  </Badge>
                )}
                {tier.tierOrder === 10 && type === "membership" && !isReserved && (
                  <Badge className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30 py-0 px-1.5">
                    최고
                  </Badge>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {tier.annualFeeKrw === 0
                  ? "무료"
                  : tier.annualFeeKrw
                  ? `${(tier.annualFeeKrw / 10000).toLocaleString()}만원`
                  : "-"}
                {" · "}
                <span className="text-slate-400">{tier.count.toLocaleString()}명 ({tier.percentage}%)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditOpen(true)}
              className="h-7 w-7 p-0 text-slate-400 hover:text-amber-400"
              title="정책 편집"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(v => !v)}
              className="h-7 w-7 p-0 text-slate-500 hover:text-slate-300"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {/* 분포 바 */}
        <Progress value={tier.percentage} className="h-1 mt-2 bg-slate-700" />

        {/* 혜택 펼치기 */}
        {expanded && tier.benefits.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-700/50 space-y-0.5">
            {tier.benefits.map((b, i) => (
              <div key={i} className="text-xs text-slate-400">· {b}</div>
            ))}
          </div>
        )}
        {expanded && tier.benefits.length === 0 && (
          <div className="mt-2 pt-2 border-t border-slate-700/50 text-xs text-slate-600">
            혜택 미설정 — 편집 버튼으로 추가하세요
          </div>
        )}
      </div>

      {editOpen && (
        <EditTierModal
          tier={tier}
          projectSlug={projectSlug}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={onRefresh}
        />
      )}
    </>
  );
}

// ─── 정책 변경 이력 패널 ──────────────────────────────────────────────────────
function PolicyHistoryPanel({ projectSlug }: { projectSlug: string }) {
  const { data: history, isLoading } = trpc.projectMembership.adminGetPolicyHistory.useQuery(
    { projectSlug, limit: 30 },
    { retry: 1 }
  );

  if (isLoading) return <Skeleton className="h-40 bg-slate-800 rounded-lg" />;

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500 text-sm">
        아직 정책 변경 이력이 없습니다.
      </div>
    );
  }

  const changeTypeLabel: Record<string, string> = {
    benefits_update: "혜택 수정",
    fee_update: "연회비 수정",
    point_threshold: "포인트 임계값",
    color_update: "색상 수정",
    label_update: "단계명 수정",
    status_toggle: "활성/비활성",
    policy_note: "정책 메모",
    full_update: "전체 수정",
  };

  return (
    <div className="space-y-2">
      {history.map((h) => (
        <div key={h.id} className="rounded-lg border border-slate-700 p-3 text-sm">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                {changeTypeLabel[h.changeType] ?? h.changeType}
              </Badge>
              <span className="font-medium text-white">{h.tierLabel}</span>
              <span className="text-slate-500 text-xs">({h.tierKey})</span>
            </div>
            <span className="text-xs text-slate-500 flex-shrink-0">
              {new Date(h.createdAt).toLocaleString("ko-KR")}
            </span>
          </div>
          {h.changeNote && (
            <p className="text-xs text-slate-400 mt-1">메모: {h.changeNote}</p>
          )}
          <div className="mt-1.5 grid grid-cols-2 gap-2 text-xs">
            {h.previousValue && (
              <div className="bg-red-900/20 rounded p-1.5 text-red-300">
                <span className="text-slate-500 block mb-0.5">변경 전</span>
                <pre className="whitespace-pre-wrap break-all text-xs">
                  {typeof h.previousValue === "object"
                    ? JSON.stringify(h.previousValue, null, 2)
                    : String(h.previousValue)}
                </pre>
              </div>
            )}
            <div className="bg-emerald-900/20 rounded p-1.5 text-emerald-300">
              <span className="text-slate-500 block mb-0.5">변경 후</span>
              <pre className="whitespace-pre-wrap break-all text-xs">
                {typeof h.newValue === "object"
                  ? JSON.stringify(h.newValue, null, 2)
                  : String(h.newValue)}
              </pre>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 프로젝트 멤버십 패널 ─────────────────────────────────────────────────────
function ProjectMembershipPanel({
  projectSlug,
  type,
}: {
  projectSlug: string;
  type: "membership" | "subscription";
}) {
  const [view, setView] = useState<"tiers" | "history">("tiers");
  const utils = trpc.useUtils();

  const { data: stats, isLoading, refetch } = trpc.projectMembership.adminGetTierStats.useQuery(
    { projectSlug },
    { retry: 1 }
  );

  // 시드 삽입 (최초 1회)
  const seedMutation = trpc.projectMembership.adminSeedTiers.useMutation({
    onSuccess: (res) => {
      toast.success(res.message);
      refetch();
    },
    onError: (e) => toast.error(`시드 삽입 실패: ${e.message}`),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg bg-slate-800" />
        ))}
      </div>
    );
  }

  const handleRefresh = () => {
    utils.projectMembership.adminGetTierStats.invalidate({ projectSlug });
  };

  return (
    <div className="space-y-2">
      {/* 뷰 전환 + 시드 버튼 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={view === "tiers" ? "default" : "ghost"}
            onClick={() => setView("tiers")}
            className="h-7 text-xs"
          >
            <Unlock className="w-3 h-3 mr-1" />단계 목록
          </Button>
          <Button
            size="sm"
            variant={view === "history" ? "default" : "ghost"}
            onClick={() => setView("history")}
            className="h-7 text-xs"
          >
            <History className="w-3 h-3 mr-1" />변경 이력
          </Button>
        </div>

        {!stats && (
          <Button
            size="sm"
            onClick={() => seedMutation.mutate({ projectSlug: projectSlug as "glwa" | "breathing-app", force: false })}
            disabled={seedMutation.isPending}
            className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
          >
            {seedMutation.isPending ? "삽입 중..." : "초기 데이터 삽입"}
          </Button>
        )}

        {stats && (
          <div className="text-xs text-slate-400">
            전체 {stats.totalMembers.toLocaleString()}명 ·{" "}
            {stats.tierDistribution.filter(t => t.isActive).length}단계 운영
          </div>
        )}
      </div>

      {/* 단계 목록 뷰 */}
      {view === "tiers" && (
        <>
          {!stats ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              단계 데이터가 없습니다. 위 버튼으로 초기 데이터를 삽입하세요.
            </div>
          ) : (
            <div className="space-y-2">
              {stats.tierDistribution.map((tier) => (
                <TierCard
                  key={tier.tierKey}
                  tier={tier}
                  projectSlug={projectSlug}
                  type={type}
                  onRefresh={handleRefresh}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* 변경 이력 뷰 */}
      {view === "history" && (
        <PolicyHistoryPanel projectSlug={projectSlug} />
      )}
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────
export default function MembershipDashboard() {
  const [activeTab, setActiveTab] = useState(PROJECT_TABS[0].slug);

  return (
    <DashboardLayout>
      <div className="p-3 md:p-4 space-y-3">
        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <Crown className="w-5 h-5 text-amber-400" />
          <div>
            <h1 className="text-lg font-bold text-white">멤버십 / 구독 관리</h1>
            <p className="text-xs text-slate-400">
              프로젝트별 독립 단계 · 정책 편집 · 변경 이력
            </p>
          </div>
        </div>

        {/* 프로젝트별 탭 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800 border border-slate-700">
            {PROJECT_TABS.map((tab) => (
              <TabsTrigger
                key={tab.slug}
                value={tab.slug}
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 text-sm"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {PROJECT_TABS.map((tab) => (
            <TabsContent key={tab.slug} value={tab.slug} className="mt-4">
              <ProjectMembershipPanel projectSlug={tab.slug} type={tab.type} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
