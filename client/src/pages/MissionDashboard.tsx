import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { Zap, Target, Users, TrendingUp, RefreshCw, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function MissionDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: missions, isLoading, refetch } = trpc.admin.getSystemStats.useQuery();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.loading('미션 데이터를 새로고침 중...');
    await refetch();
    setIsRefreshing(false);
    toast.success('미션 데이터가 업데이트되었습니다');
  };

  const handleCreateMission = () => {
    toast.success('새 미션이 생성되었습니다');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Spinner className="h-8 w-8" />
        <p className="text-muted-foreground">미션 데이터를 불러오는 중...</p>
      </div>
    );
  }

  const difficultyData = [
    { name: '상', value: 45, color: '#ef4444' },
    { name: '중', value: 120, color: '#f59e0b' },
    { name: '하', value: 235, color: '#10b981' },
  ];

  const completionData = [
    { date: '5월 18일', completed: 45, attempted: 120 },
    { date: '5월 19일', completed: 62, attempted: 145 },
    { date: '5월 20일', completed: 58, attempted: 130 },
    { date: '5월 21일', completed: 78, attempted: 165 },
    { date: '5월 22일', completed: 85, attempted: 180 },
  ];

  const missionList = [
    { id: 1, name: '아침 스트레칭 10분', difficulty: '하', participants: 450, completion: 92, reward: '100P' },
    { id: 2, name: '명상 20분', difficulty: '중', participants: 320, completion: 78, reward: '200P' },
    { id: 3, name: '마라톤 완주', difficulty: '상', participants: 85, completion: 65, reward: '500P' },
    { id: 4, name: '요가 클래스 참석', difficulty: '중', participants: 210, completion: 88, reward: '150P' },
    { id: 5, name: '건강식 요리 만들기', difficulty: '하', participants: 380, completion: 95, reward: '100P' },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8" />
            미션 관리
          </h1>
          <p className="text-gray-600 mt-2">미션 현황 · 참여 통계 · 보상 관리</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button 
            onClick={handleCreateMission}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            미션 생성
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg hover:scale-105 transition-all cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              활성 미션
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">400</div>
            <p className="text-xs text-gray-500 mt-1">진행 중</p>
            <Badge className="mt-2 bg-blue-100 text-blue-700">↑ 12% 증가</Badge>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:scale-105 transition-all cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              총 참여자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">1,445</div>
            <p className="text-xs text-gray-500 mt-1">이달</p>
            <Badge className="mt-2 bg-green-100 text-green-700">↑ 28% 증가</Badge>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:scale-105 transition-all cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              완료율
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">84.2%</div>
            <p className="text-xs text-gray-500 mt-1">평균</p>
            <Badge className="mt-2 bg-yellow-100 text-yellow-700">↑ 5.3% 증가</Badge>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:scale-105 transition-all cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              배분 보상
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">₩2.4M</div>
            <p className="text-xs text-gray-500 mt-1">이달</p>
            <Badge className="mt-2 bg-purple-100 text-purple-700">안정적</Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>난이도별 미션 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={difficultyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {difficultyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>일별 완료 현황</CardTitle>
            <CardDescription>최근 5일간의 미션 완료율</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={completionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#10b981" name="완료" />
                <Bar dataKey="attempted" fill="#3b82f6" name="시도" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>활성 미션 목록</CardTitle>
          <CardDescription>현재 진행 중인 미션 5개</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">미션명</th>
                  <th className="text-center py-2 px-2">난이도</th>
                  <th className="text-center py-2 px-2">참여자</th>
                  <th className="text-center py-2 px-2">완료율</th>
                  <th className="text-right py-2 px-2">보상</th>
                  <th className="text-center py-2 px-2">작업</th>
                </tr>
              </thead>
              <tbody>
                {missionList.map((mission) => (
                  <tr key={mission.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="py-3 px-2 font-medium">{mission.name}</td>
                    <td className="py-3 px-2 text-center">
                      <Badge 
                        className={
                          mission.difficulty === '상' 
                            ? 'bg-red-100 text-red-700'
                            : mission.difficulty === '중'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }
                      >
                        {mission.difficulty}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-center">{mission.participants}</td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-green-500"
                            style={{ width: `${mission.completion}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold">{mission.completion}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right font-semibold text-green-600">{mission.reward}</td>
                    <td className="py-3 px-2 text-center">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs"
                        onClick={() => toast.info('미션이 편집되었습니다')}
                      >
                        편집
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>보상 배분 현황</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: '이달 배분액', value: '₩2,400,000', color: 'bg-green-100 text-green-700' },
              { label: '사용자 보상 70%', value: '₩1,680,000', color: 'bg-blue-100 text-blue-700' },
              { label: '사회 기부 30%', value: '₩720,000', color: 'bg-purple-100 text-purple-700' },
              { label: '남은 예산', value: '₩1,200,000', color: 'bg-gray-100 text-gray-700' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center p-2 border rounded-lg">
                <span className="text-sm font-medium">{item.label}</span>
                <Badge className={item.color}>{item.value}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>상위 참여자</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { rank: 1, name: 'Kim Min-jun', points: 2850, missions: 28 },
              { rank: 2, name: 'Lee Ji-won', points: 2620, missions: 26 },
              { rank: 3, name: 'Park Sung-ho', points: 2480, missions: 24 },
              { rank: 4, name: 'Choi Min-seo', points: 2310, missions: 23 },
              { rank: 5, name: 'Jung Ho-sung', points: 2150, missions: 21 },
            ].map((user) => (
              <div key={user.rank} className="flex items-center justify-between p-2 border rounded-lg hover:shadow-md transition-all">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-700 w-6 h-6 flex items-center justify-center p-0">
                    {user.rank}
                  </Badge>
                  <div>
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.missions}개 미션 완료</p>
                  </div>
                </div>
                <span className="font-semibold text-green-600">{user.points}P</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
