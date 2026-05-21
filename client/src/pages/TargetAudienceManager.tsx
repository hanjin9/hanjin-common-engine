import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Filter, Send, Plus, Edit2, Trash2 } from 'lucide-react';

/**
 * 타겟 발송 관리 페이지
 * 
 * 기능:
 * - 타겟 오디언스 세그먼트 생성
 * - 조건부 발송 설정
 * - 발송 이력 관리
 */
export default function TargetAudienceManager() {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  // 타겟 세그먼트 목록 (예시)
  const segments = [
    {
      id: 1,
      name: '상위 10% 사용자',
      description: '건강 점수 상위 10%에 속하는 사용자',
      criteria: 'score >= 90',
      memberCount: 150,
      status: 'active',
      createdAt: '2026-05-01',
    },
    {
      id: 2,
      name: '하위 20% 사용자',
      description: '건강 점수 하위 20%에 속하는 사용자',
      criteria: 'score < 40',
      memberCount: 300,
      status: 'active',
      createdAt: '2026-05-05',
    },
    {
      id: 3,
      name: '프리미엄 구독자',
      description: '프리미엄 멤버십을 구독 중인 사용자',
      criteria: 'membership = "premium"',
      memberCount: 450,
      status: 'active',
      createdAt: '2026-04-20',
    },
    {
      id: 4,
      name: '휴면 사용자',
      description: '30일 이상 활동이 없는 사용자',
      criteria: 'lastActivity < 30days',
      memberCount: 200,
      status: 'inactive',
      createdAt: '2026-05-10',
    },
  ];

  // 발송 이력 (예시)
  const sendHistory = [
    {
      id: 1,
      segmentName: '상위 10% 사용자',
      messageTitle: '축하 메시지',
      sentCount: 150,
      successCount: 145,
      failureCount: 5,
      sentAt: '2026-05-22 10:30',
      status: 'completed',
    },
    {
      id: 2,
      segmentName: '하위 20% 사용자',
      messageTitle: '건강 개선 권고',
      sentCount: 300,
      successCount: 285,
      failureCount: 15,
      sentAt: '2026-05-21 14:00',
      status: 'completed',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">타겟 발송 관리</h1>
          <p className="text-muted-foreground mt-2">세그먼트별 타겟 발송 설정</p>
        </div>
        <Button size="lg" className="gap-2">
          <Plus className="w-4 h-4" />
          새 세그먼트
        </Button>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              활성 세그먼트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">관리 중</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">총 타겟</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">900</div>
            <p className="text-xs text-muted-foreground mt-1">사용자</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">발송 성공률</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">95%</div>
            <p className="text-xs text-muted-foreground mt-1">평균</p>
          </CardContent>
        </Card>
      </div>

      {/* 세그먼트 목록 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">타겟 세그먼트</h2>
        {segments.map((segment) => (
          <Card 
            key={segment.id}
            className={`cursor-pointer transition ${selectedSegment === String(segment.id) ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedSegment(String(segment.id))}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{segment.name}</h3>
                    <Badge variant={segment.status === 'active' ? 'default' : 'secondary'}>
                      {segment.status === 'active' ? '활성' : '비활성'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{segment.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">조건</p>
                  <p className="text-sm font-mono bg-muted p-2 rounded">{segment.criteria}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">멤버 수</p>
                  <p className="text-2xl font-bold">{segment.memberCount}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">생성일</p>
                  <p className="text-sm">{segment.createdAt}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="gap-2">
                  <Send className="w-4 h-4" />
                  발송
                </Button>
                <Button size="sm" variant="outline" className="gap-2">
                  <Edit2 className="w-4 h-4" />
                  수정
                </Button>
                <Button size="sm" variant="outline" className="gap-2 text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                  삭제
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 발송 이력 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">발송 이력</h2>
        <div className="space-y-4">
          {sendHistory.map((history) => (
            <Card key={history.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{history.segmentName}</h3>
                      <Badge variant="secondary">{history.messageTitle}</Badge>
                      <Badge variant="default" className="ml-auto">
                        {history.status === 'completed' ? '완료' : '진행 중'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{history.sentAt}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">발송 대상</p>
                    <p className="text-2xl font-bold">{history.sentCount}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">성공</p>
                    <p className="text-2xl font-bold text-green-600">{history.successCount}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">실패</p>
                    <p className="text-2xl font-bold text-red-600">{history.failureCount}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(history.successCount / history.sentCount) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    성공률: {((history.successCount / history.sentCount) * 100).toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
