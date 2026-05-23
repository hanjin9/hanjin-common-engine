import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, Target, Send, Plus, Edit2, Trash2 } from 'lucide-react';

/**
 * 이벤트 관리 페이지 (활성화)
 * 
 * 기능:
 * - 이벤트 생성/수정/삭제
 * - 타겟 발송 연동
 * - 스케줄 관리
 */
export default function EventManagement() {
  const [activeTab, setActiveTab] = useState('campaigns');

  // 캠페인 목록 (예시)
  const campaigns = [
    {
      id: 1,
      name: '5월 건강 챌린지',
      status: 'active',
      startDate: '2026-05-01',
      endDate: '2026-05-31',
      targetAudience: '전체 사용자',
      sentCount: 1250,
      totalTarget: 1500,
      conversionRate: 83.3,
    },
    {
      id: 2,
      name: '프리미엄 멤버십 프로모션',
      status: 'scheduled',
      startDate: '2026-06-01',
      endDate: '2026-06-15',
      targetAudience: '무료 사용자',
      sentCount: 0,
      totalTarget: 3000,
      conversionRate: 0,
    },
    {
      id: 3,
      name: '휴면 사용자 복귀 캠페인',
      status: 'completed',
      startDate: '2026-04-01',
      endDate: '2026-04-30',
      targetAudience: '30일 미활동 사용자',
      sentCount: 450,
      totalTarget: 500,
      conversionRate: 90,
    },
  ];

  // 이벤트 목록 (예시)
  const events = [
    {
      id: 1,
      name: '월요일 아침 동기부여',
      type: 'recurring',
      frequency: '매주 월요일 7:00 AM',
      targetAudience: '전체 사용자',
      status: 'active',
      messageTemplate: '새로운 한 주의 시작입니다! 건강한 목표를 세워보세요.',
    },
    {
      id: 2,
      name: '주말 휴식 안내',
      type: 'recurring',
      frequency: '매주 토요일 6:00 PM',
      targetAudience: '활동 중인 사용자',
      status: 'active',
      messageTemplate: '주말에는 충분한 휴식을 취하세요. 건강한 수면이 중요합니다.',
    },
    {
      id: 3,
      name: '월말 성과 보상',
      type: 'scheduled',
      frequency: '매월 마지막 날',
      targetAudience: '상위 20% 사용자',
      status: 'scheduled',
      messageTemplate: '이번 달 훌륭한 성과를 축하합니다! 특별 보상을 받으세요.',
    },
  ];

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">이벤트 관리</h1>
          <p className="text-muted-foreground mt-2">캠페인 및 반복 이벤트 관리</p>
        </div>
        <Button size="lg" className="gap-2">
          <Plus className="w-4 h-4" />
          새 이벤트 생성
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              활성 캠페인
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">1</div>
            <p className="text-xs text-muted-foreground mt-1">진행 중</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              발송 대상
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">1.5K</div>
            <p className="text-xs text-muted-foreground mt-1">총 사용자</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Send className="w-4 h-4" />
              발송 완료
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">1.25K</div>
            <p className="text-xs text-muted-foreground mt-1">성공률 83%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              반복 이벤트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">2</div>
            <p className="text-xs text-muted-foreground mt-1">활성</p>
          </CardContent>
        </Card>
      </div>

      {/* 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns">캠페인</TabsTrigger>
          <TabsTrigger value="events">반복 이벤트</TabsTrigger>
          <TabsTrigger value="settings">설정</TabsTrigger>
        </TabsList>

        {/* 캠페인 탭 */}
        <TabsContent value="campaigns" className="space-y-2">
          <div className="space-y-2">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{campaign.name}</h3>
                        <Badge 
                          variant={
                            campaign.status === 'active' ? 'default' :
                            campaign.status === 'scheduled' ? 'secondary' : 'outline'
                          }
                        >
                          {campaign.status === 'active' ? '진행 중' :
                           campaign.status === 'scheduled' ? '예정' : '완료'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {campaign.startDate} ~ {campaign.endDate}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">타겟 대상</p>
                      <p className="text-sm font-semibold">{campaign.targetAudience}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">발송 현황</p>
                      <p className="text-sm font-semibold">{campaign.sentCount} / {campaign.totalTarget}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">성공률</p>
                      <p className="text-sm font-semibold">{campaign.conversionRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">진행률</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(campaign.sentCount / campaign.totalTarget) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="gap-2">
                      <Edit2 className="w-4 h-4" />
                      수정
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Send className="w-4 h-4" />
                      발송
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2 text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 반복 이벤트 탭 */}
        <TabsContent value="events" className="space-y-2">
          <div className="space-y-2">
            {events.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{event.name}</h3>
                        <Badge 
                          variant={event.status === 'active' ? 'default' : 'secondary'}
                        >
                          {event.status === 'active' ? '활성' : '예정'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{event.frequency}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">타겟 대상</p>
                      <p className="text-sm font-semibold">{event.targetAudience}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">유형</p>
                      <p className="text-sm font-semibold">
                        {event.type === 'recurring' ? '반복' : '예정'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">메시지 템플릿</p>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm">{event.messageTemplate}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="gap-2">
                      <Edit2 className="w-4 h-4" />
                      수정
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Send className="w-4 h-4" />
                      테스트 발송
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2 text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 설정 탭 */}
        <TabsContent value="settings" className="space-y-2">
          <Card>
            <CardHeader>
              <CardTitle>이벤트 관리 설정</CardTitle>
              <CardDescription>이벤트 발송 및 타겟팅 설정</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">발송 시간대</p>
                <p className="text-sm text-muted-foreground">이벤트 발송 가능 시간을 설정합니다</p>
                <div className="flex gap-2">
                  <input type="time" className="border rounded px-2 py-1" defaultValue="07:00" />
                  <span className="text-sm text-muted-foreground">~</span>
                  <input type="time" className="border rounded px-2 py-1" defaultValue="22:00" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">일일 발송 제한</p>
                <p className="text-sm text-muted-foreground">사용자당 일일 최대 발송 횟수</p>
                <input type="number" className="border rounded px-2 py-1 w-20" defaultValue="5" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">재시도 정책</p>
                <p className="text-sm text-muted-foreground">발송 실패 시 재시도 횟수</p>
                <input type="number" className="border rounded px-2 py-1 w-20" defaultValue="3" />
              </div>
              <Button>저장</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
