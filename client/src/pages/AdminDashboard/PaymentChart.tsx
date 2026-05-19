import React from 'react';
import { Card } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

/**
 * 결제/구독 현황 차트
 * 국제 타이포그래피 스타일 기반
 */

// 월별 매출 데이터
const monthlyRevenueData = [
  { month: '1월', revenue: 45000, subscriptions: 120 },
  { month: '2월', revenue: 52000, subscriptions: 135 },
  { month: '3월', revenue: 48000, subscriptions: 128 },
  { month: '4월', revenue: 61000, subscriptions: 155 },
  { month: '5월', revenue: 55000, subscriptions: 142 },
];

// 구독 플랜 분포
const subscriptionDistribution = [
  { name: '기본', value: 245, color: '#BDBDBD' },
  { name: '프리미엄', value: 380, color: '#E53935' },
  { name: '엔터프라이즈', value: 95, color: '#212121' },
];

// 결제 상태 분포
const paymentStatus = [
  { name: '성공', value: 650, color: '#2E7D32' },
  { name: '대기', value: 45, color: '#F57C00' },
  { name: '실패', value: 25, color: '#D32F2F' },
];

export default function PaymentChart() {
  return (
    <div className="space-y-8">
      {/* 제목 */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-5xl font-bold text-black mb-2">
          결제 및 구독 현황
        </h1>
        <p className="text-gray-600 text-lg">
          프로젝트별 매출, 구독 추이, 결제 상태를 분석합니다
        </p>
      </div>

      {/* 월별 매출 및 구독 추이 */}
      <Card className="p-8 border-gray-200">
        <h2 className="text-2xl font-bold text-black mb-6">
          월별 매출 및 구독 추이
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyRevenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
            <XAxis dataKey="month" stroke="#757575" />
            <YAxis stroke="#757575" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E0E0E0',
                borderRadius: '0.5rem',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#E53935"
              strokeWidth={2}
              dot={{ fill: '#E53935', r: 4 }}
              name="매출 ($)"
            />
            <Line
              type="monotone"
              dataKey="subscriptions"
              stroke="#424242"
              strokeWidth={2}
              dot={{ fill: '#424242', r: 4 }}
              name="구독 수"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* 구독 플랜 분포 및 결제 상태 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 구독 플랜 분포 */}
        <Card className="p-8 border-gray-200">
          <h2 className="text-2xl font-bold text-black mb-6">
            구독 플랜 분포
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={subscriptionDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {subscriptionDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-6 space-y-2">
            {subscriptionDistribution.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-semibold text-black">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* 결제 상태 분포 */}
        <Card className="p-8 border-gray-200">
          <h2 className="text-2xl font-bold text-black mb-6">
            결제 상태 분포
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={paymentStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-6 space-y-2">
            {paymentStatus.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-semibold text-black">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 프로젝트별 매출 비교 */}
      <Card className="p-8 border-gray-200">
        <h2 className="text-2xl font-bold text-black mb-6">
          프로젝트별 매출 비교
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={[
              { project: '장부관리사', revenue: 12450 },
              { project: '스포츠회복사', revenue: 8920 },
              { project: '로또', revenue: 34210 },
              { project: 'GLWA', revenue: 5670 },
              { project: '숨호흡', revenue: 21340 },
              { project: '랜딩', revenue: 45670 },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
            <XAxis dataKey="project" stroke="#757575" />
            <YAxis stroke="#757575" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E0E0E0',
                borderRadius: '0.5rem',
              }}
            />
            <Bar
              dataKey="revenue"
              fill="#E53935"
              radius={[4, 4, 0, 0]}
              name="매출 ($)"
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
