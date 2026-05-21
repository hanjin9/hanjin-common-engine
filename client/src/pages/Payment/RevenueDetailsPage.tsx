import React from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';

export default function RevenueDetailsPage() {
  const [, setLocation] = useLocation();

  const revenueByDay = [
    { date: '5월 18일', revenue: 450000, transactions: 12 },
    { date: '5월 19일', revenue: 520000, transactions: 15 },
    { date: '5월 20일', revenue: 480000, transactions: 14 },
    { date: '5월 21일', revenue: 610000, transactions: 18 },
    { date: '5월 22일', revenue: 550000, transactions: 16 },
  ];

  const revenueByPaymentMethod = [
    { method: '카드', amount: 1575000, percentage: 60 },
    { method: '모바일', amount: 700000, percentage: 27 },
    { method: '계좌이체', amount: 335000, percentage: 13 },
  ];

  const handleExport = () => {
    toast.success('매출 데이터가 다운로드되었습니다');
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/admin/payment')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-green-500" />
              이달 매출 상세
            </h1>
            <p className="text-gray-600 mt-2">2026년 5월 매출 분석</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          다운로드
        </Button>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">총 매출</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">₩2,610,000</div>
            <p className="text-xs text-gray-500 mt-1">이달 누적</p>
            <Badge className="mt-2 bg-green-100 text-green-700">↑ 18% 증가</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">총 거래건수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">75건</div>
            <p className="text-xs text-gray-500 mt-1">일평균 15건</p>
            <Badge className="mt-2 bg-blue-100 text-blue-700">→ 안정적</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">평균 거래액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">₩34,800</div>
            <p className="text-xs text-gray-500 mt-1">거래당 평균</p>
            <Badge className="mt-2 bg-purple-100 text-purple-700">정상 범위</Badge>
          </CardContent>
        </Card>
      </div>

      {/* 일별 매출 추이 */}
      <Card>
        <CardHeader>
          <CardTitle>일별 매출 추이</CardTitle>
          <CardDescription>최근 5일간의 매출 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `₩${value.toLocaleString()}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                name="매출액"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 결제 수단별 매출 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>결제 수단별 매출</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueByPaymentMethod}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="method" />
                <YAxis />
                <Tooltip formatter={(value) => `₩${value.toLocaleString()}`} />
                <Bar dataKey="amount" fill="#3b82f6" name="매출액" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>결제 수단별 구성</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {revenueByPaymentMethod.map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{item.method}</span>
                  <Badge variant="outline">{item.percentage}%</Badge>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">₩{item.amount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 상세 통계 */}
      <Card>
        <CardHeader>
          <CardTitle>상세 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '최고 매출일', value: '5월 21일', detail: '₩610,000' },
              { label: '최저 매출일', value: '5월 20일', detail: '₩480,000' },
              { label: '일평균 매출', value: '₩522,000', detail: '5일 기준' },
              { label: '전월 대비', value: '+18%', detail: '증가' },
            ].map((stat, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <p className="text-xs text-gray-600 mb-1">{stat.label}</p>
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.detail}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
