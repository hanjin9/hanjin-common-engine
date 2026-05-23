/**
 * MissionDashboard.tsx — 미션 관리
 * 19단계 마인드맵 구조 + 각 단계 20개 슬롯 + 완료자 포인트 자동 지급
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Target, ChevronLeft, RefreshCw, Plus, Edit2, Save, X, CheckCircle, Zap } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

// ── 19단계 정의 ──────────────────────────────────────────────────────
const STAGES = [
  // 10단계 수련
  { id: 1,  name: '숨 (호흡)',      emoji: '🌬️', color: '#3b82f6', bgColor: '#eff6ff', points: 50,       category: '수련' },
  { id: 2,  name: '쉼',            emoji: '🌿', color: '#10b981', bgColor: '#f0fdf4', points: 50,       category: '수련' },
  { id: 3,  name: '잠',            emoji: '😴', color: '#8b5cf6', bgColor: '#f5f3ff', points: 100,      category: '수련' },
  { id: 4,  name: '명상',          emoji: '🧘', color: '#06b6d4', bgColor: '#ecfeff', points: 100,      category: '수련' },
  { id: 5,  name: '스트레칭·요가', emoji: '🤸', color: '#f59e0b', bgColor: '#fffbeb', points: 100,      category: '수련' },
  { id: 6,  name: '걷기·자세',     emoji: '🚶', color: '#84cc16', bgColor: '#f7fee7', points: 100,      category: '수련' },
  { id: 7,  name: '절제·균형',     emoji: '⚖️', color: '#f97316', bgColor: '#fff7ed', points: 150,      category: '수련' },
  { id: 8,  name: '감사·베품',     emoji: '🙏', color: '#ec4899', bgColor: '#fdf2f8', points: 150,      category: '수련' },
  { id: 9,  name: '식치',          emoji: '🥗', color: '#22c55e', bgColor: '#f0fdf4', points: 100,      category: '수련' },
  { id: 10, name: '깊고 고운 숨',  emoji: '✨', color: '#6366f1', bgColor: '#eef2ff', points: 200,      category: '수련' },
  // 9단계 챌린지
  { id: 11, name: '주간 챌린지',   emoji: '🏅', color: '#f59e0b', bgColor: '#fffbeb', points: 500,      category: '챌린지' },
  { id: 12, name: '격주 챌린지',   emoji: '🥈', color: '#94a3b8', bgColor: '#f8fafc', points: 1000,     category: '챌린지' },
  { id: 13, name: '월간 챌린지',   emoji: '🥇', color: '#f59e0b', bgColor: '#fffbeb', points: 2000,     category: '챌린지' },
  { id: 14, name: '3개월 챌린지',  emoji: '💎', color: '#06b6d4', bgColor: '#ecfeff', points: 5000,     category: '챌린지' },
  { id: 15, name: '6개월 챌린지',  emoji: '🏆', color: '#8b5cf6', bgColor: '#f5f3ff', points: 10000,    category: '챌린지' },
  { id: 16, name: '1년 챌린지',    emoji: '👑', color: '#f97316', bgColor: '#fff7ed', points: 20000,    category: '챌린지' },
  { id: 17, name: '3년 챌린지',    emoji: '🌟', color: '#ec4899', bgColor: '#fdf2f8', points: 50000,    category: '챌린지' },
  { id: 18, name: '5년 챌린지',    emoji: '🚀', color: '#6366f1', bgColor: '#eef2ff', points: 100000,   category: '챌린지' },
  { id: 19, name: '10년 챌린지',   emoji: '🏔️', color: '#1d4ed8', bgColor: '#eff6ff', points: 200000,  category: '챌린지' },
];

// ── 초기 슬롯 20개 생성 ──────────────────────────────────────────────
const makeSlots = (stageId: number, defaultPts: number) =>
  Array.from({ length: 20 }, (_, i) => ({
    slotId: i + 1,
    title: '',
    desc: '',
    points: defaultPts,
    active: false,
  }));

type Slot = { slotId: number; title: string; desc: string; points: number; active: boolean };
type StageSlots = Record<number, Slot[]>;

const initSlots: StageSlots = {};
STAGES.forEach(s => { initSlots[s.id] = makeSlots(s.id, s.points); });

// 완료자 더미 데이터
const COMPLETIONS = [
  { name: '김건강', email: 'kim@ex.com', mission: '아침 호흡 5분', points: 50, time: '06:12' },
  { name: '이활력', email: 'lee@ex.com', mission: '수면 7시간', points: 100, time: '07:30' },
  { name: '박호흡', email: 'park@ex.com', mission: '명상 10분', points: 100, time: '08:05' },
  { name: '최수련', email: 'choi@ex.com', mission: '걷기 30분', points: 100, time: '09:15' },
  { name: '정웰니스', email: 'jung@ex.com', mission: '스트레칭', points: 100, time: '10:00' },
];

export default function MissionDashboard() {
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [stageSlots, setStageSlots] = useState<StageSlots>(initSlots);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: '', desc: '', points: 0 });
  const [showCompletions, setShowCompletions] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | '수련' | '챌린지'>('all');

  const stage = selectedStage !== null ? STAGES.find(s => s.id === selectedStage) : null;
  const slots = selectedStage !== null ? (stageSlots[selectedStage] || []) : [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(r => setTimeout(r, 600));
    setIsRefreshing(false);
    toast.success('미션 데이터 새로고침 완료');
  };

  const startEdit = (slot: Slot) => {
    setEditingSlot(slot.slotId);
    setEditForm({ title: slot.title, desc: slot.desc, points: slot.points });
  };

  const saveSlot = (slotId: number) => {
    if (!selectedStage) return;
    setStageSlots(prev => ({
      ...prev,
      [selectedStage]: prev[selectedStage].map(s =>
        s.slotId === slotId ? { ...s, ...editForm, active: editForm.title.trim() !== '' } : s
      ),
    }));
    setEditingSlot(null);
    toast.success('미션 슬롯 저장 완료!');
  };

  const toggleActive = (slotId: number) => {
    if (!selectedStage) return;
    const slot = stageSlots[selectedStage].find(s => s.slotId === slotId);
    if (!slot?.title) { toast.error('미션명을 먼저 입력하세요'); return; }
    setStageSlots(prev => ({
      ...prev,
      [selectedStage]: prev[selectedStage].map(s =>
        s.slotId === slotId ? { ...s, active: !s.active } : s
      ),
    }));
  };

  const handleGivePoints = () => {
    toast.success(`오늘 완료 ${COMPLETIONS.length}명 → 포인트 자동 지급 + 격려 문자 발송 완료!`);
    setShowCompletions(false);
  };

  const filteredStages = STAGES.filter(s => activeFilter === 'all' || s.category === activeFilter);

  // ── 슬롯 상세 화면 ──────────────────────────────────────────────────
  if (selectedStage !== null && stage) {
    const activeCount = slots.filter(s => s.active).length;
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6 space-y-4">
          {/* 헤더 */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setSelectedStage(null)}>
                <ChevronLeft className="h-4 w-4 mr-1" />목록으로
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <span className="text-2xl">{stage.emoji}</span>
                  {stage.name}
                  <Badge style={{ background: stage.color, color: '#fff' }} className="text-xs">
                    {stage.category}
                  </Badge>
                </h1>
                <p className="text-sm text-gray-500">기본 {stage.points.toLocaleString()}P · 활성 {activeCount}/20개</p>
              </div>
            </div>
            <Button variant="outline" size="sm"
              onClick={() => toast.success(`${stage.name} 미션 전체 발송 완료!`)}>
              <Zap className="h-4 w-4 mr-1 text-yellow-500" />즉시 전체 발송
            </Button>
          </div>

          {/* 20개 슬롯 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {slots.map((slot) => (
              <Card key={slot.slotId}
                className={`border transition-all ${slot.active ? 'border-green-300 bg-green-50/50' : 'border-gray-200'}`}>
                <CardContent className="pt-3 pb-3">
                  {editingSlot === slot.slotId ? (
                    // 편집 모드
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-6">#{slot.slotId}</span>
                        <Input placeholder="미션명 입력" value={editForm.title}
                          onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                          className="flex-1 h-8 text-sm" autoFocus />
                      </div>
                      <Input placeholder="설명 (선택)" value={editForm.desc}
                        onChange={e => setEditForm(f => ({ ...f, desc: e.target.value }))}
                        className="h-8 text-sm" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">포인트:</span>
                        <Input type="number" value={editForm.points}
                          onChange={e => setEditForm(f => ({ ...f, points: Number(e.target.value) }))}
                          className="w-24 h-8 text-sm" />
                        <span className="text-xs text-gray-500">P</span>
                        <div className="ml-auto flex gap-1">
                          <Button size="sm" className="h-7 text-xs bg-blue-600" onClick={() => saveSlot(slot.slotId)}>
                            <Save className="h-3 w-3 mr-1" />저장
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingSlot(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // 표시 모드
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-gray-400 mt-0.5 w-6 flex-shrink-0">#{slot.slotId}</span>
                      <div className="flex-1 min-w-0">
                        {slot.title ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{slot.title}</span>
                              <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300">
                                {slot.points.toLocaleString()}P
                              </Badge>
                              {slot.active && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
                            </div>
                            {slot.desc && <p className="text-xs text-gray-500 mt-0.5">{slot.desc}</p>}
                          </>
                        ) : (
                          <span className="text-sm text-gray-300">빈 슬롯 — 클릭하여 미션 입력</span>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {slot.title && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                            onClick={() => toggleActive(slot.slotId)}>
                            <CheckCircle className={`h-4 w-4 ${slot.active ? 'text-green-500' : 'text-gray-300'}`} />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                          onClick={() => startEdit(slot)}>
                          <Edit2 className="h-3.5 w-3.5 text-gray-400" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── 19단계 마인드맵 메인 화면 ─────────────────────────────────────
  const todayCompleted = 342;
  const todayPoints = COMPLETIONS.reduce((a, c) => a + c.points, 0);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-5">
        {/* 헤더 */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Target className="h-6 w-6 text-blue-600" />미션 관리
            </h1>
            <p className="text-sm text-gray-500">19단계 수련 체계 · 각 단계 20개 슬롯</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* ✅ KPI 카드 4개 개편 (4차 반영) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* 카드1: 타임 루틴 */}
          <Card className="cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
            onClick={() => { setActiveFilter('all'); setSelectedStage(null); }}>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-500">⏰ 타임 루틴</p>
              <p className="text-2xl font-bold text-blue-600">8종</p>
              <p className="text-xs text-blue-500 mt-1">기상~취침 시간대별 미션</p>
            </CardContent>
          </Card>
          {/* 카드2: 10단계 미션 */}
          <Card className="cursor-pointer hover:shadow-md hover:border-green-300 transition-all"
            onClick={() => { setActiveFilter('수련'); setSelectedStage(null); }}>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-500">🌬️ 10단계 미션</p>
              <p className="text-2xl font-bold text-green-600">10단계</p>
              <p className="text-xs text-green-500 mt-1">숨·쉼·잠·명상·스트레칭...</p>
            </CardContent>
          </Card>
          {/* 카드3: 활성 미션 */}
          <Card className="cursor-pointer hover:shadow-md hover:border-purple-300 transition-all">
            <CardContent className="pt-4">
              <p className="text-xs text-gray-500">✅ 활성 미션</p>
              <p className="text-2xl font-bold text-purple-600">
                {Object.values(stageSlots).flat().filter(s => s.active).length}
              </p>
              <p className="text-xs text-purple-500 mt-1">오늘 활성화된 미션 목록</p>
            </CardContent>
          </Card>
          {/* 카드4: 오늘 완료 + 포인트 합침 → 포인트 관리 연결 */}
          <Card className="cursor-pointer hover:shadow-md hover:border-orange-300 transition-all"
            onClick={() => setShowCompletions(true)}>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-500">오늘 완료 · 포인트</p>
              <p className="text-2xl font-bold text-orange-600">{todayCompleted}명</p>
              <p className="text-xs text-orange-500 mt-1">12,400P 자동 지급 👆</p>
            </CardContent>
          </Card>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2">
          {(['all', '수련', '챌린지'] as const).map(f => (
            <Button key={f} variant={activeFilter === f ? 'default' : 'outline'} size="sm"
              onClick={() => setActiveFilter(f)}>
              {f === 'all' ? '전체' : f === '수련' ? '🌬️ 10단계 수련' : '🏆 챌린지'}
            </Button>
          ))}
        </div>

        {/* 19단계 마인드맵 타일 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredStages.map(stage => {
            const slots = stageSlots[stage.id] || [];
            const activeCount = slots.filter(s => s.active).length;
            return (
              <Card key={stage.id}
                className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5"
                style={{ borderTop: `3px solid ${stage.color}`, background: stage.bgColor }}
                onClick={() => setSelectedStage(stage.id)}>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-2xl">{stage.emoji}</span>
                    <Badge variant="outline" className="text-xs" style={{ borderColor: stage.color, color: stage.color }}>
                      {stage.id}단계
                    </Badge>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800 mt-1">{stage.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{stage.points.toLocaleString()}P</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mr-2">
                      <div className="h-1.5 rounded-full transition-all"
                        style={{ width: `${(activeCount / 20) * 100}%`, background: stage.color }} />
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{activeCount}/20</span>
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: stage.color }}>클릭하여 편집 →</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 오늘 완료자 팝업 */}
        {showCompletions && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex justify-between items-center text-base">
                  <span>오늘 완료자 ({COMPLETIONS.length}명)</span>
                  <button onClick={() => setShowCompletions(false)}><X className="h-5 w-5 text-gray-400" /></button>
                </CardTitle>
                <CardDescription>완료 즉시 포인트 자동 지급 + 격려 문자 발송</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {COMPLETIONS.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium">{c.name}</span>
                        <span className="text-xs text-gray-400 ml-2">{c.email}</span>
                        <div className="text-xs text-gray-500">{c.mission} · {c.time}</div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-700 text-xs">+{c.points}P</Badge>
                    </div>
                  ))}
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-700">
                  ✅ 총 {todayPoints}P 자동 지급 예정 · 격려 문자 자동 발송 연동
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowCompletions(false)}>닫기</Button>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleGivePoints}>
                    <Zap className="h-4 w-4 mr-1" />포인트 지급 + 문자 발송
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
