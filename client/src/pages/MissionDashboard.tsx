/**
 * MissionDashboard.tsx — 미션 관리 페이지
 * - 슬롯머신 스타일 미션 선택
 * - 정기 발송 (하루 2회) + 즉석 발송
 * - 미션 CRUD + 완료 현황
 */
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Target, Zap, Clock, Plus, Edit2, Trash2,
  Play, RotateCcw, CheckCircle2, Activity,
  Wind, Dumbbell, Moon, Apple, Brain, HelpCircle, Settings
} from "lucide-react";
import GlwaMissionSlotMachine from "@/components/mission/MissionSlotMachine";
import GlwaRequiredMissions from "@/components/mission/RequiredMissions";

// ─── 미션 카테고리 ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "breathing", label: "호흡 수련", icon: Wind, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950" },
  { value: "exercise", label: "운동", icon: Dumbbell, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950" },
  { value: "sleep", label: "수면", icon: Moon, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950" },
  { value: "nutrition", label: "영양", icon: Apple, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950" },
  { value: "meditation", label: "명상", icon: Brain, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950" },
  { value: "quiz", label: "퀴즈", icon: HelpCircle, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950" },
  { value: "custom", label: "커스텀", icon: Settings, color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-900" },
];

const getCatInfo = (val: string) => CATEGORIES.find(c => c.value === val) ?? CATEGORIES[6];

// ─── 슬롯머신 컴포넌트 ─────────────────────────────────────────────────────────
function SlotMachine({ missions, onSelect }: { missions: any[]; onSelect: (m: any) => void }) {
  const [spinning, setSpinning] = useState(false);
  const [displayIdx, setDisplayIdx] = useState(0);
  const [selected, setSelected] = useState<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const spin = () => {
    if (!missions.length) return;
    setSpinning(true);
    setSelected(null);
    let count = 0;
    intervalRef.current = setInterval(() => {
      setDisplayIdx(Math.floor(Math.random() * missions.length));
      count++;
      if (count > 20) {
        clearInterval(intervalRef.current!);
        const finalIdx = Math.floor(Math.random() * missions.length);
        setDisplayIdx(finalIdx);
        setSelected(missions[finalIdx]);
        setSpinning(false);
      }
    }, 80);
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const current = missions[displayIdx];
  const cat = current ? getCatInfo(current.category) : null;
  const CatIcon = cat?.icon ?? Target;

  return (
    <Card className="border-orange-200 dark:border-orange-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="h-4 w-4 text-orange-500" />
          슬롯 미션 선택기
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 슬롯 디스플레이 */}
        <div className={`relative rounded-xl border-2 p-6 text-center transition-all duration-100 ${
          spinning ? "border-orange-400 bg-orange-50 dark:bg-orange-950 animate-pulse" : "border-orange-200 dark:border-orange-800"
        }`}>
          {current ? (
            <>
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${cat?.bg}`}>
                <CatIcon className={`h-6 w-6 ${cat?.color}`} />
              </div>
              <p className={`text-lg font-bold transition-all ${spinning ? "blur-sm" : ""}`}>
                {current.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{cat?.label} · {current.durationMinutes}분 · {current.pointsReward}P</p>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">미션을 추가하고 슬롯을 돌려보세요</p>
          )}
        </div>

        {/* 버튼 */}
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-orange-600 hover:bg-orange-700"
            onClick={spin}
            disabled={spinning || !missions.length}
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${spinning ? "animate-spin" : ""}`} />
            {spinning ? "돌리는 중..." : "슬롯 돌리기"}
          </Button>
          {selected && (
            <Button
              variant="outline"
              className="flex-1 border-orange-300 text-orange-700"
              onClick={() => onSelect(selected)}
            >
              <Zap className="h-4 w-4 mr-2" />
              이 미션 발송
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── 미션 생성/수정 다이얼로그 ─────────────────────────────────────────────────
function MissionDialog({
  open, onClose, editMission, onSaved
}: { open: boolean; onClose: () => void; editMission?: any; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: "", description: "", missionType: "optional" as "scheduled" | "optional",
    category: "breathing", pointsReward: 10, scheduledTime: "08:00",
    scheduledDays: "1,2,3,4,5", durationMinutes: 10, isActive: true,
  });

  useEffect(() => {
    if (editMission) {
      setForm({
        title: editMission.title ?? "",
        description: editMission.description ?? "",
        missionType: editMission.missionType ?? "optional",
        category: editMission.category ?? "breathing",
        pointsReward: editMission.pointsReward ?? 10,
        scheduledTime: editMission.scheduledTime ?? "08:00",
        scheduledDays: editMission.scheduledDays ?? "1,2,3,4,5",
        durationMinutes: editMission.durationMinutes ?? 10,
        isActive: editMission.isActive ?? true,
      });
    } else {
      setForm({ title: "", description: "", missionType: "optional", category: "breathing", pointsReward: 10, scheduledTime: "08:00", scheduledDays: "1,2,3,4,5", durationMinutes: 10, isActive: true });
    }
  }, [editMission, open]);

  const createMission = trpc.mission.create.useMutation({ onSuccess: () => { toast.success("미션이 생성되었습니다"); onSaved(); onClose(); } });
  const updateMission = trpc.mission.update.useMutation({ onSuccess: () => { toast.success("미션이 수정되었습니다"); onSaved(); onClose(); } });

  const handleSave = () => {
    if (!form.title.trim()) { toast.error("미션 제목을 입력하세요"); return; }
    const VALID_CATS = ["breathing", "exercise", "sleep", "nutrition", "meditation", "quiz", "custom"] as const;
    type Cat = typeof VALID_CATS[number];
    const safeCat: Cat = (VALID_CATS as readonly string[]).includes(form.category) ? form.category as Cat : "custom";
    const safeForm = { ...form, category: safeCat };
    if (editMission) {
      updateMission.mutate({ id: editMission.id, ...safeForm });
    } else {
      createMission.mutate({ ...safeForm, projectSlug: "all" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editMission ? "미션 수정" : "새 미션 추가"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs">미션 제목 *</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="예: 4-7-8 호흡법 10분" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">설명</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="미션 상세 설명" className="mt-1 h-20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">카테고리</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">미션 유형</Label>
              <Select value={form.missionType} onValueChange={v => setForm(f => ({ ...f, missionType: v as "scheduled" | "optional" }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">정기 발송</SelectItem>
                  <SelectItem value="optional">선택 미션</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">포인트 보상</Label>
              <Input type="number" value={form.pointsReward} onChange={e => setForm(f => ({ ...f, pointsReward: Number(e.target.value) }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">소요 시간(분)</Label>
              <Input type="number" value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))} className="mt-1" />
            </div>
          </div>
          {form.missionType === "scheduled" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">발송 시간</Label>
                <Input type="time" value={form.scheduledTime} onChange={e => setForm(f => ({ ...f, scheduledTime: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">발송 요일 (1=월~7=일)</Label>
                <Input value={form.scheduledDays} onChange={e => setForm(f => ({ ...f, scheduledDays: e.target.value }))} placeholder="1,2,3,4,5" className="mt-1" />
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
            <Label className="text-xs">활성화</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSave} disabled={createMission.isPending || updateMission.isPending} className="bg-orange-600 hover:bg-orange-700">
            {editMission ? "수정 완료" : "미션 추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function MissionDashboard() {
  const [activeTab, setActiveTab] = useState("list");
  const [showCreate, setShowCreate] = useState(false);
  const [editMission, setEditMission] = useState<any>(null);
  const [sendTarget, setSendTarget] = useState<any>(null);

  const { data: missionData, refetch } = trpc.mission.list.useQuery({ projectSlug: "all", page: 1, pageSize: 50 });
  const missions = missionData?.items ?? [];

  const sendMission = trpc.mission.sendInstant.useMutation({
    onSuccess: () => { toast.success("미션이 즉시 발송되었습니다!"); setSendTarget(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMission = trpc.mission.delete.useMutation({
    onSuccess: () => { toast.success("미션이 삭제되었습니다"); refetch(); },
  });

  const scheduledMissions = missions.filter((m: any) => m.missionType === "scheduled");
  const optionalMissions = missions.filter((m: any) => m.missionType === "optional");

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 pb-16">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-orange-500" /> 미션 관리
          </h1>
          <p className="text-sm text-muted-foreground">슬롯 선택 · 정기 발송 · 즉석 발송 · 완료 현황</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4 mr-2" /> 미션 추가
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">전체 미션</p><p className="text-2xl font-bold text-orange-600">{missions.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">정기 발송</p><p className="text-2xl font-bold text-blue-600">{scheduledMissions.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">선택 미션</p><p className="text-2xl font-bold text-purple-600">{optionalMissions.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">활성 미션</p><p className="text-2xl font-bold text-green-600">{missions.filter((m: any) => m.isActive).length}</p></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 슬롯머신 */}
        <div className="lg:col-span-1">
          <SlotMachine missions={missions.filter((m: any) => m.isActive)} onSelect={m => setSendTarget(m)} />

          {/* 즉석 발송 확인 */}
          {sendTarget && (
            <Card className="mt-4 border-orange-300 bg-orange-50 dark:bg-orange-950">
              <CardContent className="pt-4">
                <p className="text-sm font-semibold mb-2">선택된 미션</p>
                <p className="text-base font-bold text-orange-700">{sendTarget.title}</p>
                <p className="text-xs text-muted-foreground mb-3">{getCatInfo(sendTarget.category).label} · {sendTarget.durationMinutes}분 · {sendTarget.pointsReward}P</p>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-sm"
                    onClick={() => sendMission.mutate({ missionId: sendTarget.id, projectSlug: "all" })}
                    disabled={sendMission.isPending}
                  >
                    <Zap className="h-3.5 w-3.5 mr-1" /> 전체 발송
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSendTarget(null)}>취소</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 미션 목록 */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 flex flex-wrap gap-1 h-auto">
              <TabsTrigger value="list">전체 ({missions.length})</TabsTrigger>
              <TabsTrigger value="scheduled">정기 발송 ({scheduledMissions.length})</TabsTrigger>
              <TabsTrigger value="optional">선택 미션 ({optionalMissions.length})</TabsTrigger>
              <TabsTrigger value="glwa-slot">🎰 GLWA 슬롯머신</TabsTrigger>
              <TabsTrigger value="required">📋 필수 미션</TabsTrigger>
            </TabsList>

            {["list", "scheduled", "optional"].map(tab => {
              const list = tab === "list" ? missions : tab === "scheduled" ? scheduledMissions : optionalMissions;
              return (
                <TabsContent key={tab} value={tab}>
                  <div className="space-y-2">
                    {!list.length ? (
                      <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">미션이 없습니다. 위에서 추가해보세요.</CardContent></Card>
                    ) : list.map((m: any) => {
                      const cat = getCatInfo(m.category);
                      const CatIcon = cat.icon;
                      return (
                        <Card key={m.id} className={`transition-all ${!m.isActive ? "opacity-50" : ""}`}>
                          <CardContent className="py-3 px-4 flex items-center gap-3">
                            <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${cat.bg}`}>
                              <CatIcon className={`h-4 w-4 ${cat.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{m.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-muted-foreground">{cat.label}</span>
                                <span className="text-xs text-muted-foreground">·</span>
                                <span className="text-xs text-muted-foreground">{m.durationMinutes}분</span>
                                <span className="text-xs text-muted-foreground">·</span>
                                <span className="text-xs font-medium text-orange-600">{m.pointsReward}P</span>
                                {m.missionType === "scheduled" && m.scheduledTime && (
                                  <Badge variant="outline" className="text-xs py-0 h-4 border-blue-300 text-blue-600">
                                    <Clock className="h-2.5 w-2.5 mr-0.5" />{m.scheduledTime}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-orange-600 hover:bg-orange-50" onClick={() => setSendTarget(m)}>
                                <Zap className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditMission(m)}>
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={() => {
                                if (confirm("미션을 삭제하시겠습니까?")) deleteMission.mutate({ id: m.id });
                              }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>
              );
            })}

            {/* GLWA 슬롯머신 탭 */}
            <TabsContent value="glwa-slot">
              <GlwaMissionSlotMachine
                onMissionSelect={(mission, difficulty) => {
                  toast.success(`선택: ${mission} (${difficulty})`);
                }}
              />
            </TabsContent>

            {/* 필수 미션 탭 */}
            <TabsContent value="required">
              <GlwaRequiredMissions />
            </TabsContent>

          </Tabs>
        </div>
      </div>
      {/* 다이얼로그 */}
      <MissionDialog open={showCreate} onClose={() => setShowCreate(false)} onSaved={refetch} />
      <MissionDialog open={!!editMission} onClose={() => setEditMission(null)} editMission={editMission} onSaved={refetch} />
    </div>
  );
}
