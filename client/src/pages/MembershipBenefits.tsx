/**
 * MembershipBenefits.tsx — 멤버십 혜택
 * 멤버십 구매 → 멤버십 혜택으로 전환 (보고서 1차 반영)
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Gift, Calendar, Star, Zap, Plus, Edit2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

const OFFLINE_EVENTS = [
  { id: 1, title: '5월 GLWA 건강 세미나', date: '2026-05-28', location: '서울 강남', tier: '골드 이상', spots: 50, registered: 38 },
  { id: 2, title: '6월 호흡 워크숍', date: '2026-06-14', location: '부산 해운대', tier: '실버 이상', spots: 30, registered: 21 },
  { id: 3, title: '6월 명상 1일 캠프', date: '2026-06-21', location: '제주도', tier: '플래티넘', spots: 20, registered: 12 },
];

const BENEFITS = [
  { tier: '브론즈', icon: '🥉', color: '#cd7f32', perks: ['기초 콘텐츠 접근', '일일 미션 5개', '월 포인트 500P'] },
  { tier: '실버',  icon: '🥈', color: '#94a3b8', perks: ['전체 콘텐츠 접근', '일일 미션 무제한', '월 포인트 1,000P', 'AI 피드백 1차'] },
  { tier: '골드',  icon: '🥇', color: '#fbbf24', perks: ['AI 맞춤 코칭', '수면 추적', '월 포인트 2,000P', 'AI 피드백 1·2차', '오프라인 이벤트'] },
  { tier: '플래티넘', icon: '💎', color: '#818cf8', perks: ['VIP 멘토링', '전문가 피드백', '월 포인트 5,000P', 'AI 피드백 전체', '오프라인 우선 등록', '수익 배분'] },
];

const PROMOS = [
  { title: '6월 신규 가입 20% 할인', desc: '6월 30일까지 신규 가입 시 첫 달 20% 할인', status: '진행중', badge: '🎁' },
  { title: '친구 추천 보너스', desc: '친구 추천 시 양쪽 모두 3,000P 지급', status: '상시', badge: '👥' },
  { title: '연간 결제 2개월 무료', desc: '연간 구독 결제 시 12+2개월 혜택', status: '진행중', badge: '🎉' },
];

export default function MembershipBenefits() {
  const [editMode, setEditMode] = useState(false);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="h-6 w-6 text-pink-500" />멤버십 혜택
            </h1>
            <p className="text-sm text-gray-500">오프라인 이벤트 · 온라인 혜택 · 프로모션 관리</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
              <Edit2 className="h-4 w-4 mr-1" />{editMode ? '완료' : '혜택 편집'}
            </Button>
            <Button size="sm" className="bg-pink-500 hover:bg-pink-600 text-white"
              onClick={() => toast.success('새 이벤트 등록 완료!')}>
              <Plus className="h-4 w-4 mr-1" />이벤트 추가
            </Button>
          </div>
        </div>

        {/* 오프라인 이벤트 캘린더 */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-blue-500" />오프라인 이벤트 캘린더</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {OFFLINE_EVENTS.map(ev => (
                <div key={ev.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-200 transition-all">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{ev.title}</h3>
                      <Badge className="text-xs bg-blue-100 text-blue-700">{ev.tier}</Badge>
                    </div>
                    <p className="text-xs text-gray-500">📅 {ev.date} · 📍 {ev.location}</p>
                    <div className="mt-1.5">
                      <div className="flex items-center gap-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-24">
                          <div className="h-1.5 rounded-full bg-blue-500"
                            style={{ width: `${(ev.registered / ev.spots) * 100}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{ev.registered}/{ev.spots}명</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {editMode && <Button size="sm" variant="outline" className="h-7 text-xs"
                      onClick={() => toast.success(`"${ev.title}" 수정 완료!`)}>수정</Button>}
                    <Button size="sm" variant="outline" className="h-7 text-xs"
                      onClick={() => toast.success(`"${ev.title}" 참가자 {ev.registered}명 명단 조회!`)}>
                      명단
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 멤버십 혜택 */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Star className="h-4 w-4 text-yellow-500" />등급별 혜택</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {BENEFITS.map(b => (
                  <div key={b.tier} className="p-3 rounded-lg border" style={{ borderLeftColor: b.color, borderLeftWidth: '4px', borderLeftStyle: 'solid' }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="font-semibold text-sm">{b.icon} {b.tier}</h4>
                      {editMode && <Button size="sm" variant="ghost" className="h-6 text-xs"
                        onClick={() => toast.success(`${b.tier} 혜택 수정 완료!`)}>수정</Button>}
                    </div>
                    <ul className="text-xs text-gray-600 space-y-0.5">
                      {b.perks.map(p => <li key={p}>✓ {p}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 프로모션 */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Zap className="h-4 w-4 text-orange-500" />이달의 프로모션</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {PROMOS.map(p => (
                  <div key={p.title} className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{p.badge}</span>
                          <h4 className="font-semibold text-sm">{p.title}</h4>
                        </div>
                        <p className="text-xs text-gray-600">{p.desc}</p>
                      </div>
                      <Badge className={`text-xs flex-shrink-0 ${p.status === '진행중' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {p.status}
                      </Badge>
                    </div>
                    {editMode && (
                      <div className="flex gap-1 mt-2">
                        <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => toast.success('프로모션 수정 완료!')}>수정</Button>
                        <Button size="sm" variant="outline" className="h-6 text-xs text-red-500" onClick={() => toast.success('프로모션 삭제!')}>삭제</Button>
                      </div>
                    )}
                  </div>
                ))}
                <Button className="w-full border-dashed text-orange-500 border-orange-300" variant="outline"
                  onClick={() => toast.success('새 프로모션 추가!')}>
                  <Plus className="h-4 w-4 mr-1" />프로모션 추가
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
