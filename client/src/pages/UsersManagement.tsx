/**
 * UsersManagement.tsx — 사용자 관리 (6개 카드 확장판)
 * 카드1: 전체 통계 (전체/오늘/주간/월간)
 * 카드2: 프로젝트별
 * 카드3: 멤버십별 (11단계)
 * 카드4: 미션별/단계별
 * 카드5: AI 피드백별
 * 카드6: 국가/직급별 관리자
 */
import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Users, UserCheck, UserPlus, Shield, Send, CheckSquare,
  Square, X, Calendar, Globe, Layers, Target, Brain, FolderOpen } from 'lucide-react';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import SharedCalendar, { useSampleCalendarEvents } from '@/components/SharedCalendar';

// ── 11단계 등급 표기 ────────────────────────────────────────────────────────
const TIER_MAP: Record<string, { step: number; emoji: string; color: string }> = {
  '블랙플래티넘': { step: 11, emoji: '⚫', color: '#1a1a2e' },
  '플래티넘':     { step: 10, emoji: '👑', color: '#6366f1' },
  '블루다이아몬드':{ step:9,  emoji: '🌀', color: '#06b6d4' },
  '다이아몬드':   { step: 8,  emoji: '💎', color: '#818cf8' },
  '블루사파이어': { step: 7,  emoji: '🔷', color: '#3b82f6' },
  '사파이어':     { step: 6,  emoji: '💙', color: '#2563eb' },
  '그린에메랄드': { step: 5,  emoji: '🌊', color: '#0d9488' },
  '에메랄드':     { step: 4,  emoji: '💚', color: '#10b981' },
  '골드':         { step: 3,  emoji: '🥇', color: '#f59e0b' },
  '실버':         { step: 2,  emoji: '🥈', color: '#94a3b8' },
  '브론즈':       { step: 1,  emoji: '🥉', color: '#cd7f32' },
};
function TierBadge({ tier }: { tier?: string }) {
  const t = TIER_MAP[tier ?? '브론즈'] ?? { step: 1, emoji: '🥉', color: '#cd7f32' };
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:10,
      padding:'2px 7px', borderRadius:99, background:t.color+'22', color:t.color, fontWeight:600 }}>
      {t.step}{t.emoji}{tier ?? '브론즈'}
    </span>
  );
}

// ── 카드 정의 ───────────────────────────────────────────────────────────────
type CardMode = 'stats' | 'project' | 'membership' | 'mission' | 'ai-feedback' | 'geo-admin';
interface NavCard {
  mode: CardMode; label: string; sub: string; icon: any;
  color: string; bg: string; border: string;
}
const NAV_CARDS: NavCard[] = [
  { mode:'stats',      label:'📊 전체 통계',       sub:'전체·오늘·주간·월간 활성',  icon:Users,     color:'text-blue-600',  bg:'bg-blue-50',   border:'border-blue-300' },
  { mode:'project',    label:'📁 프로젝트별',       sub:'프로젝트 선택 후 상세 보기', icon:FolderOpen,color:'text-green-600', bg:'bg-green-50',  border:'border-green-300' },
  { mode:'membership', label:'🏆 멤버십별',         sub:'11단계 등급별 회원 관리',    icon:Layers,    color:'text-purple-600',bg:'bg-purple-50', border:'border-purple-300' },
  { mode:'mission',    label:'🎯 미션별/단계별',    sub:'미션 완료·도전·난이도별',   icon:Target,    color:'text-orange-600',bg:'bg-orange-50', border:'border-orange-300' },
  { mode:'ai-feedback',label:'🤖 AI 피드백별',      sub:'상위/중위/하위 세그먼트',   icon:Brain,     color:'text-cyan-600',  bg:'bg-cyan-50',   border:'border-cyan-300' },
  { mode:'geo-admin',  label:'🌏 국가/직급별 관리자',sub:'지회·지사·지점·센터',      icon:Globe,     color:'text-rose-600',  bg:'bg-rose-50',   border:'border-rose-300' },
];

// 프로젝트 목록
const PROJECTS = [
  { id:'glwa',    name:'GLWA 웰니스',   users:523, active:312, color:'#6366f1' },
  { id:'jangbu',  name:'장부관리사',    users:198, active:87,  color:'#10b981' },
  { id:'sports',  name:'스포츠회복사',  users:287, active:134, color:'#f59e0b' },
  { id:'soom',    name:'숨 호흡 앱',    users:156, active:98,  color:'#3b82f6' },
  { id:'breadco', name:'브레드코치',    users:83,  active:41,  color:'#ec4899' },
];

// AI 피드백 세그먼트
const AI_SEGS = [
  { value:'top_1',    label:'상위 1%',    emoji:'🏆', color:'#fbbf24', cnt:12  },
  { value:'top_3',    label:'상위 3%',    emoji:'💎', color:'#818cf8', cnt:35  },
  { value:'top_5',    label:'상위 5%',    emoji:'⭐', color:'#f59e0b', cnt:62  },
  { value:'top_10',   label:'상위 10%',   emoji:'🌟', color:'#10b981', cnt:124 },
  { value:'top_20',   label:'상위 20%',   emoji:'✨', color:'#3b82f6', cnt:249 },
  { value:'mid_50',   label:'중위 50%',   emoji:'💪', color:'#6366f1', cnt:623 },
  { value:'bot_30',   label:'하위 30%',   emoji:'🌱', color:'#f97316', cnt:374 },
  { value:'bot_20',   label:'하위 20%',   emoji:'💙', color:'#ec4899', cnt:249 },
  { value:'bot_10',   label:'하위 10%',   emoji:'🤝', color:'#ef4444', cnt:124 },
  { value:'inactive', label:'30일 미접속',emoji:'🔔', color:'#9ca3af', cnt:89  },
  { value:'mission_done', label:'미션 완수',emoji:'✅', color:'#16a34a', cnt:342 },
  { value:'event',    label:'이벤트 참여',emoji:'🎉', color:'#f59e0b', cnt:178 },
];

// 국가/직급별
const GEO_LEVELS = [
  { level:'지회',  alias:'국가',   icon:'🌍', desc:'국가 단위 · 지회장',   color:'#6366f1' },
  { level:'지사',  alias:'도시',   icon:'🏙️', desc:'도시 단위 · 지사장',   color:'#10b981' },
  { level:'지점',  alias:'지점',   icon:'🏢', desc:'지역 지점 · 지점장',   color:'#f59e0b' },
  { level:'센터',  alias:'센터',   icon:'🏋️', desc:'단위 센터 · 센터장',   color:'#ef4444' },
];

const ACTIONS = [
  { type:'message', label:'💬 격려 메시지' },
  { type:'mission',  label:'🎯 미션 발송' },
  { type:'event',    label:'🎉 이벤트 발송' },
  { type:'schedule', label:'📅 예약 등록' },
];

export default function UsersManagement() {
  const [, setLocation] = useLocation();
  const [activeCard, setActiveCard] = useState<CardMode>('stats');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showAction, setShowAction] = useState(false);
  const [actionType, setActionType] = useState('message');
  const [msgText, setMsgText] = useState('');
  const [search, setSearch] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  const { data: usersRaw } = trpc.admin.getUsers.useQuery();
  const users = (usersRaw as any[] || []);
  const calEvents = useSampleCalendarEvents();

  const today = new Date(); today.setHours(0,0,0,0);
  const weekAgo = new Date(Date.now() - 7*24*60*60*1000);
  const monthAgo = new Date(Date.now() - 30*24*60*60*1000);
  const todayCnt  = users.filter(u => u.createdAt && new Date(u.createdAt) >= today).length;
  const weekCnt   = users.filter(u => u.createdAt && new Date(u.createdAt) >= weekAgo).length;
  const monthCnt  = users.filter(u => u.createdAt && new Date(u.createdAt) >= monthAgo).length;
  const adminCnt  = users.filter(u => u.role==='admin').length;

  const filtered = users.filter(u =>
    !search || `${u.name??''} ${u.email??''}`.toLowerCase().includes(search.toLowerCase())
  );

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
    if (actionType === 'schedule' || actionType === 'event') {
      setShowAction(false); setLocation('/admin/events');
      toast.success('이벤트 관리 → 예약 등록 이동'); return;
    }
    if (!msgText.trim()) { toast.error('메시지를 입력하세요'); return; }
    toast.success(`✅ ${selectedIds.size}명 발송 예약 완료!`);
    setShowAction(false); setSelectedIds(new Set()); setMsgText('');
  };

  return (
    <DashboardLayout>
      <div className="p-3 md:p-4 space-y-3">
        {/* 헤더 */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-blue-600"/>사용자 관리</h1>
            <p className="text-sm text-gray-500 mt-0.5">6가지 분류 기준 · 카드 선택 → 상세 명단</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowCalendar(!showCalendar)}>
            <Calendar className="h-4 w-4"/>{showCalendar ? '캘린더 닫기' : '📅 캘린더'}
          </Button>
        </div>

        {/* 캘린더 (토글) */}
        {showCalendar && (
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-sm">📅 스케줄 캘린더</CardTitle></CardHeader>
            <CardContent><SharedCalendar events={calEvents} allowMultiSelect onDatesSelected={dates => toast.success(`${dates.length}개 날짜 선택: ${dates.join(', ')}`)} /></CardContent>
          </Card>
        )}

        {/* 6개 네비게이션 카드 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {NAV_CARDS.map(card => {
            const Icon = card.icon;
            const isActive = activeCard === card.mode;
            return (
              <Card key={card.mode}
                className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${isActive ? `${card.bg} border-2 ${card.border}` : 'hover:border-gray-300'}`}
                onClick={() => { setActiveCard(card.mode); setSelectedProject(null); setSelectedIds(new Set()); }}>
                <CardContent className="pt-2 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold ${card.color}`}>{card.label}</span>
                    <Icon className={`h-4 w-4 ${card.color}`}/>
                  </div>
                  <p className="text-xs text-gray-400">{card.sub}</p>
                  {isActive && <div className="mt-2 h-0.5 rounded-full" style={{ background: 'currentColor' }} />}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── 카드1: 전체 통계 ─────────────────────────────────────── */}
        {activeCard === 'stats' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label:'전체 사용자', val:users.length, color:'text-blue-600', sub:'전체' },
                { label:'오늘 가입',   val:todayCnt,     color:'text-green-600', sub:'신규' },
                { label:'주간 활성',  val:weekCnt,      color:'text-purple-600', sub:'7일' },
                { label:'월간 활성',  val:monthCnt,     color:'text-orange-600', sub:'30일' },
              ].map(s => (
                <Card key={s.label}><CardContent className="pt-2">
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.val.toLocaleString()}</p>
                  <Badge variant="outline" className="text-xs mt-1">{s.sub}</Badge>
                </CardContent></Card>
              ))}
            </div>
            {/* 명단 */}
            <Card>
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-sm">전체 회원 명단</CardTitle>
                  <div className="flex gap-2">
                    <Input placeholder="검색" className="h-8 w-36 text-xs" value={search} onChange={e => setSearch(e.target.value)}/>
                    {selectedIds.size > 0 && (
                      <Button size="sm" className="bg-blue-600 text-white h-8 text-xs gap-1" onClick={() => setShowAction(true)}>
                        <Send className="h-3 w-3"/>내용 선택/입력 ({selectedIds.size}명)
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-gray-50 text-xs text-gray-500">
                      <th className="py-2 px-3 w-8"><button onClick={toggleAll}>{selectedIds.size===filtered.length&&filtered.length>0?<CheckSquare className="h-4 w-4 text-blue-600"/>:<Square className="h-4 w-4 text-gray-400"/>}</button></th>
                      <th className="text-left py-2 px-3">이름</th>
                      <th className="text-left py-2 px-3">이메일</th>
                      <th className="text-left py-2 px-3">등급</th>
                      <th className="text-center py-2 px-3">역할</th>
                    </tr></thead>
                    <tbody>{filtered.slice(0,20).map(u => (
                      <tr key={u.id} className={`border-b hover:bg-gray-50 cursor-pointer ${selectedIds.has(u.id)?'bg-blue-50':''}`} onClick={() => toggleOne(u.id)}>
                        <td className="py-2 px-3">{selectedIds.has(u.id)?<CheckSquare className="h-4 w-4 text-blue-600"/>:<Square className="h-4 w-4 text-gray-300"/>}</td>
                        <td className="py-2 px-3 font-medium">{u.name??'—'}</td>
                        <td className="py-2 px-3 text-xs text-gray-500">{u.email??'—'}</td>
                        <td className="py-2 px-3"><TierBadge tier="골드"/></td>
                        <td className="py-2 px-3 text-center"><Badge className={u.role==='admin'?'bg-orange-100 text-orange-700 text-xs':'bg-gray-100 text-gray-600 text-xs'}>{u.role==='admin'?'관리자':'일반'}</Badge></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── 카드2: 프로젝트별 ──────────────────────────────────── */}
        {activeCard === 'project' && !selectedProject && (
          <Card>
            <CardHeader><CardTitle className="text-sm">📁 프로젝트 선택</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PROJECTS.map(p => (
                  <div key={p.id} className="p-4 rounded-lg border border-gray-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
                    style={{ borderLeft:`4px solid ${p.color}` }}
                    onClick={() => setSelectedProject(p.id)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-sm">{p.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">전체 {p.users}명 · 활성 {p.active}명</p>
                      </div>
                      <Badge style={{ background:p.color+'22', color:p.color, border:'none', fontSize:11 }}>
                        {Math.round(p.active/p.users*100)}% 활성
                      </Badge>
                    </div>
                    <div className="mt-3 bg-gray-200 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width:`${Math.round(p.active/p.users*100)}%`, background:p.color }}/>
                    </div>
                    <p className="text-xs text-right mt-1" style={{ color:p.color }}>클릭하여 사용자 관리 →</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {activeCard === 'project' && selectedProject && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{PROJECTS.find(p=>p.id===selectedProject)?.name} — 사용자 관리</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setSelectedProject(null)}>← 프로젝트 목록</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
                {(() => { const p = PROJECTS.find(x=>x.id===selectedProject)!; return [
                  { label:'전체 사용자', val:p.users },
                  { label:'활성 사용자', val:p.active },
                  { label:'오늘 가입',   val:Math.floor(p.users*0.02) },
                  { label:'관리자',      val:Math.floor(p.users*0.01) },
                ].map(s => (
                  <div key={s.label} className="p-3 bg-gray-50 rounded-lg border text-center">
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-xl font-bold text-blue-600">{s.val}</p>
                  </div>
                )); })()}
              </div>
              <p className="text-xs text-gray-400">※ 실서버에서는 trpc.admin.getUsers에 projectId 필터 연동</p>
            </CardContent>
          </Card>
        )}

        {/* ── 카드3: 멤버십별 ────────────────────────────────────── */}
        {activeCard === 'membership' && (
          <Card>
            <CardHeader><CardTitle className="text-sm">🏆 멤버십 등급별 사용자</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { step:11, emoji:'⚫', name:'블랙플래티넘', cnt:12,  color:'#1a1a2e' },
                  { step:10, emoji:'👑', name:'플래티넘',     cnt:34,  color:'#6366f1' },
                  { step:8,  emoji:'💎', name:'다이아몬드',   cnt:78,  color:'#818cf8' },
                  { step:6,  emoji:'💙', name:'사파이어',     cnt:124, color:'#2563eb' },
                  { step:3,  emoji:'🥇', name:'골드',         cnt:287, color:'#f59e0b' },
                  { step:2,  emoji:'🥈', name:'실버',         cnt:412, color:'#94a3b8' },
                  { step:1,  emoji:'🥉', name:'브론즈',       cnt:300, color:'#cd7f32' },
                ].map(t => (
                  <div key={t.step} className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all"
                    style={{ borderLeft:`4px solid ${t.color}`, background:t.color+'0d' }}
                    onClick={() => toast.success(`${t.name} ${t.cnt}명 명단 조회!`)}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{t.emoji}</span>
                      <div>
                        <span className="text-xs font-bold" style={{ color:t.color }}>{t.step}단계</span>
                        <span className="text-sm font-medium ml-1.5">{t.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono font-bold">{t.cnt}명</span>
                      <div className="w-20 bg-gray-200 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{ width:`${Math.round(t.cnt/1247*100)}%`, background:t.color }}/>
                      </div>
                      <span className="text-xs" style={{ color:t.color }}>명단 →</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── 카드4: 미션별/단계별 ───────────────────────────────── */}
        {activeCard === 'mission' && (
          <div className="grid md:grid-cols-2 gap-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">✅ 미션 완료 현황</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label:'오늘 미션 완수', cnt:342, color:'#16a34a' },
                  { label:'주간 미션 완수', cnt:1847, color:'#3b82f6' },
                  { label:'미션 도전 중',   cnt:523, color:'#f59e0b' },
                  { label:'미션 미시작',    cnt:382, color:'#6b7280' },
                ].map(m => (
                  <div key={m.label} className="flex justify-between items-center p-2.5 rounded-lg border cursor-pointer hover:bg-gray-50"
                    onClick={() => toast.success(`${m.label} ${m.cnt}명 명단!`)}>
                    <span className="text-sm">{m.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm" style={{ color:m.color }}>{m.cnt}명</span>
                      <span className="text-xs" style={{ color:m.color }}>→</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">🌬️ 10단계 수련별</CardTitle></CardHeader>
              <CardContent className="space-y-1.5">
                {['숨','쉼','잠','명상','스트레칭','걷기','절제','감사','식치','깊은 숨'].map((m, i) => (
                  <div key={m} className="flex justify-between items-center p-2 rounded cursor-pointer hover:bg-gray-50"
                    onClick={() => toast.success(`${m} 수련 회원 명단!`)}>
                    <span className="text-xs font-medium">{i+1}단계 {m}</span>
                    <span className="text-xs text-blue-600">{Math.floor(Math.random()*400+100)}명 →</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── 카드5: AI 피드백별 ──────────────────────────────────── */}
        {activeCard === 'ai-feedback' && (
          <Card>
            <CardHeader><CardTitle className="text-sm">🤖 AI 피드백 세그먼트별</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AI_SEGS.map(s => (
                  <div key={s.value} className="p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all"
                    style={{ borderLeft:`3px solid ${s.color}`, background:s.color+'11' }}
                    onClick={() => toast.success(`${s.label} ${s.cnt}명\n메시지·미션·이벤트 발송 가능!`)}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">{s.emoji} {s.label}</span>
                      <span className="text-xs font-mono font-bold" style={{ color:s.color }}>{s.cnt}</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-1">
                      <div className="h-1 rounded-full" style={{ width:`${Math.round(s.cnt/1247*100)}%`, background:s.color }}/>
                    </div>
                    <p className="text-xs mt-1.5" style={{ color:s.color }}>클릭 → 명단 + 발송</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── 카드6: 국가/직급별 관리자 ──────────────────────────── */}
        {activeCard === 'geo-admin' && (
          <div className="space-y-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">🌏 직급별 체계 (프랜차이즈 관리자)</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {GEO_LEVELS.map(g => (
                    <div key={g.level} className="p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all text-center"
                      style={{ borderTop:`3px solid ${g.color}`, background:g.color+'0d' }}
                      onClick={() => toast.success(`${g.level}(${g.alias}) 관리자 명단!`)}>
                      <div className="text-2xl mb-2">{g.icon}</div>
                      <div className="font-bold text-sm">{g.level}</div>
                      <div className="text-xs text-gray-500 mt-0.5">({g.alias})</div>
                      <div className="text-xs text-gray-400 mt-1">{g.desc}</div>
                      <div className="mt-2 text-xs font-semibold" style={{ color:g.color }}>클릭 → 명단</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">관리자 발송 · 보상</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label:'전체 관리자 격려 발송', cnt:47, color:'#6366f1' },
                    { label:'지회장 포상 지급',      cnt:12, color:'#f59e0b' },
                    { label:'지사장 성과 보고',      cnt:23, color:'#10b981' },
                    { label:'센터장 목표 달성',      cnt:34, color:'#ef4444' },
                  ].map(a => (
                    <div key={a.label} className="flex justify-between items-center p-3 rounded-lg border cursor-pointer hover:bg-gray-50"
                      onClick={() => toast.success(`${a.label}!`)}>
                      <span className="text-xs">{a.label}</span>
                      <span className="text-xs font-bold" style={{ color:a.color }}>{a.cnt}명 →</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 내용 선택/입력 모달 */}
      <Dialog open={showAction} onOpenChange={setShowAction}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>내용 선택/입력 — {selectedIds.size}명</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-2">
              {ACTIONS.map(a => (
                <button key={a.type}
                  className={`p-3 rounded-lg border text-left text-sm transition-all ${actionType===a.type?'border-blue-500 bg-blue-50':'border-gray-200 hover:border-gray-300'}`}
                  onClick={() => setActionType(a.type)}>{a.label}</button>
              ))}
            </div>
            {(actionType==='message'||actionType==='mission') && (
              <Textarea placeholder="메시지 입력..." value={msgText} onChange={e => setMsgText(e.target.value)} rows={3}/>
            )}
            {(actionType==='event'||actionType==='schedule') && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                <Calendar className="h-4 w-4 inline mr-1"/>이벤트 관리 페이지에서 캘린더 연동 예약합니다
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAction(false)}>취소</Button>
            <Button className="bg-blue-600 text-white" onClick={handleSend}>
              <Calendar className="h-4 w-4 mr-1"/>발송 예약
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
