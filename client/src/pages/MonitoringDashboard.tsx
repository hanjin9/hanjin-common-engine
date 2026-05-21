import React from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MonitoringDashboard() {
  const { data: stats, isLoading } = trpc.admin.getSystemStats.useQuery();

  if (isLoading) return <div className="flex justify-center p-8"><Spinner /></div>;

  const chartData = [
    { time: '00:00', activeUsers: 45, requests: 120 },
    { time: '04:00', activeUsers: 32, requests: 89 },
    { time: '08:00', activeUsers: 78, requests: 234 },
    { time: '12:00', activeUsers: 156, requests: 456 },
    { time: '16:00', activeUsers: 198, requests: 567 },
    { time: '20:00', activeUsers: 234, requests: 678 },
    { time: '24:00', activeUsers: 89, requests: 234 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">시스템 모니터링</h1>
        <p className="text-gray-600 mt-2">실시간 시스템 상태 모니터링</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">활성 사용자</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
            <p className="text-xs text-gray-500 mt-1">실시간 접속자</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">총 요청</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRequests || 0}</div>
            <p className="text-xs text-gray-500 mt-1">오늘 총 요청 수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">에러율</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.errorRate || 0}%</div>
            <p className="text-xs text-gray-500 mt-1">시스템 에러율</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">응답시간</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgResponseTime || 0}ms</div>
            <p className="text-xs text-gray-500 mt-1">평균 응답시간</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>시스템 트래픽 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="activeUsers" stroke="#8884d8" name="활성 사용자" />
              <Line type="monotone" dataKey="requests" stroke="#82ca9d" name="요청 수" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>서버 상태</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span>CPU 사용률</span>
              <span className="font-semibold">45%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>메모리 사용률</span>
              <span className="font-semibold">62%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>디스크 사용률</span>
              <span className="font-semibold">78%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>최근 알림</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600">• 메모리 사용률 상승 감지</p>
            <p className="text-sm text-gray-600">• 데이터베이스 연결 지연</p>
            <p className="text-sm text-gray-600">• 백업 작업 완료</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
