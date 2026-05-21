import React from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function StatsDashboard() {
  const { data: stats, isLoading } = trpc.admin.getAnalytics.useQuery();

  if (isLoading) return <div className="flex justify-center p-8"><Spinner /></div>;

  const membershipData = [
    { name: '실버', value: 45 },
    { name: '골드', value: 78 },
    { name: '블루사파이어', value: 56 },
    { name: '그린에메랄드', value: 34 },
    { name: '다이아몬드', value: 23 },
  ];

  const revenueData = [
    { month: '1월', revenue: 45000, users: 120 },
    { month: '2월', revenue: 52000, users: 145 },
    { month: '3월', revenue: 48000, users: 138 },
    { month: '4월', revenue: 61000, users: 167 },
    { month: '5월', revenue: 55000, users: 152 },
  ];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a4de6c'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">통계 분석</h1>
        <p className="text-gray-600 mt-2">전체 통계 및 분석 현황</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">총 회원</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMembers || 0}</div>
            <p className="text-xs text-green-600 mt-1">+12% 증가</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">월 매출</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩{(stats?.monthlyRevenue || 0).toLocaleString()}</div>
            <p className="text-xs text-green-600 mt-1">+8% 증가</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">활성률</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeRate || 0}%</div>
            <p className="text-xs text-gray-500 mt-1">지난 30일</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">평균 점수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgScore || 0}</div>
            <p className="text-xs text-gray-500 mt-1">웰니스 점수</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>멤버십 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={membershipData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {membershipData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>월별 매출 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#8884d8" name="매출" />
                <Bar dataKey="users" fill="#82ca9d" name="신규 회원" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>주요 지표</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">평균 세션 시간</p>
              <p className="text-lg font-semibold mt-1">24분 30초</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">재방문율</p>
              <p className="text-lg font-semibold mt-1">68%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">전환율</p>
              <p className="text-lg font-semibold mt-1">12.5%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
