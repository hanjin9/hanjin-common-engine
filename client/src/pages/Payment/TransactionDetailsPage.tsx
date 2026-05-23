import React from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Download, TrendingDown, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter } from 'recharts';
import { toast } from 'sonner';

export default function TransactionDetailsPage() {
  const [, setLocation] = useLocation();

  const transactionTrend = [
    { date: '5월 18일', avgAmount: 37500, count: 12 },
    { date: '5월 19일', avgAmount: 34667, count: 15 },
    { date: '5월 20일', avgAmount: 34286, count: 14 },
    { date: '5월 21일', avgAmount: 33889, count: 18 },
    { date: '5월 22일', avgAmount: 34375, count: 16 },
  ];

  const transactionByAmount = [
    { range: '~10,000', count: 5, percentage: 7 },
    { range: '10,001~20,000', count: 12, percentage: 16 },
    { range: '20,001~50,000', count: 35, percentage: 47 },
    { range: '50,001~100,000', count: 18, percentage: 24 },
    { range: '100,000~', count: 5, percentage: 6 },
  ];

  const transactionStats = [
    { label: '최고 거래액', value: '₩199,000', detail: '2026-05-21' },
    { label: '최저 거래액', value: '₩9,000', detail: '2026-05-20' },
    { label: '중간값', value: '₩34,500', detail: '50% 지점' },
    { label: '표준편차', value: '₩28,450', detail: '변동성' },
  ];

  const handleExport = () => {
    toast.success('거래 데이터가 다운로드되었습니다');
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
            <h1 className="text-3xl font-bold flex items-center gap-1.5">
              <CreditCard className="h-8 w-8 text-purple-500" />
              평균 거래액 상세
            </h1>
            <p className="text-gray-600 mt-2">거래 패턴 및 분석</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-600">평균 거래액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">₩34,800</div>
            <p className="text-xs text-gray-500 mt-1">이달 평균</p>
            <Badge className="mt-2 bg-purple-100 text-purple-700">안정적</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-600">총 거래건수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">75건</div>
            <p className="text-xs text-gray-500 mt-1">이달 누적</p>
            <Badge className="mt-2 bg-blue-100 text-blue-700">일평균 15건</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-600">최고 거래액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">₩199,000</div>
            <p className="text-xs text-gray-500 mt-1">최대값</p>
            <Badge className="mt-2 bg-green-100 text-green-700">
              <TrendingUp className="h-3 w-3 mr-1" />
              5.7배
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-600">최저 거래액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">₩9,000</div>
            <p className="text-xs text-gray-500 mt-1">최소값</p>
            <Badge className="mt-2 bg-red-100 text-red-700">
              <TrendingDown className="h-3 w-3 mr-1" />
              0.26배
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* 일별 평균 거래액 추이 */}
      <Card>
        <CardHeader>
          <CardTitle>일별 평균 거래액 추이</CardTitle>
          <CardDescription>최근 5일간의 거래액 변화</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={transactionTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `₩${value.toLocaleString()}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgAmount"
                stroke="#a855f7"
                name="평균 거래액"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 거래액 분포 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>거래액 범위별 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={transactionByAmount}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#a855f7" name="거래건수" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>거래액 범위별 구성</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {transactionByAmount.map((item, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{item.range}</span>
                  <Badge variant="outline">{item.percentage}%</Badge>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">{item.count}건</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-purple-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 거래 통계 */}
      <Card>
        <CardHeader>
          <CardTitle>거래 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {transactionStats.map((stat, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <p className="text-xs text-gray-600 mb-1">{stat.label}</p>
                <p className="text-lg font-bold text-purple-600">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.detail}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 거래 패턴 분석 */}
      <Card>
        <CardHeader>
          <CardTitle>거래 패턴 분석</CardTitle>
          <CardDescription>고객 거래 행동 분석</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg bg-blue-50">
            <h4 className="font-semibold text-blue-900 mb-2">주요 발견사항</h4>
            <ul className="space-y-1 text-sm text-blue-900">
              <li>• 20,001~50,000원 범위의 거래가 가장 많음 (47%)</li>
              <li>• 평균 거래액은 안정적으로 유지 중 (변동률 3.2%)</li>
              <li>• 고액 거래(100,000원 이상)는 전체의 6%</li>
              <li>• 소액 거래(10,000원 이하)는 전체의 7%</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-xs text-gray-600 mb-2">거래액 증감</p>
              <p className="text-2xl font-bold text-green-600">+2.3%</p>
              <p className="text-xs text-gray-500">전월 대비</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-xs text-gray-600 mb-2">거래 빈도</p>
              <p className="text-2xl font-bold text-blue-600">15건/일</p>
              <p className="text-xs text-gray-500">일평균</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
