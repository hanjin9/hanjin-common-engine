/**
 * AiAnalyticsDashboard — AI 분석 + 성능 지표 + 예측 분석 통합 대시보드
 * 탭1: AI 성능 지표 | 탭2: 5일 예측 분석 | 탭3: 사용자 세그멘테이션 | 탭4: 주요 인사이트
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Brain, RefreshCw, Activity, Users, Zap, AlertCircle,
  TrendingUp, Trophy, Star, Crown, BarChart3, LineChart, PieChart
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "-";
  return new Date(d).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface AIMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  responseTime: number;
  userSatisfaction: number;
}

interface PredictionData {
  date: string;
  predicted: number;
  actual: number | null;
  confidence: number;
}

interface SegmentData {
  name: string;
  users: number;
  engagement: number;
  retention: number;
}

interface InsightData {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
}

export default function AiAnalyticsDashboard() {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('accuracy');

  // Mock 데이터
  const aiMetrics: AIMetrics = {
    accuracy: 94.5,
    precision: 92.3,
    recall: 96.1,
    f1Score: 94.2,
    responseTime: 245,
    userSatisfaction: 88.7,
  };

  const predictionData: PredictionData[] = [
    { date: '5/18', predicted: 1200, actual: 1180, confidence: 92 },
    { date: '5/19', predicted: 1350, actual: 1420, confidence: 88 },
    { date: '5/20', predicted: 1500, actual: 1480, confidence: 95 },
    { date: '5/21', predicted: 1650, actual: 1620, confidence: 91 },
    { date: '5/22', predicted: 1800, actual: null, confidence: 85 },
  ];

  const segmentData: SegmentData[] = [
    { name: '고참여자', users: 2450, engagement: 95, retention: 92 },
    { name: '중참여자', users: 5230, engagement: 65, retention: 72 },
    { name: '저참여자', users: 3120, engagement: 25, retention: 35 },
    { name: '휴면사용자', users: 1890, engagement: 5, retention: 8 },
  ];

  const insights: InsightData[] = [
    {
      title: 'AI 정확도 개선',
      description: '최근 모델 업데이트로 정확도가 94.5%에 도달했습니다.',
      impact: 'high',
      recommendation: '현재 모델을 프로덕션에 배포하고 성능 모니터링을 계속 진행하세요.',
    },
    {
      title: '사용자 만족도 상승',
      description: '사용자 만족도가 전주 대비 +3.2% 증가했습니다.',
      impact: 'high',
      recommendation: '현재 UX 개선사항을 유지하고 추가 피드백을 수집하세요.',
    },
    {
      title: '응답 시간 최적화',
      description: '평균 응답 시간이 245ms로 단축되었습니다.',
      impact: 'medium',
      recommendation: '캐싱 전략을 검토하여 추가 최적화 기회를 찾아보세요.',
    },
    {
      title: '세그먼트별 전략 필요',
      description: '저참여자 그룹의 이탈률이 65%입니다.',
      impact: 'high',
      recommendation: '맞춤형 재참여 캠페인을 실행하고 효과를 측정하세요.',
    },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.loading('데이터 새로고침 중...');
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('데이터가 업데이트되었습니다');
    }, 1500);
  };

  const getMetricColor = (value: number) => {
    if (value >= 90) return 'text-emerald-600';
    if (value >= 80) return 'text-blue-600';
    if (value >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-blue-600" />
              AI 분석 대시보드
            </h1>
            <p className="text-gray-600 mt-1">AI 성능 지표 및 예측 분석</p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>

        {/* 성능 지표 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>정확도</span>
                <Zap className="h-4 w-4 text-yellow-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getMetricColor(aiMetrics.accuracy)}`}>
                {aiMetrics.accuracy.toFixed(1)}%
              </div>
              <Progress value={aiMetrics.accuracy} className="mt-2" />
              <p className="text-xs text-gray-500 mt-2">목표: 95% 이상</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>사용자 만족도</span>
                <Trophy className="h-4 w-4 text-amber-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getMetricColor(aiMetrics.userSatisfaction)}`}>
                {aiMetrics.userSatisfaction.toFixed(1)}%
              </div>
              <Progress value={aiMetrics.userSatisfaction} className="mt-2" />
              <p className="text-xs text-gray-500 mt-2">전주 대비 +3.2%</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>응답 시간</span>
                <Activity className="h-4 w-4 text-blue-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {aiMetrics.responseTime}ms
              </div>
              <Progress value={Math.min((1000 - aiMetrics.responseTime) / 10, 100)} className="mt-2" />
              <p className="text-xs text-gray-500 mt-2">목표: 200ms 이하</p>
            </CardContent>
          </Card>
        </div>

        {/* 탭 섹션 */}
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="metrics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">성능 지표</span>
            </TabsTrigger>
            <TabsTrigger value="prediction" className="gap-2">
              <LineChart className="h-4 w-4" />
              <span className="hidden sm:inline">예측 분석</span>
            </TabsTrigger>
            <TabsTrigger value="segment" className="gap-2">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">세그멘테이션</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden sm:inline">인사이트</span>
            </TabsTrigger>
          </TabsList>

          {/* 탭1: 성능 지표 */}
          <TabsContent value="metrics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI 모델 성능 지표</CardTitle>
                <CardDescription>최근 7일간의 성능 평가</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: '정확도', value: aiMetrics.accuracy, unit: '%' },
                    { label: '정밀도', value: aiMetrics.precision, unit: '%' },
                    { label: '재현율', value: aiMetrics.recall, unit: '%' },
                    { label: 'F1 스코어', value: aiMetrics.f1Score, unit: '' },
                    { label: '응답 시간', value: aiMetrics.responseTime, unit: 'ms' },
                    { label: '만족도', value: aiMetrics.userSatisfaction, unit: '%' },
                  ].map((metric) => (
                    <div key={metric.label} className="p-4 border rounded-lg hover:bg-gray-50">
                      <p className="text-sm text-gray-600">{metric.label}</p>
                      <p className={`text-2xl font-bold mt-2 ${getMetricColor(metric.value)}`}>
                        {metric.value.toFixed(1)}{metric.unit}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 탭2: 예측 분석 */}
          <TabsContent value="prediction" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>5일 예측 분석</CardTitle>
                <CardDescription>예측값 vs 실제값 비교</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={predictionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="predicted" stroke="#3b82f6" name="예측값" />
                    <Line type="monotone" dataKey="actual" stroke="#10b981" name="실제값" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>예측 신뢰도</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>날짜</TableHead>
                      <TableHead>예측값</TableHead>
                      <TableHead>실제값</TableHead>
                      <TableHead>신뢰도</TableHead>
                      <TableHead>오차율</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {predictionData.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.predicted}</TableCell>
                        <TableCell>{row.actual || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.confidence}%</Badge>
                        </TableCell>
                        <TableCell>
                          {row.actual ? `${Math.abs(row.predicted - row.actual)}` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 탭3: 사용자 세그멘테이션 */}
          <TabsContent value="segment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>사용자 세그멘테이션</CardTitle>
                <CardDescription>참여도별 사용자 분포</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={segmentData}
                      dataKey="users"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {segmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444'][index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>세그먼트별 상세 분석</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {segmentData.map((segment) => (
                    <div key={segment.name} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{segment.name}</h4>
                        <Badge>{segment.users.toLocaleString()} 명</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600">참여도</p>
                          <Progress value={segment.engagement} className="mt-1" />
                          <p className="text-sm font-semibold mt-1">{segment.engagement}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">유지율</p>
                          <Progress value={segment.retention} className="mt-1" />
                          <p className="text-sm font-semibold mt-1">{segment.retention}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 탭4: 주요 인사이트 */}
          <TabsContent value="insights" className="space-y-4">
            {insights.map((insight, idx) => (
              <Card key={idx} className={`border-l-4 ${getImpactColor(insight.impact)}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {insight.impact === 'high' && <AlertCircle className="h-5 w-5 text-red-600" />}
                        {insight.impact === 'medium' && <TrendingUp className="h-5 w-5 text-amber-600" />}
                        {insight.impact === 'low' && <Star className="h-5 w-5 text-blue-600" />}
                        {insight.title}
                      </CardTitle>
                      <CardDescription className="mt-1">{insight.description}</CardDescription>
                    </div>
                    <Badge variant="outline">{insight.impact.toUpperCase()}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-white/50 p-3 rounded border-l-2 border-gray-300">
                    <p className="text-sm font-semibold text-gray-700">💡 추천사항</p>
                    <p className="text-sm text-gray-600 mt-1">{insight.recommendation}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
