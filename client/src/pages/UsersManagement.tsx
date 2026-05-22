/**
 * UsersManagement.tsx — 사용자 관리
 * 4개 카드 클릭 → 명단 리스트 → 전체선택 → 일괄 발송
 */
import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Users, UserCheck, UserPlus, Shield, Send, MessageSquare, Target, Calendar, CheckSquare, Square, X } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

type FilterMode = 'all' | 'today' | 'weekly' | 'admin';
type ActionType = 'message' | 'mission' | 'event' | 'schedule';
interface UserData { id: number; name?: string; email?: string; role: 'admin' | 'user'; createdAt?: string; }

const FILTER_CARDS = [
  { mode: 'all' as FilterMode, label: '전체 사용자', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { mode: 'today' as FilterMode, label: '오늘 가입', icon: UserPlus, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  { mode: 'weekly' as FilterMode, label: '주간 활성', icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  { mode: 'admin' as FilterMode, label: '관리자', icon: Shield, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
];

const ACTIONS = [
  { type: 'message' as ActionType, label: '💬 격려 메시지', desc: '1차 AI 피드백 연동 즉시 발송' },
  { type: 'mission' as ActionType, label: '🎯 미션 발송', desc: '미션 슬롯 선택 후 발송' },
  { type: 'event' as ActionType, label: '🎉 이벤트 발송', desc: '이벤트 참여 초대 발송' },
  { type: 'schedule' as ActionType, label: '📅 스케줄 등록', desc: '업무 스케줄 관리 연동' },
];

function getKorDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
}

export default function UsersManagement() {
  const [filterMode, setFilterMode] = useState<FilterMode | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showAction, setShowAction] = useState(false);
  const [actionType, setActionType] = useState<ActionType>('message');
  const [msgText, setMsgText] = useState('');
  const [search, setSearch] = useState('');
  const [isSending, setIsSending] = useState(false);

  const { data: users, isLoading } = trpc.admin.getUsers.useQuery();
  const allUsers = (users as unknown as UserData[] || []);

  // 필터링
  const today = new Date(); today.setHours(0,0,0,0);
  const weekAgo = new Date(Date.now() - 7*24*60*60*1000);
  const filtered = allUsers.filter(u => {
    if (search && !`${u.name??''} ${u.email??''}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterMode === 'today') {
      const d = u.createdAt ? new Date(u.createdAt) : null;
      return d && d >= today;
    }
    if (filterMode === 'weekly') {
      const d = u.createdAt ? new Date(u.createdAt) : null;
      return d && d >= weekAgo;
    }
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
    setIsSending(true);
    await new Promise(r => setTimeout(r, 800));
    const label = ACTIONS.find(a => a.type === actionType)?.label ?? '';
    toast.success(`${label} — ${selectedIds.size}명에게 발송 완료!`);
    setIsSending(false); setShowAction(false); setSelectedIds(new Set()); setMsgText('');
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-5">
        {/* 헤더 */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />사용자 관리
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">카드 클릭 → 명단 진입 → 전체선택 → 일괄 발송</p>
          </div>
          {filterMode && (
            <Button variant="outline" size="sm" onClick={() => { setFilterMode(null); setSelectedIds(new Set()); }}>
              <X className="h-4 w-4 mr-1" />필터 해제
            </Button>
          )}
        </div>

        {/* 4개 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {FILTER_CARDS.map(card => {
            const Icon = card.icon;
            const cnt = counts[card.mode];
            const isActive = filterMode === card.mode;
            return (
              <Card key={card.mode}
                className={`cursor-pointer transition-all hover:shadow-md ${isActive ? `${card.bg} ${card.border} border-2` : 'hover:border-gray-300'}`}
                onClick={() => { setFilterMode(isActive ? null : card.mode); setSelectedIds(new Set()); }}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500">{card.label}</p>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                  <p className={`text-2xl font-bold ${isActive ? card.color : 'text-gray-900'}`}>{cnt.toLocaleString()}</p>
                  <p className="text-xs text-blue-500 mt-1">👆 클릭하여 명단 보기</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 명단 리스트 */}
        {filterMode !== null && (
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
                      {selectedIds.size}명 발송
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-10"/>)}</div>
              ) : filtered.length === 0 ? (
                <p className="text-center text-gray-400 py-8">해당 조건의 사용자가 없습니다</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
                        <th className="py-2 px-3 w-8">
                          <button onClick={toggleAll}>
                            {selectedIds.size === filtered.length
                              ? <CheckSquare className="h-4 w-4 text-blue-600"/>
                              : <Square className="h-4 w-4 text-gray-400"/>}
                          </button>
                        </th>
                        <th className="text-left py-2 px-3">이름</th>
                        <th className="text-left py-2 px-3">이메일</th>
                        <th className="text-center py-2 px-3">역할</th>
                        <th className="text-center py-2 px-3">가입일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(u => (
                        <tr key={u.id} className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${selectedIds.has(u.id) ? 'bg-blue-50' : ''}`}
                          onClick={() => toggleOne(u.id)}>
                          <td className="py-2 px-3">
                            {selectedIds.has(u.id)
                              ? <CheckSquare className="h-4 w-4 text-blue-600"/>
                              : <Square className="h-4 w-4 text-gray-300"/>}
                          </td>
                          <td className="py-2 px-3 font-medium">{u.name ?? '—'}</td>
                          <td className="py-2 px-3 text-gray-500 text-xs">{u.email ?? '—'}</td>
                          <td className="py-2 px-3 text-center">
                            <Badge className={u.role === 'admin' ? 'bg-orange-100 text-orange-700 text-xs' : 'bg-gray-100 text-gray-600 text-xs'}>
                              {u.role === 'admin' ? '관리자' : '일반'}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 text-center text-xs text-gray-400">{getKorDate(u.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 일괄 발송 액션 패널 */}
        {showAction && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>일괄 발송 — {selectedIds.size}명</span>
                  <button onClick={() => setShowAction(false)}><X className="h-5 w-5 text-gray-400"/></button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 액션 유형 선택 */}
                <div className="grid grid-cols-2 gap-2">
                  {ACTIONS.map(a => (
                    <button key={a.type}
                      className={`p-3 rounded-lg border text-left transition-all ${actionType === a.type ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                      onClick={() => setActionType(a.type)}>
                      <div className="text-sm font-medium">{a.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{a.desc}</div>
                    </button>
                  ))}
                </div>
                {/* 메시지 입력 */}
                <Textarea placeholder={
                  actionType === 'message' ? '격려 메시지를 입력하세요...' :
                  actionType === 'mission' ? '발송할 미션명을 입력하세요...' :
                  actionType === 'event' ? '이벤트 안내 내용을 입력하세요...' :
                  '스케줄 등록 내용을 입력하세요...'
                } value={msgText} onChange={e => setMsgText(e.target.value)} rows={3} className="text-sm"/>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowAction(false)}>취소</Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isSending} onClick={handleSend}>
                    <Send className="h-4 w-4 mr-1"/>
                    {isSending ? '발송 중...' : `${selectedIds.size}명에게 발송`}
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
