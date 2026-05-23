import SharedCalendar, { useSampleCalendarEvents } from '@/components/SharedCalendar';
/**
 * EventDashboard.tsx — 이벤트 관리 페이지
 * - 스케줄 이벤트 (캘린더 연동)
 * - 즉석 이벤트 (즉시 발송)
 * - 미션 연동 (이벤트↔미션 양방향)
 * - % 기반 타겟 발송
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Calendar, Zap, Plus, Trash2, Send, Clock,
  Users, Trophy, Target, RefreshCw, CheckCircle2,
  Bell, Star, Gift, AlertCircle, BarChart3, UserPlus} from "lucide-react";

// ─── 타겟 그룹 ────────────────────────────────────────────────────────────────
const TARGET_OPTIONS = [
  // 전체·신규
  { value: "all",           label: "전체 회원",        icon: Users,       color: "text-blue-500",   desc: "모든 활성 회원" },
  { value: "new_7d",        label: "신규 (7일 이내)",  icon: UserPlus,    color: "text-green-500",  desc: "최근 7일 가입 신규 회원" },
  // 11단계 멤버십
  { value: "tier_1",        label: "1단계 🥉 브론즈",         icon: null, color: "text-amber-700",   desc: "브론즈 등급 회원" },
  { value: "tier_2",        label: "2단계 🥈 실버",           icon: null, color: "text-slate-500",   desc: "실버 등급 회원" },
  { value: "tier_3",        label: "3단계 🥇 골드",           icon: null, color: "text-yellow-500",  desc: "골드 등급 회원" },
  { value: "tier_4",        label: "4단계 💚 에메랄드",       icon: null, color: "text-emerald-500", desc: "에메랄드 등급 회원" },
  { value: "tier_5",        label: "5단계 🌊 그린에메랄드",   icon: null, color: "text-teal-500",    desc: "그린에메랄드 등급 회원" },
  { value: "tier_6",        label: "6단계 💙 사파이어",       icon: null, color: "text-blue-600",    desc: "사파이어 등급 회원" },
  { value: "tier_7",        label: "7단계 🔷 블루사파이어",   icon: null, color: "text-blue-700",    desc: "블루사파이어 등급 회원" },
  { value: "tier_8",        label: "8단계 💎 다이아몬드",     icon: null, color: "text-indigo-500",  desc: "다이아몬드 등급 회원" },
  { value: "tier_9",        label: "9단계 🌀 블루다이아몬드", icon: null, color: "text-cyan-500",    desc: "블루다이아몬드 등급 회원" },
  { value: "tier_10",       label: "10단계 👑 플래티넘",      icon: null, color: "text-purple-500",  desc: "플래티넘 등급 회원" },
  { value: "tier_11",       label: "11단계 ⚫ 블랙플래티넘",  icon: null, color: "text-gray-800",    desc: "블랙플래티넘 등급 회원" },
  // 세그먼트
  { value: "top_5pct",      label: "상위 5%",          icon: Star,        color: "text-orange-500", desc: "AI 점수 상위 5% (300P 추가)" },
  { value: "top_20pct",     label: "상위 20%",         icon: Trophy,      color: "text-yellow-500", desc: "AI 점수 상위 20% (100P 추가)" },
  { value: "bottom_20pct",  label: "하위 20%",         icon: Gift,        color: "text-purple-500", desc: "격려 대상 — 회복 미션 권장" },
  { value: "bottom_10pct",  label: "하위 10%",         icon: AlertCircle, color: "text-red-500",    desc: "집중 케어 대상" },
  { value: "inactive",      label: "30일 미접속",      icon: AlertCircle, color: "text-red-400",    desc: "이탈 위험 — 복귀 이벤트 권장" },
];

// ─── 발송 유형 ────────────────────────────────────────────────────────────────
const SEND_TYPES = [
  { value: "instant", label: "즉시 발송", icon: Zap, color: "text-yellow-500" },
  { value: "scheduled", label: "예약 발송", icon: Calendar, color: "text-blue-500" },
  { value: "recurring", label: "반복 발송", icon: RefreshCw, color: "text-green-500" },
];

// ─── 상태 배지 ────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    draft: { label: "초안", variant: "secondary" },
    scheduled: { label: "예약됨", variant: "outline" },
    sending: { label: "발송중", variant: "default" },
    sent: { label: "발송완료", variant: "default" },
    canceled: { label: "취소됨", variant: "destructive" },
  };
  const cfg = map[status] || { label: status, variant: "secondary" };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

// ─── 이벤트 생성/수정 다이얼로그 ─────────────────────────────────────────────
function EventDialog({
  open, onClose, onSaved, editEvent
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editEvent?: any;
}) {
  const [form, setForm] = useState({
    title: editEvent?.title || "",
    content: editEvent?.content || "",
    sendType: editEvent?.sendType || "instant",
    targetAudience: editEvent?.targetAudience || "all",
    scheduledAt: editEvent?.scheduledAt ? new Date(editEvent.scheduledAt).toISOString().slice(0, 16) : "",
    recurringCron: editEvent?.recurringCron || "",
    projectSlug: editEvent?.projectSlug || "all",
  });

  const createEvent = trpc.event.create.useMutation({
    onSuccess: () => { toast.success("이벤트가 생성되었습니다"); onSaved(); onClose(); }
  });
  const updateEvent = trpc.event.update.useMutation({
    onSuccess: () => { toast.success("이벤트가 수정되었습니다"); onSaved(); onClose(); }
  });

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error("제목을 입력하세요"); return; }
    if (!form.content.trim()) { toast.error("내용을 입력하세요"); return; }
    const payload = {
      ...form,
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).getTime() : undefined,
    };
    if (editEvent) {
      updateEvent.mutate({ id: editEvent.id, ...payload });
    } else {
      createEvent.mutate(payload);
    }
  };

  const selectedTarget = TARGET_OPTIONS.find(t => t.value === form.targetAudience);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editEvent ? "이벤트 수정" : "새 이벤트 만들기"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>제목</Label>
            <Input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="이벤트 제목"
            />
          </div>
          <div>
            <Label>내용</Label>
            <Textarea
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              placeholder="이벤트 내용을 입력하세요"
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>발송 유형</Label>
              <Select value={form.sendType} onValueChange={v => setForm(p => ({ ...p, sendType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEND_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>타겟 그룹</Label>
              <Select value={form.targetAudience} onValueChange={v => setForm(p => ({ ...p, targetAudience: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TARGET_OPTIONS.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {selectedTarget && (
            <div className={`text-xs p-2 rounded bg-muted ${selectedTarget.color}`}>
              {selectedTarget.icon && <selectedTarget.icon className="inline w-3 h-3 mr-1" />}
              {selectedTarget.desc}
            </div>
          )}
          {form.sendType === "scheduled" && (
            <div>
              <Label>예약 발송 시간</Label>
              <Input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))}
              />
            </div>
          )}
          {form.sendType === "recurring" && (
            <div>
              <Label>반복 주기 (Cron)</Label>
              <Input
                value={form.recurringCron}
                onChange={e => setForm(p => ({ ...p, recurringCron: e.target.value }))}
                placeholder="0 9 * * * (매일 오전 9시)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                예: 0 9 * * * (매일 9시) / 0 9 * * 1 (매주 월요일 9시)
              </p>
            </div>
          )}
          <div>
            <Label>프로젝트</Label>
            <Select value={form.projectSlug} onValueChange={v => setForm(p => ({ ...p, projectSlug: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 프로젝트</SelectItem>
                <SelectItem value="glwa">GLWA 웰니스</SelectItem>
                <SelectItem value="jangbu">장부관리사</SelectItem>
                <SelectItem value="sports">스포츠회복사</SelectItem>
                <SelectItem value="soom">숨 호흡 앱</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSubmit} disabled={createEvent.isPending || updateEvent.isPending}>
            {editEvent ? "수정" : "생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export default function EventDashboard() {
  const [activeTab, setActiveTab] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showCalendar, setShowCalendar] = useState(true);
  const calEvents = useSampleCalendarEvents();
  const [editEvent, setEditEvent] = useState<any>(null);

  const { data: eventData, refetch } = trpc.event.list.useQuery({
    page: 1, pageSize: 50, sendStatus: "all"
  });
  const { data: statsData } = trpc.event.getStats.useQuery();

  const sendInstant = trpc.event.sendInstant.useMutation({
    onSuccess: () => { toast.success("이벤트가 즉시 발송되었습니다"); refetch(); }
  });
  const deleteEvent = trpc.event.delete.useMutation({
    onSuccess: () => { toast.success("이벤트가 삭제되었습니다"); refetch(); }
  });

  const events = eventData?.items || [];
  const stats = statsData || { total: 0, sentToday: 0, scheduled: 0, drafts: 0, upcoming: [] as any[] };

  const filteredEvents = activeTab === "all" ? events
    : events.filter((e: any) => e.sendStatus === activeTab);

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-500" />
            이벤트 관리
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            스케줄 이벤트 · 즉석 발송 · % 기반 타겟 · 미션 연동
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          새 이벤트
        </Button>
        <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowCalendar(!showCalendar)}>
          📅 {showCalendar ? "캘린더 닫기" : "캘린더 보기"}
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "전체 이벤트", value: stats.total, icon: Calendar, color: "text-blue-500" },
          { label: "오늘 발송", value: stats.sentToday, icon: CheckCircle2, color: "text-green-500" },
          { label: "예약됨", value: stats.scheduled, icon: Clock, color: "text-orange-500" },
          { label: "초안", value: stats.drafts, icon: Bell, color: "text-gray-500" },
          { label: "예정 이벤트", value: stats.upcoming?.length || 0, icon: Send, color: "text-purple-500" },
          { label: "발송률", value: `${stats.total > 0 ? Math.round((stats.sentToday / stats.total) * 100) : 0}%`, icon: BarChart3, color: "text-yellow-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-3">
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className="text-xl font-bold mt-1">{value}</p>
          </Card>
        ))}
      </div>

      {/* 타겟 그룹 안내 */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            % 기반 타겟 발송 가이드
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {TARGET_OPTIONS.map(({ value, label, icon: Icon, color, desc }) => (
              <div key={value} className="text-center p-2 rounded bg-muted">
                {Icon && <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />}
                <p className="text-xs font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 이벤트 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            이벤트 목록
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">전체 ({events.length})</TabsTrigger>
              <TabsTrigger value="draft">초안</TabsTrigger>
              <TabsTrigger value="scheduled">예약됨</TabsTrigger>
              <TabsTrigger value="sent">발송완료</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>이벤트가 없습니다</p>
                  <Button variant="outline" className="mt-3" onClick={() => setShowCreate(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    첫 이벤트 만들기
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEvents.map((event: any) => {
                    const target = TARGET_OPTIONS.find(t => t.value === event.targetAudience);
                    const sendType = SEND_TYPES.find(t => t.value === event.sendType);
                    return (
                      <div key={event.id} className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate">{event.title}</span>
                            <StatusBadge status={event.sendStatus} />
                            {target && (
                              <Badge variant="outline" className={`text-xs ${target.color}`}>
                                {target.label}
                              </Badge>
                            )}
                            {sendType && (
                              <Badge variant="outline" className={`text-xs ${sendType.color}`}>
                                {sendType.label}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.content}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {event.scheduledAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(event.scheduledAt).toLocaleString("ko-KR")}
                              </span>
                            )}
                            {event.sentCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Send className="w-3 h-3" />
                                {event.sentCount.toLocaleString()}명 발송
                              </span>
                            )}
                            {event.openCount > 0 && (
                              <span className="flex items-center gap-1">
                                <BarChart3 className="w-3 h-3" />
                                {event.openCount.toLocaleString()}명 오픈
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {event.sendStatus === "draft" && (
                            <Button
                              size="sm"
                              variant="default"
                              className="gap-1 text-xs"
                              onClick={() => {
                                if (confirm(`"${event.title}" 이벤트를 즉시 발송하시겠습니까?`)) {
                                  sendInstant.mutate({ id: event.id });
                                }
                              }}
                              disabled={sendInstant.isPending}
                            >
                              <Zap className="w-3 h-3" />
                              즉시 발송
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditEvent(event)}
                          >
                            수정
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm("이벤트를 삭제하시겠습니까?")) {
                                deleteEvent.mutate({ id: event.id });
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 즉석 이벤트 빠른 발송 */}
      <Card className="border-yellow-200 dark:border-yellow-800">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            즉석 이벤트 빠른 발송
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "전체 공지", target: "all", icon: Bell, color: "bg-blue-500" },
              { label: "TOP 10% 축하", target: "top_10pct", icon: Trophy, color: "bg-yellow-500" },
              { label: "하위 20% 격려", target: "bottom_20pct", icon: Gift, color: "bg-purple-500" },
              { label: "미접속자 알림", target: "inactive", icon: AlertCircle, color: "bg-red-500" },
            ].map(({ label, target, icon: Icon, color }) => (
              <Button
                key={target}
                variant="outline"
                className="h-auto py-3 flex-col gap-2"
                onClick={() => {
                  setShowCreate(true);
                  // 타겟 프리셋으로 다이얼로그 열기
                }}
              >
                <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 다이얼로그 */}
      <EventDialog open={showCreate} onClose={() => setShowCreate(false)} onSaved={refetch} />
      <EventDialog open={!!editEvent} onClose={() => setEditEvent(null)} onSaved={refetch} editEvent={editEvent} />
    </div>
  );
}
