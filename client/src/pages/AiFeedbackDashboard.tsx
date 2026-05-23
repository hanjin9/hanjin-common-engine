import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Zap, MessageSquare, Send, RefreshCw } from 'lucide-react';

/**
 * AI 피드백 대시보드
 * 
 * 3단계 피드백 시스템:
 * - 1차: 격려 (무료, 즉시)
 * - 2차: 경고 (무료, 조건부)
 * - 3차: 프리미엄 (유료, 전문가)
 */
export default function AiFeedbackDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFeedbackStage, setSelectedFeedbackStage] = useState<'encouragement' | 'warning' | 'premium'>('encouragement');

  // 피드백 통계 (예시 데이터)
  const feedbackStats = {
    total: 1234,
    encouragement: 450,
    warning: 520,
    premium: 264,
    sent: 1050,
    pending: 184,
  };

  // 최근 피드백 목록 (예시)
  const recentFeedbacks = [
    {
      id: 1,
      userId: 'user_001',
      userName: '김철수',
      tier: '상위10%',
      stage: 'encouragement',
      message: '축하합니다! 상위 10%의 건강 실천자입니다.',
      status: 'sent',
      createdAt: '2026-05-22 10:30',
    },
    {
      id: 2,
      userId: 'user_002',
      userName: '이영희',
      tier: '하위20%',
      stage: 'warning',
      message: '건강 개선이 필요합니다. 전문가의 도움을 받으세요.',
      status: 'sent',
      createdAt: '2026-05-22 09:15',
    },
    {
      id: 3,
      userId: 'user_003',
      userName: '박민수',
      tier: '상위20%',
      stage: 'premium',
      message: '프리미엄 컨설팅: 30일 맞춤형 건강 플랜',
      status: 'pending',
      createdAt: '2026-05-22 08:00',
    },
  ];

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">AI 피드백 관리</h1>
          <p className="text-muted-foreground mt-2">3단계 자동화 피드백 시스템</p>
        </div>
        <Button size="lg" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          새 피드백 생성
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base font-medium">전체 피드백</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-base font-bold truncate">{feedbackStats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">누적 생성</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base font-medium">1차: 격려</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{feedbackStats.encouragement}</div>
            <p className="text-xs text-muted-foreground mt-1">무료, 즉시</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base font-medium">2차: 경고</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-yellow-600">{feedbackStats.warning}</div>
            <p className="text-xs text-muted-foreground mt-1">무료, 조건부</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base font-medium">3차: 프리미엄</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{feedbackStats.premium}</div>
            <p className="text-xs text-muted-foreground mt-1">유료, 전문가</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base font-medium">발송 상태</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-base font-bold truncate">{feedbackStats.sent}</div>
            <p className="text-xs text-muted-foreground mt-1">발송 완료</p>
          </CardContent>
        </Card>
      </div>

      {/* 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="stages">피드백 단계</TabsTrigger>
          <TabsTrigger value="templates">템플릿 관리</TabsTrigger>
          <TabsTrigger value="history">발송 이력</TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-2">
          <Card>
            <CardHeader>
              <CardTitle>피드백 시스템 개요</CardTitle>
              <CardDescription>3단계 자동화 피드백 프로세스</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 1차 피드백 */}
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold">1차: 격려 피드백</h3>
                  <Badge variant="outline" className="ml-auto">무료</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  모든 사용자에게 즉시 발송되는 격려 메시지. 긍정적인 톤으로 사용자의 노력을 인정합니다.
                </p>
                <p className="text-xs text-muted-foreground mt-2">예: "좋은 하루 보내셨어요! 계속 이 추진력을 유지하세요."</p>
              </div>

              {/* 2차 피드백 */}
              <div className="border-l-4 border-yellow-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-semibold">2차: 경고 피드백</h3>
                  <Badge variant="outline" className="ml-auto">무료</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  개선이 필요한 사용자에게 발송되는 경고 메시지. 구체적인 개선 방안을 제시합니다.
                </p>
                <p className="text-xs text-muted-foreground mt-2">예: "수면이 부족합니다. 호흡법을 해보세요."</p>
              </div>

              {/* 3차 피드백 */}
              <div className="border-l-4 border-purple-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold">3차: 프리미엄 피드백</h3>
                  <Badge variant="outline" className="ml-auto">유료</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  전문가가 작성한 맞춤형 피드백. 음성, PDF, 영상 등 다양한 형식으로 제공됩니다.
                </p>
                <p className="text-xs text-muted-foreground mt-2">예: "30일 맞춤형 건강 플랜 + 전문가 코칭"</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 피드백 단계 탭 */}
        <TabsContent value="stages" className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* 1차 격려 */}
            <Card 
              className={`cursor-pointer transition ${selectedFeedbackStage === 'encouragement' ? 'ring-2 ring-green-500' : ''}`}
              onClick={() => setSelectedFeedbackStage('encouragement')}
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  1차: 격려
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">발송 대상</p>
                  <p className="text-xs text-muted-foreground">모든 활성 사용자</p>
                </div>
                <div>
                  <p className="text-sm font-medium">발송 주기</p>
                  <p className="text-xs text-muted-foreground">매일 7시, 12시, 17시, 22시</p>
                </div>
                <div>
                  <p className="text-sm font-medium">톤</p>
                  <p className="text-xs text-muted-foreground">긍정적, 친근함</p>
                </div>
                <Button size="sm" className="w-full mt-2">설정</Button>
              </CardContent>
            </Card>

            {/* 2차 경고 */}
            <Card 
              className={`cursor-pointer transition ${selectedFeedbackStage === 'warning' ? 'ring-2 ring-yellow-500' : ''}`}
              onClick={() => setSelectedFeedbackStage('warning')}
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  2차: 경고
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">발송 대상</p>
                  <p className="text-xs text-muted-foreground">하위 20% 사용자</p>
                </div>
                <div>
                  <p className="text-sm font-medium">발송 주기</p>
                  <p className="text-xs text-muted-foreground">주 3회 (월/수/금)</p>
                </div>
                <div>
                  <p className="text-sm font-medium">톤</p>
                  <p className="text-xs text-muted-foreground">진지함, 전문성</p>
                </div>
                <Button size="sm" className="w-full mt-2">설정</Button>
              </CardContent>
            </Card>

            {/* 3차 프리미엄 */}
            <Card 
              className={`cursor-pointer transition ${selectedFeedbackStage === 'premium' ? 'ring-2 ring-purple-500' : ''}`}
              onClick={() => setSelectedFeedbackStage('premium')}
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  3차: 프리미엄
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">발송 대상</p>
                  <p className="text-xs text-muted-foreground">프리미엄 구독자</p>
                </div>
                <div>
                  <p className="text-sm font-medium">발송 주기</p>
                  <p className="text-xs text-muted-foreground">주 1회 (월요일)</p>
                </div>
                <div>
                  <p className="text-sm font-medium">톤</p>
                  <p className="text-xs text-muted-foreground">따뜻함, 전문가적</p>
                </div>
                <Button size="sm" className="w-full mt-2">설정</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 템플릿 관리 탭 */}
        <TabsContent value="templates" className="space-y-2">
          <Card>
            <CardHeader>
              <CardTitle>피드백 템플릿 관리</CardTitle>
              <CardDescription>각 단계별 피드백 템플릿을 관리합니다</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-2">
                <Button variant="outline">템플릿 추가</Button>
                <Button variant="outline">템플릿 가져오기</Button>
              </div>
              <p className="text-sm text-muted-foreground">
                <a href="/admin/feedback-templates" className="text-blue-600 hover:underline">
                  피드백 템플릿 관리 페이지로 이동 →
                </a>
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 발송 이력 탭 */}
        <TabsContent value="history" className="space-y-2">
          <Card>
            <CardHeader>
              <CardTitle>최근 발송 이력</CardTitle>
              <CardDescription>최근 발송된 피드백 목록</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentFeedbacks.map((feedback) => (
                  <div key={feedback.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{feedback.userName}</span>
                        <Badge variant="secondary" className="text-xs">{feedback.tier}</Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            feedback.stage === 'encouragement' ? 'text-green-600' :
                            feedback.stage === 'warning' ? 'text-yellow-600' :
                            'text-purple-600'
                          }`}
                        >
                          {feedback.stage === 'encouragement' ? '1차' :
                           feedback.stage === 'warning' ? '2차' : '3차'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{feedback.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{feedback.createdAt}</p>
                    </div>
                    <Badge 
                      variant={feedback.status === 'sent' ? 'default' : 'secondary'}
                      className="ml-2"
                    >
                      {feedback.status === 'sent' ? '발송완료' : '대기중'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
