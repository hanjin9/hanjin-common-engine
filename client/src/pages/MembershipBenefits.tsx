/**
 * MembershipBenefits.tsx — 이벤트/멤버십 혜택 (1차 수정 반영)
 * - 타이틀: 이벤트/멤버십 혜택
 * - 이벤트 추가 → 실제 이벤트 생성 모달 (EventDashboard와 동일)
 * - 수정 버튼 → 해당 내용 pre-fill 후 모달 오픈
 * - 등급별 혜택: 11단계 전부
 * - 프로모션: 30일 경과 시 자동 "마감"
 */
import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Gift, Calendar, Zap, Plus, Edit2, X } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

// ── 오프라인 이벤트 초기 데이터 ───────────────────────────────────────────────
const initEvents = [
  { id: 1, title: '5월 GLWA 건강 세미나', date: '2026-05-28', location: '서울 강남', tier: '골드 이상', spots: 50, registered: 38, createdAt: new Date('2026-05-01') },
  { id: 2, title: '6월 호흡 워크숍',     date: '2026-06-14', location: '부산 해운대', tier: '실버 이상', spots: 30, registered: 21, createdAt: new Date('2026-05-05') },
];

// ── 11단계 혜택 데이터 ────────────────────────────────────────────────────────
const TIER_BENEFITS = [
  { step: 1,  emoji: '🥉', name: '브론즈',        color: '#cd7f32', perks: ['기초 콘텐츠', '일일 미션 5개', '월 500P'] },
  { step: 2,  emoji: '🥈', name: '실버',          color: '#94a3b8', perks: ['전체 콘텐츠', '무제한 미션', '월 1,000P', 'AI 1차 피드백'] },
  { step: 3,  emoji: '🥇', name: '골드',          color: '#f59e0b', perks: ['AI 맞춤 코칭', '월 2,000P', 'AI 피드백 1·2차', '오프라인 이벤트'] },
  { step: 4,  emoji: '💚', name: '에메랄드',      color: '#10b981', perks: ['웨어러블 연동', '월 3,000P', '1:1 피드백'] },
  { step: 5,  emoji: '🌊', name: '그린에메랄드',  color: '#0d9488', perks: ['맞춤 미션', '월 4,000P', '그룹 세션'] },
  { step: 6,  emoji: '💙', name: '사파이어',      color: '#2563eb', perks: ['VIP 분석 리포트', '월 5,000P', '전문가 상담'] },
  { step: 7,  emoji: '🔷', name: '블루사파이어',  color: '#3b82f6', perks: ['프리미엄 코칭', '월 7,000P', '해외 이벤트'] },
  { step: 8,  emoji: '💎', name: '다이아몬드',    color: '#818cf8', perks: ['다이아 혜택 전체', '월 10,000P', '수익 배분'] },
  { step: 9,  emoji: '🌀', name: '블루다이아몬드', color: '#06b6d4', perks: ['최상위 혜택', '월 15,000P', '파트너 자격'] },
  { step: 10, emoji: '👑', name: '플래티넘',      color: '#6366f1', perks: ['VIP 모든 혜택', '월 20,000P', '임원급'] },
  { step: 11, emoji: '⚫', name: '블랙플래티넘',  color: '#1a1a2e', perks: ['초청제 최고 등급', '무제한 포인트', '수익 공유', '프랜차이즈'] },
];

// ── 프로모션 자동 마감 판별 ──────────────────────────────────────────────────
function isExpired(endDate: string) {
  return new Date(endDate) < new Date();
}
const initPromos = [
  { id: 1, title: '🎁 신규 가입 20% 할인',  desc: '6월 30일까지 신규 가입 시 첫 달 20% 할인', endDate: '2026-06-30', badge: '진행중' },
  { id: 2, title: '👥 친구 추천 보너스',     desc: '친구 추천 시 양쪽 모두 3,000P 지급',       endDate: '2099-12-31', badge: '상시' },
  { id: 3, title: '🎉 연간 결제 2개월 무료', desc: '연간 구독 결제 시 12+2개월 혜택',           endDate: '2026-04-30', badge: '마감' },
];

// ── 이벤트 생성/수정 모달 ─────────────────────────────────────────────────────
interface EventForm { title: string; date: string; location: string; tier: string; spots: string; }
const EMPTY_FORM: EventForm = { title: '', date: '', location: '', tier: '전체 회원', spots: '' };

const TIER_OPTIONS = [
  '전체 회원', '신규 (7일 이내)',
  '1단계 🥉 브론즈', '2단계 🥈 실버', '3단계 🥇 골드',
  '4단계 💚 에메랄드', '5단계 🌊 그린에메랄드', '6단계 💙 사파이어',
  '7단계 🔷 블루사파이어', '8단계 💎 다이아몬드', '9단계 🌀 블루다이아몬드',
  '10단계 👑 플래티넘', '11단계 ⚫ 블랙플래티넘',
  '상위 5%', '상위 20%', '하위 20%', '하위 10%',
];

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  initial?: EventForm & { id?: number };
  onSaved: (ev: any) => void;
}
function EventModal({ open, onClose, initial, onSaved }: EventModalProps) {
  const [form, setForm] = useState<EventForm>(initial ?? EMPTY_FORM);
  const isEdit = !!initial?.id;

  const f = (k: keyof EventForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = () => {
    if (!form.title.trim()) { toast.error('이벤트명을 입력하세요'); return; }
    if (!form.date) { toast.error('날짜를 입력하세요'); return; }
    onSaved({ ...form, id: initial?.id ?? Date.now(), createdAt: new Date(), registered: 0, spots: Number(form.spots) || 30 });
    toast.success(isEdit ? '이벤트 수정 완료!' : '새 이벤트 등록 완료!');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            {isEdit ? '이벤트 수정' : '혜택 이벤트 추가'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">이벤트명</Label>
            <Input value={form.title} onChange={f('title')} placeholder="이벤트명 입력" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">날짜</Label>
              <Input type="date" value={form.date} onChange={f('date')} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">정원</Label>
              <Input type="number" value={form.spots} onChange={f('spots')} placeholder="30" className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">장소</Label>
            <Input value={form.location} onChange={f('location')} placeholder="서울 강남구..." className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">대상 등급</Label>
            <Select value={form.tier} onValueChange={v => setForm(p => ({ ...p, tier: v }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-60">
                {TIER_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}><X className="h-4 w-4 mr-1" />취소</Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave}>
            <Calendar className="h-4 w-4 mr-1" />{isEdit ? '수정 저장' : '등록'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────────
export default function MembershipBenefits() {
  const [, setLocation] = useLocation();
  const [events, setEvents] = useState(initEvents);
  const [promos] = useState(initPromos);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<(EventForm & { id?: number }) | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [expandedTier, setExpandedTier] = useState<number | null>(null);

  const openCreate = () => { setEditingEvent(null); setModalOpen(true); };
  const openEdit = (ev: typeof events[0]) => {
    setEditingEvent({ id: ev.id, title: ev.title, date: ev.date, location: ev.location, tier: ev.tier, spots: String(ev.spots) });
    setModalOpen(true);
  };
  const handleSaved = (form: any) => {
    setEvents(prev => {
      const exists = prev.find(e => e.id === form.id);
      if (exists) return prev.map(e => e.id === form.id ? { ...e, ...form } : e);
      return [...prev, form];
    });
  };

  return (
    <DashboardLayout>
      <div className="p-3 md:p-4 space-y-3">
        {/* 헤더 */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Gift className="h-6 w-6 text-pink-500" />이벤트 / 멤버십 혜택
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">오프라인 이벤트 · 등급별 혜택 · 프로모션 관리</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
              <Edit2 className="h-4 w-4 mr-1" />{editMode ? '완료' : '혜택 편집'}
            </Button>
            <Button size="sm" className="bg-pink-500 hover:bg-pink-600 text-white gap-1" onClick={openCreate}>
              <Plus className="h-4 w-4" />혜택 이벤트 추가
            </Button>
          </div>
        </div>

        {/* 오프라인 혜택 이벤트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-blue-500" />오프라인 혜택 이벤트
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.map(ev => (
              <div key={ev.id}
                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-200 transition-all">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{ev.title}</h3>
                    <Badge className="text-xs bg-blue-100 text-blue-700">{ev.tier}</Badge>
                  </div>
                  <p className="text-xs text-gray-500">📅 {ev.date} · 📍 {ev.location}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 max-w-32 bg-gray-200 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-blue-500"
                        style={{ width: `${(ev.registered / ev.spots) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-400">{ev.registered}/{ev.spots}명</span>
                  </div>
                </div>
                <div className="flex gap-1.5 ml-3">
                  <Button size="sm" variant="outline" className="h-7 text-xs"
                    onClick={() => toast.success(`${ev.registered}명 등록자 캘린더 연동!`)}>
                    <Calendar className="h-3 w-3 mr-1" />등록
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openEdit(ev)}>
                    <Edit2 className="h-3 w-3 mr-1" />수정
                  </Button>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                이벤트가 없습니다. 혜택 이벤트 추가 버튼으로 등록하세요.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* 11단계 등급별 혜택 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Gift className="h-4 w-4 text-yellow-500" />등급별 특별 혜택 이벤트
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {TIER_BENEFITS.map(t => (
                <div key={t.step}>
                  <div
                    className="flex items-center justify-between p-2.5 rounded-lg cursor-pointer hover:shadow-sm transition-all"
                    style={{ borderLeft: `3px solid ${t.color}`, background: t.color + '11' }}
                    onClick={() => setExpandedTier(expandedTier === t.step ? null : t.step)}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{t.emoji}</span>
                      <span className="text-xs font-semibold" style={{ color: t.color }}>{t.step}단계</span>
                      <span className="text-sm font-medium">{t.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {editMode && (
                        <Button size="sm" variant="ghost" className="h-6 text-xs px-2"
                          onClick={e => { e.stopPropagation(); toast.success(`${t.name} 혜택 수정!`); }}>
                          수정
                        </Button>
                      )}
                      <span className="text-xs text-gray-400">{expandedTier === t.step ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {expandedTier === t.step && (
                    <div className="mx-3 px-3 py-2 bg-gray-50 rounded-b-lg border border-t-0 border-gray-200">
                      <ul className="text-xs text-gray-600 space-y-0.5">
                        {t.perks.map(p => <li key={p}>✓ {p}</li>)}
                      </ul>
                      {editMode && (
                        <Button size="sm" variant="outline" className="mt-2 h-6 text-xs"
                          onClick={() => toast.success(`${t.name} 특별 혜택 이벤트 등록!`)}>
                          + 특별 이벤트 등록
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 이달의 프로모션 (30일 자동 마감) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-orange-500" />이달의 프로모션
                <span className="text-xs font-normal text-gray-400">(30일 경과 시 자동 마감)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {promos.map(p => {
                const expired = isExpired(p.endDate);
                const status = expired ? '마감' : p.badge;
                const statusColor = status === '마감' ? 'bg-gray-100 text-gray-500'
                  : status === '상시' ? 'bg-gray-100 text-gray-600'
                  : 'bg-green-100 text-green-700';
                return (
                  <div key={p.id} className={`p-3 rounded-lg border ${expired ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-orange-50 border-orange-200'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{p.title}</h4>
                          <Badge className={`text-xs ${statusColor}`}>{status}</Badge>
                        </div>
                        <p className="text-xs text-gray-600">{p.desc}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {p.endDate === '2099-12-31' ? '상시 진행' : `마감: ${p.endDate}`}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        {editMode && (
                          <>
                            <Button size="sm" variant="ghost" className="h-6 text-xs px-2"
                              onClick={() => toast.success(`"${p.title}" 수정!`)}>수정</Button>
                            <Button size="sm" variant="ghost" className="h-6 text-xs px-2 text-red-500"
                              onClick={() => toast.success('삭제!')}>삭제</Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <Button className="w-full border-dashed text-orange-500 border-orange-300" variant="outline"
                onClick={() => toast.success('새 프로모션 추가 창 (준비 중)')}>
                <Plus className="h-4 w-4 mr-1" />프로모션 추가
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 이벤트 생성/수정 모달 */}
      <EventModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingEvent(null); }}
        initial={editingEvent ?? undefined}
        onSaved={handleSaved}
      />
    </DashboardLayout>
  );
}
