import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertCircle, Download, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function RefundDetailsPage() {
  const [, setLocation] = useLocation();
  const [refunds, setRefunds] = useState([
    {
      id: 1,
      date: '2026-05-22',
      customer: 'Kim Min-jun',
      amount: 99000,
      reason: '상품 불만족',
      status: 'pending',
      originalPaymentId: 'PAY-001',
    },
  ]);

  const handleApproveRefund = (id: number) => {
    setRefunds(
      refunds.map((r) =>
        r.id === id ? { ...r, status: 'approved' } : r
      )
    );
    toast.success('환불이 승인되었습니다');
  };

  const handleRejectRefund = (id: number) => {
    setRefunds(
      refunds.map((r) =>
        r.id === id ? { ...r, status: 'rejected' } : r
      )
    );
    toast.error('환불이 거절되었습니다');
  };

  const handleExport = () => {
    toast.success('환불 데이터가 다운로드되었습니다');
  };

  const totalRefundAmount = refunds.reduce((sum, r) => sum + r.amount, 0);
  const pendingCount = refunds.filter((r) => r.status === 'pending').length;
  const approvedCount = refunds.filter((r) => r.status === 'approved').length;

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
              <AlertCircle className="h-8 w-8 text-orange-500" />
              환불 대기 상세
            </h1>
            <p className="text-gray-600 mt-2">환불 요청 및 승인 관리</p>
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
            <CardTitle className="text-base font-medium text-gray-600">대기 중인 환불</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">₩{totalRefundAmount.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">{pendingCount}건 대기 중</p>
            <Badge className="mt-2 bg-orange-100 text-orange-700">승인 필요</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-600">승인된 환불</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ₩{refunds
                .filter((r) => r.status === 'approved')
                .reduce((sum, r) => sum + r.amount, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">{approvedCount}건 완료</p>
            <Badge className="mt-2 bg-green-100 text-green-700">처리됨</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-600">거절된 환불</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              ₩{refunds
                .filter((r) => r.status === 'rejected')
                .reduce((sum, r) => sum + r.amount, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {refunds.filter((r) => r.status === 'rejected').length}건 거절
            </p>
            <Badge className="mt-2 bg-red-100 text-red-700">거절됨</Badge>
          </CardContent>
        </Card>
      </div>

      {/* 환불 요청 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>환불 요청 목록</CardTitle>
          <CardDescription>모든 환불 요청 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {refunds.length > 0 ? (
              refunds.map((refund) => (
                <div
                  key={refund.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{refund.customer}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        요청일: {refund.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">
                        ₩{refund.amount.toLocaleString()}
                      </div>
                      <Badge
                        className={
                          refund.status === 'pending'
                            ? 'bg-orange-100 text-orange-700 mt-1'
                            : refund.status === 'approved'
                            ? 'bg-green-100 text-green-700 mt-1'
                            : 'bg-red-100 text-red-700 mt-1'
                        }
                      >
                        {refund.status === 'pending'
                          ? '대기 중'
                          : refund.status === 'approved'
                          ? '승인됨'
                          : '거절됨'}
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-3 p-3 bg-gray-50 rounded">
                    <p className="text-sm font-medium mb-1">환불 사유</p>
                    <p className="text-sm text-gray-700">{refund.reason}</p>
                  </div>

                  <div className="mb-3 text-xs text-gray-500">
                    원본 결제 ID: {refund.originalPaymentId}
                  </div>

                  {refund.status === 'pending' && (
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectRefund(refund.id)}
                        className="gap-1"
                      >
                        <XCircle className="h-4 w-4" />
                        거절
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproveRefund(refund.id)}
                        className="gap-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                        승인
                      </Button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>대기 중인 환불 요청이 없습니다</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 환불 정책 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">환불 정책</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-900">
          <p>• 구매 후 7일 이내 환불 가능</p>
          <p>• 상품 미개봉 상태일 때만 환불 가능</p>
          <p>• 환불 승인 후 3-5 영업일 내 계좌로 환급</p>
          <p>• 환불 수수료는 별도로 공제되지 않음</p>
        </CardContent>
      </Card>

      {/* 환불 통계 */}
      <Card>
        <CardHeader>
          <CardTitle>환불 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '총 환불 요청', value: refunds.length },
              { label: '대기 중', value: pendingCount },
              { label: '승인됨', value: approvedCount },
              {
                label: '거절됨',
                value: refunds.filter((r) => r.status === 'rejected').length,
              },
            ].map((stat, i) => (
              <div key={i} className="p-4 border rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">{stat.value}</p>
                <p className="text-xs text-gray-600 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
