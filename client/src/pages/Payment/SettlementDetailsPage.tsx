import React from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, Download, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

export default function SettlementDetailsPage() {
  const [, setLocation] = useLocation();

  const settlementHistory = [
    { date: '2026-04-30', amount: 2432700, status: 'completed', method: '계좌이체' },
    { date: '2026-03-31', amount: 2156300, status: 'completed', method: '계좌이체' },
    { date: '2026-02-28', amount: 1987500, status: 'completed', method: '계좌이체' },
    { date: '2026-01-31', amount: 2234800, status: 'completed', method: '계좌이체' },
  ];

  const settlementCalculation = [
    { label: '이달 매출', value: '₩2,610,000', color: 'text-green-600' },
    { label: '수수료 (3%)', value: '-₩78,300', color: 'text-red-600' },
    { label: '환불액', value: '-₩99,000', color: 'text-red-600' },
    { label: '정산 예정액', value: '₩2,432,700', color: 'text-blue-600', isBold: true },
  ];

  const settlementTrend = [
    { month: '1월', settlement: 2234800 },
    { month: '2월', settlement: 1987500 },
    { month: '3월', settlement: 2156300 },
    { month: '4월', settlement: 2432700 },
    { month: '5월', settlement: 2432700 },
  ];

  const handleExport = () => {
    toast.success('정산 데이터가 다운로드되었습니다');
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
              <TrendingUp className="h-8 w-8 text-blue-500" />
              정산 예정액 상세
            </h1>
            <p className="text-gray-600 mt-2">2026년 5월 정산 현황</p>
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
            <CardTitle className="text-base font-medium text-gray-600">정산 예정액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">₩2,432,700</div>
            <p className="text-xs text-gray-500 mt-1">수수료 제외</p>
            <Badge className="mt-2 bg-blue-100 text-blue-700">5월 30일 정산</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-600">수수료</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">₩78,300</div>
            <p className="text-xs text-gray-500 mt-1">3% 수수료</p>
            <Badge className="mt-2 bg-red-100 text-red-700">공제됨</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-600">정산 계좌</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono">국민은행 123-456-789012</div>
            <p className="text-xs text-gray-500 mt-1">예금주: 한진</p>
            <Badge className="mt-2 bg-green-100 text-green-700">확인됨</Badge>
          </CardContent>
        </Card>
      </div>

      {/* 정산 계산 상세 */}
      <Card>
        <CardHeader>
          <CardTitle>정산 계산 상세</CardTitle>
          <CardDescription>이달 정산액 계산 내역</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {settlementCalculation.map((item, i) => (
              <div
                key={i}
                className={`flex justify-between items-center p-3 border rounded-lg ${
                  item.isBold ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <span className={`font-medium ${item.isBold ? 'text-lg' : ''}`}>
                  {item.label}
                </span>
                <span className={`font-bold text-lg ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 정산 추이 */}
      <Card>
        <CardHeader>
          <CardTitle>월별 정산 추이</CardTitle>
          <CardDescription>최근 5개월 정산액</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={settlementTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `₩${value.toLocaleString()}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="settlement"
                stroke="#3b82f6"
                name="정산액"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 정산 이력 */}
      <Card>
        <CardHeader>
          <CardTitle>정산 이력</CardTitle>
          <CardDescription>최근 정산 내역</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">정산일</th>
                  <th className="text-left py-2 px-2">정산액</th>
                  <th className="text-left py-2 px-2">정산 수단</th>
                  <th className="text-center py-2 px-2">상태</th>
                </tr>
              </thead>
              <tbody>
                {settlementHistory.map((settlement, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="py-3 px-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {settlement.date}
                    </td>
                    <td className="py-3 px-2 font-semibold text-green-600">
                      ₩{settlement.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant="outline">{settlement.method}</Badge>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Badge className="bg-green-100 text-green-700">완료</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 정산 일정 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">다음 정산 일정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-blue-900">정산 예정일</span>
            <span className="font-bold text-blue-600">2026년 5월 30일</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-900">정산 예정액</span>
            <span className="font-bold text-blue-600">₩2,432,700</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-900">정산 계좌</span>
            <span className="font-mono text-sm">국민은행 123-456-789012</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
