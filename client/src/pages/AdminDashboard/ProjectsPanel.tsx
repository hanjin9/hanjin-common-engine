import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MoreVertical, Users, CreditCard, TrendingUp,
  Target, Calendar, ChevronDown, ChevronUp,
  Shield, MessageSquare, X,
} from 'lucide-react';

/**
 * ProjectsPanel — 6개 프로젝트 관리
 * 카드 30% 축소 + 클릭 시 5개 상세 섹션 표시
 * 총인원/사용자 · 매출/수익 · 미션/수련 · 회원/관리자 · 이벤트/게시판
 */

const PROJECTS = [
  {
    id: 1, name: '장부관리사', status: 'active', color: '#E53935',
    users: 1245, admins: 8, revenue: '₩12,450,000', profit: '₩9,800,000', growth: '+15.3%',
    missions: 342, trainings: 28, missionRate: '78%',
    members: { bronze: 450, silver: 380, gold: 290, diamond: 95, platinum: 30 },
    events: 12, boards: 89, notices: 5,
  },
  {
    id: 2, name: '스포츠회복사', status: 'active', color: '#E53935',
    users: 892, admins: 5, revenue: '₩8,920,000', profit: '₩7,100,000', growth: '+8.2%',
    missions: 210, trainings: 18, missionRate: '65%',
    members: { bronze: 320, silver: 260, gold: 180, diamond: 92, platinum: 40 },
    events: 8, boards: 54, notices: 3,
  },
  {
    id: 3, name: '로또', status: 'active', color: '#E53935',
    users: 3421, admins: 12, revenue: '₩34,210,000', profit: '₩28,500,000', growth: '+22.5%',
    missions: 890, trainings: 45, missionRate: '82%',
    members: { bronze: 1200, silver: 980, gold: 720, diamond: 380, platinum: 141 },
    events: 24, boards: 312, notices: 11,
  },
  {
    id: 4, name: 'GLWA', status: 'active', color: '#E53935',
    users: 567, admins: 6, revenue: '₩5,670,000', profit: '₩4,200,000', growth: '+5.1%',
    missions: 145, trainings: 12, missionRate: '71%',
    members: { bronze: 180, silver: 150, gold: 120, diamond: 80, platinum: 37 },
    events: 6, boards: 38, notices: 2,
  },
  {
    id: 5, name: '숨호흡', status: 'active', color: '#E53935',
    users: 2134, admins: 9, revenue: '₩21,340,000', profit: '₩17,800,000', growth: '+18.7%',
    missions: 654, trainings: 32, missionRate: '86%',
    members: { bronze: 780, silver: 650, gold: 410, diamond: 210, platinum: 84 },
    events: 15, boards: 178, notices: 7,
  },
  {
    id: 6, name: '랜딩', status: 'active', color: '#E53935',
    users: 4567, admins: 14, revenue: '₩45,670,000', profit: '₩38,200,000', growth: '+31.2%',
    missions: 1120, trainings: 58, missionRate: '91%',
    members: { bronze: 1600, silver: 1300, gold: 980, diamond: 520, platinum: 167 },
    events: 31, boards: 445, notices: 14,
  },
];

// ── 상세 섹션 탭 ──────────────────────────────────────────────────
const DETAIL_TABS = [
  { key: 'users',   label: '총인원·사용자', icon: Users },
  { key: 'revenue', label: '매출·수익',     icon: CreditCard },
  { key: 'mission', label: '미션·수련',     icon: Target },
  { key: 'members', label: '회원·관리자',   icon: Shield },
  { key: 'events',  label: '이벤트·게시판', icon: Calendar },
];

function DetailSection({ project, tab }: { project: typeof PROJECTS[0]; tab: string }) {
  if (tab === 'users') return (
    <div className="grid grid-cols-2 gap-2">
      <div className="bg-blue-50 rounded-lg p-3 text-center">
        <div className="text-xs text-gray-500 mb-1">전체 사용자</div>
        <div className="text-2xl font-bold text-blue-600">{project.users.toLocaleString()}</div>
        <div className="text-xs text-gray-400">누적 가입</div>
      </div>
      <div className="bg-green-50 rounded-lg p-3 text-center">
        <div className="text-xs text-gray-500 mb-1">관리자</div>
        <div className="text-2xl font-bold text-green-600">{project.admins}</div>
        <div className="text-xs text-gray-400">운영진</div>
      </div>
      <div className="bg-purple-50 rounded-lg p-3 text-center">
        <div className="text-xs text-gray-500 mb-1">오늘 접속</div>
        <div className="text-2xl font-bold text-purple-600">{Math.floor(project.users * 0.12).toLocaleString()}</div>
        <div className="text-xs text-gray-400">일간 활성</div>
      </div>
      <div className="bg-orange-50 rounded-lg p-3 text-center">
        <div className="text-xs text-gray-500 mb-1">신규 (7일)</div>
        <div className="text-2xl font-bold text-orange-600">{Math.floor(project.users * 0.03).toLocaleString()}</div>
        <div className="text-xs text-gray-400">신규 가입</div>
      </div>
    </div>
  );

  if (tab === 'revenue') return (
    <div className="space-y-2">
      <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
        <span className="text-sm text-gray-600">총 매출</span>
        <span className="font-bold text-green-600">{project.revenue}</span>
      </div>
      <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
        <span className="text-sm text-gray-600">순 수익</span>
        <span className="font-bold text-blue-600">{project.profit}</span>
      </div>
      <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg">
        <span className="text-sm text-gray-600">성장률</span>
        <span className="font-bold text-purple-600">{project.growth}</span>
      </div>
      <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
        <span className="text-sm text-gray-600">월 평균 객단가</span>
        <span className="font-bold text-gray-700">
          ₩{Math.floor(parseInt(project.revenue.replace(/[₩,]/g,'')) / project.users).toLocaleString()}
        </span>
      </div>
    </div>
  );

  if (tab === 'mission') return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-yellow-50 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-500">미션 완료</div>
          <div className="text-xl font-bold text-yellow-600">{project.missions}</div>
        </div>
        <div className="bg-cyan-50 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-500">수련 진행</div>
          <div className="text-xl font-bold text-cyan-600">{project.trainings}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-500">완료율</div>
          <div className="text-xl font-bold text-green-600">{project.missionRate}</div>
        </div>
      </div>
      <div className="p-2 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-500 mb-1">수련 단계별 현황</div>
        {['숨·호흡', '명상', '걷기·자세', '식치', '감사·베품'].map((s, i) => (
          <div key={s} className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-600 w-16">{s}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <div className="h-1.5 rounded-full bg-blue-400" style={{ width: `${65 + i*5}%` }} />
            </div>
            <span className="text-xs text-gray-500">{65 + i*5}%</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (tab === 'members') return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500 mb-1">11단계 멤버십 분포</div>
      {[
        { name: '1🥉 브론즈',   val: project.members.bronze,   color: '#cd7f32' },
        { name: '3🥇 골드',     val: project.members.gold,     color: '#f59e0b' },
        { name: '5🌊 그린에메', val: project.members.silver,   color: '#10b981' },
        { name: '8💎 다이아',   val: project.members.diamond,  color: '#818cf8' },
        { name: '10👑 플래티넘',val: project.members.platinum, color: '#6366f1' },
      ].map(m => (
        <div key={m.name} className="flex items-center gap-2">
          <span className="text-xs w-20 flex-shrink-0" style={{ color: m.color }}>{m.name}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-2">
            <div className="h-2 rounded-full" style={{
              width: `${Math.min(100, (m.val / project.users) * 100)}%`,
              background: m.color
            }} />
          </div>
          <span className="text-xs font-bold w-10 text-right">{m.val.toLocaleString()}</span>
        </div>
      ))}
      <div className="flex justify-between p-2 bg-orange-50 rounded-lg mt-1">
        <span className="text-xs text-gray-600">관리자</span>
        <span className="font-bold text-orange-600">{project.admins}명</span>
      </div>
    </div>
  );

  if (tab === 'events') return (
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-purple-50 rounded-lg p-3 text-center">
        <div className="text-xs text-gray-500 mb-1">이벤트</div>
        <div className="text-2xl font-bold text-purple-600">{project.events}</div>
        <div className="text-xs text-gray-400">진행 중</div>
      </div>
      <div className="bg-blue-50 rounded-lg p-3 text-center">
        <div className="text-xs text-gray-500 mb-1">게시글</div>
        <div className="text-2xl font-bold text-blue-600">{project.boards}</div>
        <div className="text-xs text-gray-400">총 게시판</div>
      </div>
      <div className="bg-red-50 rounded-lg p-3 text-center">
        <div className="text-xs text-gray-500 mb-1">공지</div>
        <div className="text-2xl font-bold text-red-600">{project.notices}</div>
        <div className="text-xs text-gray-400">공지사항</div>
      </div>
      <div className="col-span-3 p-2 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-500 mb-1">최근 이벤트</div>
        <div className="text-xs text-gray-700">• 신규 가입 20% 할인 이벤트 (진행중)</div>
        <div className="text-xs text-gray-700">• 주간 미션 챌린지 (D-3)</div>
        <div className="text-xs text-gray-700">• 멤버십 승급 보너스 (예정)</div>
      </div>
    </div>
  );

  return null;
}

export default function ProjectsPanel() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('users');

  const handleCardClick = (id: number) => {
    if (selectedProject === id) {
      setSelectedProject(null);
    } else {
      setSelectedProject(id);
      setActiveTab('users');
    }
  };

  const totalUsers = PROJECTS.reduce((s, p) => s + p.users, 0);
  const totalRevenue = '₩128,060,000';

  return (
    <div className="space-y-2 p-2 md:p-3">
      {/* 헤더 */}
      <div className="border-b border-gray-200 pb-2">
        <h1 className="text-base font-bold text-black">프로젝트 관리</h1>
        <p className="text-xs text-gray-500">6개 프로젝트 · 총 {totalUsers.toLocaleString()}명 · {totalRevenue}</p>
      </div>

      {/* 프로젝트 카드 목록 */}
      <div className="space-y-2">
        {PROJECTS.map((project) => {
          const isSelected = selectedProject === project.id;
          return (
            <div key={project.id}>
              {/* ── 프로젝트 카드 (30% 압축) ── */}
              <Card
                className={`cursor-pointer transition-all border ${
                  isSelected ? 'border-red-500 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleCardClick(project.id)}
              >
                <div className="p-2.5">
                  {/* 상단: 프로젝트명 + 상태 + 토글 */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: project.color }} />
                      <span className="text-sm font-bold text-black">{project.name}</span>
                      <Badge variant="outline" className="text-xs py-0 px-1.5 h-5">운영중</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {isSelected
                        ? <ChevronUp size={14} className="text-red-500" />
                        : <ChevronDown size={14} className="text-gray-400" />
                      }
                    </div>
                  </div>

                  {/* 통계 3개 가로 */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="flex items-center gap-1">
                      <Users size={11} className="text-gray-400 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-gray-400">사용자</div>
                        <div className="text-sm font-bold">{project.users.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <CreditCard size={11} className="text-gray-400 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-gray-400">매출</div>
                        <div className="text-sm font-bold">{project.revenue.replace('₩','').split(',')[0]}만</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp size={11} className="text-gray-400 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-gray-400">성장</div>
                        <div className="text-sm font-bold text-green-600">{project.growth}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* ── 상세 패널 (클릭 시 펼쳐짐) ── */}
              {isSelected && (
                <div className="border border-red-200 rounded-lg bg-white shadow-sm -mt-0.5 overflow-hidden">
                  {/* 탭 */}
                  <div className="flex border-b border-gray-100 bg-gray-50 overflow-x-auto">
                    {DETAIL_TABS.map(tab => {
                      const Icon = tab.icon;
                      return (
                        <button key={tab.key}
                          className={`flex items-center gap-1 px-2.5 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                            activeTab === tab.key
                              ? 'border-red-500 text-red-600 bg-white'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                          onClick={() => setActiveTab(tab.key)}>
                          <Icon size={12} />{tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* 상세 내용 */}
                  <div className="p-3">
                    <DetailSection project={project} tab={activeTab} />
                  </div>

                  {/* 하단 액션 */}
                  <div className="flex gap-2 px-3 pb-3">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs">상세보기</Button>
                    <Button size="sm" className="flex-1 h-8 text-xs bg-red-500 hover:bg-red-600 text-white">관리</Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 전체 요약 */}
      <div className="border-t border-gray-200 pt-2">
        <div className="grid grid-cols-2 gap-2">
          <Card className="p-2 border-gray-200">
            <div className="text-xs text-gray-500">전체 프로젝트</div>
            <div className="text-lg font-bold">6개 · {totalUsers.toLocaleString()}명</div>
          </Card>
          <Card className="p-2 border-gray-200">
            <div className="text-xs text-gray-500">총 매출</div>
            <div className="text-lg font-bold text-green-600">{totalRevenue}</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
