import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { Activity, AlertTriangle, Users, TrendingUp, RefreshCw, AlertCircle, Server } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MonitoringDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: stats, isLoading, refetch } = trpc.admin.getSystemStats.useQuery();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.loading('모니터링 데이터를 새로고침 중...');
    await refetch();
    setIsRefreshing(false);
    toast.success('모니터링 데이터가 업데이트되었습니다');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Spinner className="h-8 w-8" />
        <p className="text-muted-foreground">모니터링 데이터를 불러오는 중...</p>
      </div>
    );
  }

  const chartData = [
    { time: '00:00', activeUsers: 45, requests: 120 },
    { time: '04:00', activeUsers: 32, requests: 89 },
    { time: '08:00', activeUsers: 78, requests: 234 },
    { time: '12:00', activeUsers: 156, requests: 456 },
    { time: '16:00', activeUsers: 198, requests: 567 },
    { time: '20:00', activeUsers: 234, requests: 678 },
    { time: '24:00', activeUsers: 89, requests: 234 },
  ];

  const serverStatus = [
    { name: 'CPU 사용률', value: 45, status: 'normal' },
    { name: '메모리 사용률', value: 62, status: 'normal' },
    { name: '디스크 사용률', value: 78, status: 'warning' },
  ];

  const getStatusColor = (value: number) => {
    if (value < 50) return 'text-green-600';
    if (value < 80) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-3 p-3 md:p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold truncate">시스템 모니터링</h1>
          <p className="text-gray-600 mt-2">실시간 시스템 상태 모니터링</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* KPI 카드 4개 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5">
        <Card className="hover:shadow-lg hover:scale-105 transition-all cursor-pointer">
          <CardHeader className="pb-1">
            <CardTitle className="text-base font-medium text-gray-600 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-blue-500" />
              활성 사용자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.activeUsers || 0}</div>
            <p className="text-xs text-gray-500 mt-1">실시간 접속자</p>
            <Badge className="mt-2 bg-blue-100 text-blue-700">↑ 12% 증가</Badge>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:scale-105 transition-all cursor-pointer">
          <CardHeader className="pb-1">
            <CardTitle className="text-base font-medium text-gray-600 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              총 요청
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats?.totalRequests || 0}</div>
            <p className="text-xs text-gray-500 mt-1">오늘 총 요청 수</p>
            <Badge className="mt-2 bg-purple-100 text-purple-700">↑ 8% 증가</Badge>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:scale-105 transition-all cursor-pointer">
          <CardHeader className="pb-1">
            <CardTitle className="text-base font-medium text-gray-600 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              에러율
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(stats?.errorRate || 0)}`}>
              {stats?.errorRate || 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">시스템 에러율</p>
            <Badge className="mt-2 bg-green-100 text-green-700">↓ 0.2% 감소</Badge>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:scale-105 transition-all cursor-pointer">
          <CardHeader className="pb-1">
            <CardTitle className="text-base font-medium text-gray-600 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-green-500" />
              응답시간
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.avgResponseTime || 0}ms</div>
            <p className="text-xs text-gray-500 mt-1">평균 응답시간</p>
            <Badge className="mt-2 bg-green-100 text-green-700">✓ 정상</Badge>
          </CardContent>
        </Card>
      </div>

      {/* 트래픽 차트 */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <TrendingUp className="h-5 w-5" />
            시스템 트래픽 추이
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="activeUsers" stroke="#3b82f6" name="활성 사용자" strokeWidth={2} />
              <Line type="monotone" dataKey="requests" stroke="#10b981" name="요청 수" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 서버 상태 + 최근 알림 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {/* 서버 상태 */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Server className="h-5 w-5" />
              서버 상태
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {serverStatus.map((item, i) => (
              <div 
                key={i}
                className="p-3 border rounded-lg hover:shadow-md transition-all hover:scale-102 cursor-pointer"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className={`font-semibold ${getStatusColor(item.value)}`}>{item.value}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      item.value < 50 ? 'bg-green-500' :
                      item.value < 80 ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 최근 알림 */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              최근 알림
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {[
              { icon: '⚠️', text: '메모리 사용률 상승 감지', time: '2분 전' },
              { icon: '⏱️', text: '데이터베이스 연결 지연', time: '5분 전' },
              { icon: '✅', text: '백업 작업 완료', time: '1시간 전' },
            ].map((alert, i) => (
              <div 
                key={i}
                className="p-2 border rounded hover:shadow-md transition-all hover:scale-102 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span>{alert.icon}</span>
                    <span className="text-sm">{alert.text}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{alert.time}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 서비스 상태 */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Activity className="h-5 w-5 text-green-500" />
            서비스 상태
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'API 서버', status: 'online' },
              { name: '데이터베이스', status: 'online' },
              { name: '캐시 서버', status: 'online' },
              { name: '메시지 큐', status: 'online' },
              { name: 'CDN', status: 'online' },
              { name: '백업 시스템', status: 'online' },
            ].map((service, i) => (
              <div 
                key={i}
                className="p-3 border rounded-lg hover:shadow-md transition-all hover:scale-102 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{service.name}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-green-600">온라인</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
