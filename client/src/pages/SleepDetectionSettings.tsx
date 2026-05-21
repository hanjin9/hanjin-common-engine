import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Moon, Settings, Activity, AlertCircle, CheckCircle, Zap } from 'lucide-react';

/**
 * 수면 감지 전체 시스템 설정 페이지
 * 
 * 기능:
 * - 전체 시스템 설정
 * - 개인별 감지 설정
 * - 알림 및 피드백 설정
 */
export default function SleepDetectionSettings() {
  const [activeTab, setActiveTab] = useState('system');
  const [systemEnabled, setSystemEnabled] = useState(true);
  const [autoDetection, setAutoDetection] = useState(true);

  // 시스템 설정 상태
  const systemStatus = {
    status: 'active',
    connectedDevices: 12,
    activeUsers: 450,
    dataPoints: 15234,
    lastUpdate: '2026-05-22 10:30:00',
  };

  // 감지 규칙 (예시)
  const detectionRules = [
    {
      id: 1,
      name: '정상 수면',
      criteria: '6-8시간 수면',
      quality: '7-10점',
      status: 'active',
      userCount: 350,
    },
    {
      id: 2,
      name: '부족한 수면',
      criteria: '4-6시간 수면',
      quality: '4-6점',
      status: 'active',
      userCount: 80,
    },
    {
      id: 3,
      name: '과다 수면',
      criteria: '9시간 이상',
      quality: '3-5점',
      status: 'active',
      userCount: 20,
    },
  ];

  // 개인 설정 (예시)
  const userSettings = [
    {
      id: 1,
      userName: '김철수',
      targetSleep: '8시간',
      detectionEnabled: true,
      notificationEnabled: true,
      feedbackEnabled: true,
      lastSync: '2026-05-22 08:30',
      status: 'synced',
    },
    {
      id: 2,
      userName: '이영희',
      targetSleep: '7시간',
      detectionEnabled: true,
      notificationEnabled: true,
      feedbackEnabled: true,
      lastSync: '2026-05-22 07:15',
      status: 'synced',
    },
    {
      id: 3,
      userName: '박민수',
      targetSleep: '6시간',
      detectionEnabled: false,
      notificationEnabled: false,
      feedbackEnabled: true,
      lastSync: '2026-05-21 22:00',
      status: 'pending',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Moon className="w-8 h-8" />
            수면 감지 시스템
          </h1>
          <p className="text-muted-foreground mt-2">전체 시스템 설정 및 관리</p>
        </div>
        <Badge variant={systemStatus.status === 'active' ? 'default' : 'secondary'}>
          {systemStatus.status === 'active' ? '정상 작동' : '점검 중'}
        </Badge>
      </div>

      {/* 시스템 상태 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">연결된 기기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStatus.connectedDevices}</div>
            <p className="text-xs text-muted-foreground mt-1">활성</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">활성 사용자</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStatus.activeUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">감지 중</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">데이터 포인트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStatus.dataPoints}</div>
            <p className="text-xs text-muted-foreground mt-1">누적</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">마지막 업데이트</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold">{systemStatus.lastUpdate}</p>
            <p className="text-xs text-muted-foreground mt-1">정상</p>
          </CardContent>
        </Card>
      </div>

      {/* 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="system">시스템 설정</TabsTrigger>
          <TabsTrigger value="rules">감지 규칙</TabsTrigger>
          <TabsTrigger value="users">사용자 설정</TabsTrigger>
        </TabsList>

        {/* 시스템 설정 탭 */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>전체 시스템 설정</CardTitle>
              <CardDescription>수면 감지 시스템의 전체 설정</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 시스템 활성화 */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">시스템 활성화</p>
                  <p className="text-sm text-muted-foreground">수면 감지 시스템 전체 활성화/비활성화</p>
                </div>
                <Switch checked={systemEnabled} onCheckedChange={setSystemEnabled} />
              </div>

              {/* 자동 감지 */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">자동 감지</p>
                  <p className="text-sm text-muted-foreground">사용자 개입 없이 자동으로 수면 감지</p>
                </div>
                <Switch checked={autoDetection} onCheckedChange={setAutoDetection} />
              </div>

              {/* 감지 시작 시간 */}
              <div className="space-y-2">
                <p className="font-medium">감지 시작 시간</p>
                <p className="text-sm text-muted-foreground">매일 수면 감지를 시작할 시간</p>
                <Input type="time" defaultValue="21:00" />
              </div>

              {/* 감지 종료 시간 */}
              <div className="space-y-2">
                <p className="font-medium">감지 종료 시간</p>
                <p className="text-sm text-muted-foreground">매일 수면 감지를 종료할 시간</p>
                <Input type="time" defaultValue="09:00" />
              </div>

              {/* 감지 민감도 */}
              <div className="space-y-2">
                <p className="font-medium">감지 민감도</p>
                <p className="text-sm text-muted-foreground">수면 감지의 민감도 조절</p>
                <Select defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">낮음 (정확도 70%)</SelectItem>
                    <SelectItem value="medium">중간 (정확도 85%)</SelectItem>
                    <SelectItem value="high">높음 (정확도 95%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 데이터 보관 기간 */}
              <div className="space-y-2">
                <p className="font-medium">데이터 보관 기간</p>
                <p className="text-sm text-muted-foreground">수면 데이터 보관 기간</p>
                <Select defaultValue="90">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30일</SelectItem>
                    <SelectItem value="90">90일</SelectItem>
                    <SelectItem value="180">180일</SelectItem>
                    <SelectItem value="365">1년</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full">설정 저장</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 감지 규칙 탭 */}
        <TabsContent value="rules" className="space-y-4">
          <div className="space-y-4">
            {detectionRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{rule.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {rule.criteria} • 품질: {rule.quality}
                      </p>
                    </div>
                    <Badge variant="default">활성</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium">해당 사용자</p>
                      <p className="text-2xl font-bold">{rule.userCount}</p>
                    </div>
                    <Activity className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">수정</Button>
                    <Button size="sm" variant="outline">테스트</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 사용자 설정 탭 */}
        <TabsContent value="users" className="space-y-4">
          <div className="space-y-4">
            {userSettings.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{user.userName}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        목표 수면: {user.targetSleep}
                      </p>
                    </div>
                    <Badge 
                      variant={user.status === 'synced' ? 'default' : 'secondary'}
                    >
                      {user.status === 'synced' ? '동기화됨' : '대기 중'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">감지</p>
                        <p className="text-sm font-semibold">
                          {user.detectionEnabled ? '활성' : '비활성'}
                        </p>
                      </div>
                      {user.detectionEnabled ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">알림</p>
                        <p className="text-sm font-semibold">
                          {user.notificationEnabled ? '활성' : '비활성'}
                        </p>
                      </div>
                      {user.notificationEnabled ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">피드백</p>
                        <p className="text-sm font-semibold">
                          {user.feedbackEnabled ? '활성' : '비활성'}
                        </p>
                      </div>
                      {user.feedbackEnabled ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">마지막 동기화: {user.lastSync}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">수정</Button>
                    <Button size="sm" variant="outline">동기화</Button>
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
