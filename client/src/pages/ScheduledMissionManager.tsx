import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Users, CheckCircle, AlertCircle, Plus, Edit2, Trash2, Play } from 'lucide-react';

/**
 * 스케줄된 미션 관리 페이지
 * 
 * 기능:
 * - 미션 자동 발송 스케줄 관리
 * - 주간 미션 설정
 * - 발송 이력 추적
 */
export default function ScheduledMissionManager() {
  const [activeTab, setActiveTab] = useState('scheduled');

  // 스케줄된 미션 (예시)
  const scheduledMissions = [
    {
      id: 1,
      name: '월요일 아침 운동 미션',
      schedule: '매주 월요일 07:00',
      targetAudience: '전체 사용자',
      missionType: 'exercise',
      duration: '30분',
      reward: '100 포인트',
      status: 'active',
      nextRun: '2026-05-26 07:00',
      totalRuns: 12,
      successRate: 85,
    },
    {
      id: 2,
      name: '수요일 명상 미션',
      schedule: '매주 수요일 12:00',
      targetAudience: '프리미엄 사용자',
      missionType: 'meditation',
      duration: '15분',
      reward: '50 포인트',
      status: 'active',
      nextRun: '2026-05-28 12:00',
      totalRuns: 8,
      successRate: 92,
    },
    {
      id: 3,
      name: '금요일 건강 체크',
      schedule: '매주 금요일 18:00',
      targetAudience: '전체 사용자',
      missionType: 'health_check',
      duration: '10분',
      reward: '75 포인트',
      status: 'active',
      nextRun: '2026-05-30 18:00',
      totalRuns: 10,
      successRate: 78,
    },
    {
      id: 4,
      name: '월말 건강 리뷰',
      schedule: '매월 마지막 금요일 19:00',
      targetAudience: '전체 사용자',
      missionType: 'review',
      duration: '20분',
      reward: '200 포인트',
      status: 'scheduled',
      nextRun: '2026-05-30 19:00',
      totalRuns: 1,
      successRate: 0,
    },
  ];

  // 주간 미션 (예시)
  const weeklyMissions = [
    {
      id: 1,
      week: '5월 3주차',
      missions: [
        { day: '월', name: '운동', target: 300, current: 245 },
        { day: '수', name: '명상', target: 100, current: 92 },
        { day: '금', name: '건강 체크', target: 150, current: 150 },
      ],
      completionRate: 85,
    },
    {
      id: 2,
      week: '5월 4주차',
      missions: [
        { day: '월', name: '운동', target: 300, current: 0 },
        { day: '수', name: '명상', target: 100, current: 0 },
        { day: '금', name: '건강 체크', target: 150, current: 0 },
      ],
      completionRate: 0,
    },
  ];

  // 발송 이력 (예시)
  const sendHistory = [
    {
      id: 1,
      missionName: '월요일 아침 운동 미션',
      sentAt: '2026-05-22 07:00',
      targetCount: 1500,
      sentCount: 1450,
      completedCount: 1232,
      status: 'completed',
    },
    {
      id: 2,
      missionName: '수요일 명상 미션',
      sentAt: '2026-05-21 12:00',
      targetCount: 800,
      sentCount: 780,
      completedCount: 717,
      status: 'completed',
    },
  ];

  return (
    <div className="space-y-1.5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">스케줄러 관리</h1>
          <p className="text-muted-foreground mt-2">미션 자동 발송 스케줄 관리</p>
        </div>
        <Button size="lg" className="gap-2">
          <Plus className="w-4 h-4" />
          새 미션 스케줄
        </Button>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-1.5">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base font-medium flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              활성 스케줄
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-base font-bold truncate">3</div>
            <p className="text-xs text-muted-foreground mt-1">진행 중</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base font-medium flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              예정된 미션
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-base font-bold truncate">4</div>
            <p className="text-xs text-muted-foreground mt-1">이번 주</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base font-medium flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              총 참여자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-base font-bold truncate">1.5K</div>
            <p className="text-xs text-muted-foreground mt-1">사용자</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base font-medium">평균 완료율</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-base font-bold truncate">85%</div>
            <p className="text-xs text-muted-foreground mt-1">성공</p>
          </CardContent>
        </Card>
      </div>

      {/* 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scheduled">스케줄된 미션</TabsTrigger>
          <TabsTrigger value="weekly">주간 미션</TabsTrigger>
          <TabsTrigger value="history">발송 이력</TabsTrigger>
        </TabsList>

        {/* 스케줄된 미션 탭 */}
        <TabsContent value="scheduled" className="space-y-1.5">
          <div className="space-y-1.5">
            {scheduledMissions.map((mission) => (
              <Card key={mission.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{mission.name}</h3>
                        <Badge variant={mission.status === 'active' ? 'default' : 'secondary'}>
                          {mission.status === 'active' ? '활성' : '예정'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{mission.schedule}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">타겟</p>
                      <p className="text-sm font-semibold">{mission.targetAudience}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">소요 시간</p>
                      <p className="text-sm font-semibold">{mission.duration}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">보상</p>
                      <p className="text-sm font-semibold">{mission.reward}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">완료율</p>
                      <p className="text-sm font-semibold">{mission.successRate}%</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">다음 실행</p>
                    <p className="text-sm">{mission.nextRun}</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="gap-2">
                      <Play className="w-4 h-4" />
                      지금 실행
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Edit2 className="w-4 h-4" />
                      수정
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

        {/* 주간 미션 탭 */}
        <TabsContent value="weekly" className="space-y-1.5">
          <div className="space-y-1.5">
            {weeklyMissions.map((week) => (
              <Card key={week.id}>
                <CardHeader>
                  <h3 className="text-lg font-semibold">{week.week}</h3>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  <div className="space-y-1.5">
                    {week.missions.map((mission, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary">{mission.day}</Badge>
                            <span className="font-medium">{mission.name}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(mission.current / mission.target) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-sm font-semibold">{mission.current} / {mission.target}</p>
                          <p className="text-xs text-muted-foreground">
                            {((mission.current / mission.target) * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm font-medium">주간 완료율</p>
                    <p className="text-lg font-bold">{week.completionRate}%</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 발송 이력 탭 */}
        <TabsContent value="history" className="space-y-1.5">
          <div className="space-y-1.5">
            {sendHistory.map((history) => (
              <Card key={history.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{history.missionName}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{history.sentAt}</p>
                    </div>
                    <Badge variant="default">완료</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  <div className="grid grid-cols-3 gap-1.5">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">발송 대상</p>
                      <p className="text-base font-bold truncate">{history.targetCount}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">발송 완료</p>
                      <p className="text-2xl font-bold text-blue-600">{history.sentCount}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">완료</p>
                      <p className="text-2xl font-bold text-green-600">{history.completedCount}</p>
                    </div>
                  </div>
                  <div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(history.completedCount / history.sentCount) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      완료율: {((history.completedCount / history.sentCount) * 100).toFixed(1)}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
