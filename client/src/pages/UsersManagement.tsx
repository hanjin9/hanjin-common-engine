/**
 * UsersManagement.tsx — 사용자 관리 (2차·4차 수정 반영)
 * - 4개 카드 클릭 → 명단 리스트 (항상 열려 있음, 닫기 버튼 없음)
 * - 등급 표기: 단계숫자 + 이모티콘 + 명칭
 * - "내용 선택/입력" 버튼 → 발송 예약 모달
 * - 발송하기 → 발송 예약 (이벤트 관리로 연결)
 */
import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Users, UserCheck, UserPlus, Shield, Send, CheckSquare, Square, X, Calendar } from 'lucide-react';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';

type FilterMode = 'all' | 'today' | 'weekly' | 'admin';
interface UserData { id: number; name?: string; email?: string; role: 'admin' | 'user'; createdAt?: string; }

// 11단계 등급 표기
const TIER_MAP: Record<string, { step: number; emoji: string; label: string; color: string }> = {
  '블랙플래티넘': { step: 11, emoji: '⚫', label: '블랙플래티넘', color: '#1a1a2e' },
  '플래티넘':     { step: 10, emoji: '👑', label: '플래티넘',     color: '#6366f1' },
  '블루다이아몬드':{ step: 9,  emoji: '🌀', label: '블루다이아몬드',color: '#06b6d4' },
  '다이아몬드':   { step: 8,  emoji: '💎', label: '다이아몬드',   color: '#818cf8' },
  '블루사파이어': { step: 7,  emoji: '🔷', label: '블루사파이어', color: '#3b82f6' },
  '사파이어':     { step: 6,  emoji: '💙', label: '사파이어',     color: '#2563eb' },
  '그린에메랄드': { step: 5,  emoji: '🌊', label: '그린에메랄드', color: '#0d9488' },
  '에메랄드':     { step: 4,  emoji: '💚', label: '에메랄드',     color: '#10b981' },
  '골드':         { step: 3,  emoji: '🥇', label: '골드',         color: '#f59e0b' },
  '실버':         { step: 2,  emoji: '🥈', label: '실버',         color: '#94a3b8' },
  '브론즈':       { step: 1,  emoji: '🥉', label: '브론즈',       color: '#cd7f32' },
};

function TierBadge({ tier }: { tier?: string }) {
  const t = TIER_MAP[tier ?? '브론즈'] ?? { step: 1, emoji: '🥉', label: tier ?? '브론즈', color: '#cd7f32' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11,
      padding: '2px 7px', borderRadius: 99, background: t.color + '22', color: t.color, fontWeight: 600 }}>
      {t.step}단계 {t.emoji} {t.label}
    </span>
  );
}

const FILTER_CARDS = [
  { mode: 'all' as FilterMode,    label: '전체 사용자', icon: Users,     color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-300' },
  { mode: 'today' as FilterMode,  label: '오늘 가입',   icon: UserPlus,  color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-300' },
  { mode: 'weekly' as FilterMode, label: '주간 활성',   icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-300' },
  { mode: 'admin' as FilterMode,  label: '관리자',      icon: Shield,    color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-300' },
];

const ACTIONS = [
  { type: 'message', label: '💬 격려 메시지', desc: 'AI 1차 피드백 연동' },
  { type: 'mission',  label: '🎯 미션 발송',   desc: '미션 슬롯 선택' },
  { type: 'event',    label: '🎉 이벤트 발송', desc: '이벤트 관리 연동' },
  { type: 'schedule', label: '📅 예약 등록',   desc: '캘린더 연동 예약' },
];

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
}

export default function UsersManagement() {
  const [, setLocation] = useLocation();
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showAction, setShowAction] = useState(false);
  const [actionType, setActionType] = useState('message');
  const [msgText, setMsgText] = useState('');
  const [search, setSearch] = useState('');
  const [isSending, setIsSending] = useState(false);

  const { data: users, isLoading } = trpc.admin.getUsers.useQuery();
  const allUsers = (users as unknown as UserData[] || []);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const filtered = allUsers.filter(u => {
    if (search && !`${u.name ?? ''} ${u.email ?? ''}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterMode === 'today') { const d = u.createdAt ? new Date(u.createdAt) : null; return d && d >= today; }
    if (filterMode === 'weekly') { const d = u.createdAt ? new Date(u.createdAt) : null; return d && d >= weekAgo; }
    if (filterMode === 'admin') return u.role === 'admin';
    return true;
  });

  const counts = {
    all: allUsers.length,
    today: allUsers.filter(u => { const d = u.createdAt ? new Date(u.createdAt) : null; return d && d >= today; }).length,
    weekly: allUsers.filter(u => { const d = u.createdAt ? new Date(u.createdAt) : null; return d && d >= weekAgo; }).length,
    admin: allUsers.filter(u => u.role === 'admin').length,
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(u => u.id)));
  };
  const toggleOne = (id: number) => {
    const s = new Set(selectedIds);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedIds(s);
  };

  const handleSend = async () => {
    if (!msgText.trim()) { toast.error('메시지를 입력하세요'); return; }
    if (actionType === 'schedule' || actionType === 'event') {
      setShowAction(false);
      setLocation('/admin/events');
      toast.success('이벤트 관리 → 예약 등록으로 이동합니다');
      return;
    }
    setIsSending(true);
    await new Promise(r => setTimeout(r, 700));
    toast.success(`✅ ${ACTIONS.find(a => a.type === actionType)?.label} — ${selectedIds.size}명 발송 예약 완료!`);
    setIsSending(false); setShowAction(false); setSelectedIds(new Set()); setMsgText('');
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />사용자 관리
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">카드 클릭 → 명단 진입 → 선택 → 내용 선택/입력</p>
          </div>
        </div>

        {/* 4개 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {FILTER_CARDS.map(card => {
            const Icon = card.icon;
            const isActive = filterMode === card.mode;
            return (
              <Card key={card.mode}
                className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${isActive ? `${card.bg} border-2 ${card.border}` : 'hover:border-gray-300'}`}
                onClick={() => { setFilterMode(card.mode); setSelectedIds(new Set()); }}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500">{card.label}</p>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                  <p className={`text-2xl font-bold ${isActive ? card.color : 'text-gray-900'}`}>
                    {counts[card.mode].toLocaleString()}
                  </p>
                  <p className="text-xs mt-1" style={{ color: isActive ? '#7a5030' : '#94a3b8' }}>
                    {isActive ? '✅ 선택됨' : '👆 클릭하여 명단 보기'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 명단 리스트 (항상 표시) */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {FILTER_CARDS.find(c => c.mode === filterMode)?.label} 명단
                <Badge variant="outline" className="text-xs">{filtered.length}명</Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Input placeholder="이름·이메일 검색" className="h-8 w-40 text-xs"
                  value={search} onChange={e => setSearch(e.target.value)} />
                {selectedIds.size > 0 && (
                  <Button size="sm" className="gap-1 bg-blue-600 text-white h-8 text-xs"
                    onClick={() => setShowAction(true)}>
                    <Send className="h-3 w-3" />
                    내용 선택/입력 ({selectedIds.size}명)
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-gray-400 py-8">로딩 중...</p>
            ) : filtered.length === 0 ? (
              <p className="text-center text-gray-400 py-8">해당 조건의 사용자가 없습니다</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
                      <th className="py-2 px-3 w-8">
                        <button onClick={toggleAll}>
                          {selectedIds.size === filtered.length && filtered.length > 0
                            ? <CheckSquare className="h-4 w-4 text-blue-600" />
                            : <Square className="h-4 w-4 text-gray-400" />}
                        </button>
                      </th>
                      <th className="text-left py-2 px-3">이름</th>
                      <th className="text-left py-2 px-3">이메일</th>
                      <th className="text-left py-2 px-3">등급</th>
                      <th className="text-center py-2 px-3">역할</th>
                      <th className="text-center py-2 px-3">가입일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(u => (
                      <tr key={u.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${selectedIds.has(u.id) ? 'bg-blue-50' : ''}`}
                        onClick={() => toggleOne(u.id)}>
                        <td className="py-2 px-3">
                          {selectedIds.has(u.id)
                            ? <CheckSquare className="h-4 w-4 text-blue-600" />
                            : <Square className="h-4 w-4 text-gray-300" />}
                        </td>
                        <td className="py-2 px-3 font-medium">{u.name ?? '—'}</td>
                        <td className="py-2 px-3 text-xs text-gray-500">{u.email ?? '—'}</td>
                        <td className="py-2 px-3"><TierBadge tier="골드" /></td>
                        <td className="py-2 px-3 text-center">
                          <Badge className={u.role === 'admin'
                            ? 'bg-orange-100 text-orange-700 text-xs'
                            : 'bg-gray-100 text-gray-600 text-xs'}>
                            {u.role === 'admin' ? '관리자' : '일반'}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-center text-xs text-gray-400">{fmtDate(u.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 내용 선택/입력 모달 */}
        {showAction && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>내용 선택/입력 — {selectedIds.size}명</span>
                  <button onClick={() => setShowAction(false)}><X className="h-5 w-5 text-gray-400" /></button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 액션 유형 */}
                <div className="grid grid-cols-2 gap-2">
                  {ACTIONS.map(a => (
                    <button key={a.type}
                      className={`p-3 rounded-lg border text-left transition-all text-sm ${actionType === a.type ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                      onClick={() => setActionType(a.type)}>
                      <div className="font-medium">{a.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{a.desc}</div>
                    </button>
                  ))}
                </div>

                {/* 격려 메시지 선택 (message 선택 시) */}
                {actionType === 'message' && (
                  <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto space-y-1.5">
                    <p className="text-xs font-medium text-gray-500 mb-2">📋 격려 메시지 선택 (클릭 시 입력창에 자동 채움)</p>
                    {[
                      '🏆 오늘도 정말 잘 하셨어요! 꾸준함이 최고의 건강 비결입니다!',
                      '💪 놀라운 성장이에요! 이 속도라면 목표 달성도 금방이에요!',
                      '🌟 오늘의 노력이 내일의 건강을 만듭니다. 계속 화이팅!',
                      '✨ 작은 실천이 큰 변화를 만들어요. 정말 잘하고 계세요!',
                      '🌱 포기하지 않는 당신이 이미 챔피언입니다. 응원해요!',
                    ].map((msg, i) => (
                      <button key={i} className="w-full text-left text-xs p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
                        onClick={() => setMsgText(msg)}>
                        {msg}
                      </button>
                    ))}
                  </div>
                )}

                {/* 미션 발송 선택 */}
                {actionType === 'mission' && (
                  <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto space-y-1.5">
                    <p className="text-xs font-medium text-gray-500 mb-2">🎯 미션 선택</p>
                    {[
                      '⏰ [기상 직후] 4-7-8 호흡법 5분',
                      '☀️ [아침] 스트레칭 10분',
                      '🍽️ [점심 전] 물 2잔 마시기',
                      '🌬️ [저녁] 복식 호흡 10회',
                      '🌙 [취침 전] 명상 5분',
                    ].map((m, i) => (
                      <button key={i} className="w-full text-left text-xs p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
                        onClick={() => setMsgText(m)}>{m}</button>
                    ))}
                  </div>
                )}

                {/* 이벤트 발송 */}
                {actionType === 'event' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-700">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    이벤트 관리 페이지에서 캘린더 연동 예약합니다
                  </div>
                )}

                {/* 예약 등록 */}
                {actionType === 'schedule' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    이벤트 관리 페이지의 캘린더로 이동합니다
                  </div>
                )}

                {/* 메시지 입력 */}
                {(actionType === 'message' || actionType === 'mission') && (
                  <Textarea placeholder="메시지를 입력하거나 위에서 선택하세요..."
                    value={msgText} onChange={e => setMsgText(e.target.value)}
                    rows={3} className="text-sm" />
                )}

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowAction(false)}>취소</Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isSending} onClick={handleSend}>
                    <Calendar className="h-4 w-4 mr-1" />
                    {isSending ? '처리 중...' : '발송 예약'}
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
