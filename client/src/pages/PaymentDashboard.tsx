import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { CreditCard, DollarSign, TrendingUp, AlertCircle, RefreshCw, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PaymentDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: payments, isLoading, refetch } = trpc.admin.getAnalytics.useQuery();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.loading('결제 데이터를 새로고침 중...');
    await refetch();
    setIsRefreshing(false);
    toast.success('결제 데이터가 업데이트되었습니다');
  };

  const handleExport = () => {
    toast.success('결제 이력이 다운로드되었습니다');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Spinner className="h-8 w-8" />
        <p className="text-muted-foreground">결제 데이터를 불러오는 중...</p>
      </div>
    );
  }

  const paymentData = [
    { date: '5월 18일', amount: 450000, count: 12 },
    { date: '5월 19일', amount: 520000, count: 15 },
    { date: '5월 20일', amount: 480000, count: 14 },
    { date: '5월 21일', amount: 610000, count: 18 },
    { date: '5월 22일', amount: 550000, count: 16 },
  ];

  const paymentHistory = [
    { id: 1, date: '2026-05-22', amount: 99000, status: 'completed', customer: 'Kim Min-jun', method: 'Card' },
    { id: 2, date: '2026-05-22', amount: 49000, status: 'completed', customer: 'Lee Ji-won', method: 'Mobile' },
    { id: 3, date: '2026-05-21', amount: 199000, status: 'completed', customer: 'Park Sung-ho', method: 'Card' },
    { id: 4, date: '2026-05-21', amount: 149000, status: 'pending', customer: 'Choi Min-seo', method: 'Bank' },
    { id: 5, date: '2026-05-20', amount: 99000, status: 'failed', customer: 'Jung Ho-sung', method: 'Card' },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8" />
            결제 관리
          </h1>
          <p className="text-gray-600 mt-2">결제 이력 · 정산 현황 · 환불 관리</p>
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
            variant="outline" 
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            다운로드
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg hover:scale-105 transition-all cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              이달 매출
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₩2,610,000</div>
            <p className="text-xs text-gray-500 mt-1">75건 결제</p>
            <Badge className="mt-2 bg-green-100 text-green-700">증가 18%</Badge>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:scale-105 transition-all cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              정산 예정액
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₩2,480,500</div>
            <p className="text-xs text-gray-500 mt-1">수수료 제외</p>
            <Badge className="mt-2 bg-blue-100 text-blue-700">5월 30일 정산</Badge>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:scale-105 transition-all cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              환불 대기
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₩99,000</div>
            <p className="text-xs text-gray-500 mt-1">1건 대기 중</p>
            <Badge className="mt-2 bg-orange-100 text-orange-700">승인 필요</Badge>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:scale-105 transition-all cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-purple-500" />
              평균 거래액
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">₩34,800</div>
            <p className="text-xs text-gray-500 mt-1">이달 평균</p>
            <Badge className="mt-2 bg-purple-100 text-purple-700">안정적</Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            일별 결제 추이
          </CardTitle>
          <CardDescription>최근 5일간의 결제 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={paymentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="amount" fill="#3b82f6" name="결제액" />
              <Bar dataKey="count" fill="#10b981" name="건수" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>최근 결제 이력</CardTitle>
          <CardDescription>최근 5건의 결제 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">날짜</th>
                  <th className="text-left py-2 px-2">고객명</th>
                  <th className="text-left py-2 px-2">결제 수단</th>
                  <th className="text-right py-2 px-2">금액</th>
                  <th className="text-center py-2 px-2">상태</th>
                  <th className="text-center py-2 px-2">작업</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="py-3 px-2">{payment.date}</td>
                    <td className="py-3 px-2 font-medium">{payment.customer}</td>
                    <td className="py-3 px-2">
                      <Badge variant="outline">{payment.method}</Badge>
                    </td>
                    <td className="py-3 px-2 text-right font-semibold">₩{payment.amount.toLocaleString()}</td>
                    <td className="py-3 px-2 text-center">
                      <Badge 
                        className={
                          payment.status === 'completed' 
                            ? 'bg-green-100 text-green-700'
                            : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }
                      >
                        {payment.status === 'completed' ? '완료' : payment.status === 'pending' ? '대기' : '실패'}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-center">
                      {payment.status === 'failed' && (
                        <Button size="sm" variant="outline" className="text-xs">
                          재시도
                        </Button>
                      )}
                      {payment.status === 'completed' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs"
                          onClick={() => toast.info('환불 요청이 접수되었습니다')}
                        >
                          환불
                        </Button>
                      )}
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
            <CardTitle>정산 현황</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: '이달 매출', value: '₩2,610,000', color: 'bg-green-100 text-green-700' },
              { label: '수수료 3%', value: '-₩78,300', color: 'bg-red-100 text-red-700' },
              { label: '환불액', value: '-₩99,000', color: 'bg-red-100 text-red-700' },
              { label: '정산 예정액', value: '₩2,432,700', color: 'bg-blue-100 text-blue-700' },
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
            <CardTitle>결제 수단별 현황</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { method: '카드', count: 45, amount: '₩1,575,000' },
              { method: '모바일', count: 20, amount: '₩700,000' },
              { method: '계좌이체', count: 10, amount: '₩335,000' },
            ].map((item, i) => (
              <div key={i} className="p-3 border rounded-lg hover:shadow-md transition-all">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{item.method}</span>
                  <Badge variant="outline">{item.count}건</Badge>
                </div>
                <div className="text-sm font-semibold text-green-600">{item.amount}</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="h-2 rounded-full bg-green-500"
                    style={{ width: `${(item.count / 45) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
