/**
 * CopyEditor.tsx
 * 멤버십 카피라이팅 문구 관리자 편집 페이지
 * - 앱/웹 멤버십 소개 페이지에 표시될 문구를 관리자가 직접 편집
 * - 슬로건, 소개 문구, 단계별 태그라인 등
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Pencil, Check, X, Plus, FileText, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const PROJECT_TABS = [
  { slug: "glwa",          label: "GLWA 멤버십" },
  { slug: "breathing-app", label: "숨호흡 앱" },
];

// 카피 키 한글 레이블 맵
const COPY_KEY_LABELS: Record<string, string> = {
  main_slogan:              "메인 슬로건",
  sub_slogan:               "서브 슬로건",
  intro_text:               "소개 문구 (1줄)",
  cta_button:               "CTA 버튼 텍스트",
  cta_sub:                  "CTA 서브 텍스트",
  tier_bronze_tagline:        "Bronze 태그라인",
  tier_silver_tagline:        "Silver 태그라인",
  tier_gold_tagline:          "Gold 태그라인",
  tier_emerald_tagline:       "Emerald 태그라인",
  tier_green_emerald_tagline: "Green Emerald 태그라인",
  tier_sapphire_tagline:      "Sapphire 태그라인",
  tier_blue_sapphire_tagline: "Blue Sapphire 태그라인",
  tier_diamond_tagline:       "Diamond 태그라인",
  tier_blue_diamond_tagline:  "Blue Diamond 태그라인",
  tier_platinum_tagline:      "Platinum 태그라인",
  tier_black_platinum_tagline:"Black Platinum 태그라인",
};

// ─── 인라인 편집 행 ────────────────────────────────────────────────────────────
function CopyRow({
  item,
  projectSlug,
  onSaved,
}: {
  item: {
    id: number;
    copyKey: string;
    copyText: string;
    isActive: boolean | null;
    sortOrder: number | null;
    updatedBy: string | null;
    updatedAt: Date | null;
  };
  projectSlug: string;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.copyText);
  const utils = trpc.useUtils();

  const updateMutation = trpc.copy.adminUpdate.useMutation({
    onSuccess: () => {
      toast.success("저장되었습니다.");
      utils.copy.adminGetAll.invalidate({ projectSlug });
      setEditing(false);
      onSaved();
    },
    onError: (e) => toast.error(`저장 실패: ${e.message}`),
  });

  const label = COPY_KEY_LABELS[item.copyKey] ?? item.copyKey;
  const isTierTagline = item.copyKey.startsWith("tier_");

  return (
    <div className={`rounded-lg border p-3 ${item.isActive ? "border-slate-700" : "border-slate-800 opacity-50"}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-slate-300">{label}</span>
            {isTierTagline && (
              <Badge variant="outline" className="text-xs border-slate-600 text-slate-500 py-0 px-1.5">
                단계 태그라인
              </Badge>
            )}
            {!item.isActive && (
              <Badge variant="outline" className="text-xs border-red-800 text-red-500 py-0 px-1.5">
                비활성
              </Badge>
            )}
          </div>

          {editing ? (
            <div className="space-y-2">
              {item.copyText.length > 60 ? (
                <Textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white text-sm resize-none"
                  rows={3}
                  autoFocus
                />
              ) : (
                <Input
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white text-sm"
                  autoFocus
                />
              )}
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  onClick={() => updateMutation.mutate({ id: item.id, copyText: draft })}
                  disabled={updateMutation.isPending || draft === item.copyText}
                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="w-3 h-3 mr-1" />
                  {updateMutation.isPending ? "저장 중..." : "저장"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setDraft(item.copyText); setEditing(false); }}
                  className="h-7 text-xs text-slate-400"
                >
                  <X className="w-3 h-3 mr-1" />취소
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-white leading-relaxed">{item.copyText}</p>
          )}

          {item.updatedBy && !editing && (
            <p className="text-xs text-slate-600 mt-1">
              최종 수정: {item.updatedBy} · {item.updatedAt ? new Date(item.updatedAt).toLocaleString("ko-KR") : "-"}
            </p>
          )}
        </div>

        {!editing && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditing(true)}
            className="h-7 w-7 p-0 text-slate-500 hover:text-amber-400 flex-shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── 새 문구 추가 폼 ──────────────────────────────────────────────────────────
function AddCopyForm({ projectSlug, onAdded }: { projectSlug: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [text, setText] = useState("");
  const utils = trpc.useUtils();

  const createMutation = trpc.copy.adminCreate.useMutation({
    onSuccess: () => {
      toast.success("문구가 추가되었습니다.");
      utils.copy.adminGetAll.invalidate({ projectSlug });
      setKey(""); setText(""); setOpen(false);
      onAdded();
    },
    onError: (e) => toast.error(`추가 실패: ${e.message}`),
  });

  if (!open) {
    return (
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setOpen(true)}
        className="h-8 text-xs text-slate-400 hover:text-white border border-dashed border-slate-700 w-full"
      >
        <Plus className="w-3 h-3 mr-1" />새 문구 추가
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-slate-600 p-3 space-y-2">
      <Input
        value={key}
        onChange={e => setKey(e.target.value)}
        className="bg-slate-800 border-slate-600 text-white text-sm"
        placeholder="문구 키 (예: tier_vip_tagline)"
      />
      <Textarea
        value={text}
        onChange={e => setText(e.target.value)}
        className="bg-slate-800 border-slate-600 text-white text-sm resize-none"
        rows={2}
        placeholder="문구 내용"
      />
      <div className="flex gap-1.5">
        <Button
          size="sm"
          onClick={() => createMutation.mutate({ projectSlug, copyKey: key, copyText: text })}
          disabled={!key.trim() || !text.trim() || createMutation.isPending}
          className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
        >
          {createMutation.isPending ? "추가 중..." : "추가"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} className="h-7 text-xs text-slate-400">
          취소
        </Button>
      </div>
    </div>
  );
}

// ─── 프로젝트별 카피 패널 ─────────────────────────────────────────────────────
function CopyPanel({ projectSlug }: { projectSlug: string }) {
  const utils = trpc.useUtils();
  const { data, isLoading, refetch } = trpc.copy.adminGetAll.useQuery(
    { projectSlug },
    { retry: 1 }
  );

  const seedMutation = trpc.copy.adminSeedCopy.useMutation({
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
    utils.copy.adminGetAll.invalidate({ projectSlug });
  };

  return (
    <div className="space-y-3">
      {/* 상단 액션 */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{data?.length ?? 0}개 문구</span>
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => refetch()}
            className="h-7 text-xs text-slate-400"
          >
            <RefreshCw className="w-3 h-3 mr-1" />새로고침
          </Button>
          {(!data || data.length === 0) && (
            <Button
              size="sm"
              onClick={() => seedMutation.mutate({ projectSlug: projectSlug as "glwa" | "breathing-app", force: false })}
              disabled={seedMutation.isPending}
              className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
            >
              {seedMutation.isPending ? "삽입 중..." : "초기 문구 삽입"}
            </Button>
          )}
        </div>
      </div>

      {/* 문구 목록 */}
      {!data || data.length === 0 ? (
        <div className="text-center py-10 text-slate-500 text-sm">
          문구 데이터가 없습니다. 위 버튼으로 초기 데이터를 삽입하세요.
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((item) => (
            <CopyRow
              key={item.id}
              item={item}
              projectSlug={projectSlug}
              onSaved={handleRefresh}
            />
          ))}
        </div>
      )}

      {/* 새 문구 추가 */}
      <AddCopyForm projectSlug={projectSlug} onAdded={handleRefresh} />
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────
export default function CopyEditor() {
  const [activeTab, setActiveTab] = useState(PROJECT_TABS[0].slug);

  return (
    <DashboardLayout>
      <div className="p-3 md:p-4 space-y-3">
        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-400" />
          <div>
            <h1 className="text-lg font-bold text-white">카피라이팅 문구 편집</h1>
            <p className="text-xs text-slate-400">
              앱/웹 멤버십 소개 페이지에 표시될 슬로건 · 소개 문구 · 단계별 태그라인
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
              <CopyPanel projectSlug={tab.slug} />
            </TabsContent>
          ))}
        </Tabs>

        {/* 안내 */}
        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardContent className="p-3">
            <p className="text-xs text-slate-500">
              편집한 문구는 즉시 DB에 저장되며, 앱/웹 멤버십 소개 페이지에 실시간 반영됩니다.
              단계별 태그라인(tier_*_tagline)은 각 멤버십 단계 카드에 표시됩니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
