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
  TrendingUp, Trophy, Star, Crown, BarChart3, LineChart, PieChart, Watch
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
  // ✅ 보고서 2차 반영: AI 기기 연동 현황
  totalMembers: number;
  deviceConnected: number;
  voiceAiUsers: number;
  cameraAiUsers: number;
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
  const [segmentSelected, setSegmentSelected] = useState<any>(null);

  // Mock 데이터
  const aiMetrics: AIMetrics = {
    totalMembers: 1247,
    deviceConnected: 342,
    voiceAiUsers: 189,
    cameraAiUsers: 97,
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

        {/* ✅ AI 기기 연동 현황 카드 3개 (보고서 2차 반영) */}
        <div className="grid grid-cols-3 gap-4">

          {/* 카드 1: AI Fit 기기 연동 회원 */}
          <Card
            className="hover:shadow-lg transition-all cursor-pointer hover:border-blue-300"
            onClick={() => {
              alert("AI Fit 기기 연동 회원 리스트\n\n실제 환경에서는:\n- Google Fit 연동자\n- Apple Health 연동자\n- Watch 연동자\n전체 목록이 표시됩니다.");
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>🏃 AI Fit 기기 연동</span>
                <Watch className="h-4 w-4 text-blue-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {aiMetrics.totalMembers > 0
                  ? `${Math.round((aiMetrics.deviceConnected / aiMetrics.totalMembers) * 100)}%`
                  : "—"}
              </div>
              <Progress value={aiMetrics.totalMembers > 0 ? (aiMetrics.deviceConnected / aiMetrics.totalMembers) * 100 : 0} className="mt-2" />
              <p className="text-xs text-gray-500 mt-2">
                전체 {aiMetrics.totalMembers.toLocaleString()}명 중 {aiMetrics.deviceConnected.toLocaleString()}명 연동
              </p>
              <p className="text-xs text-blue-500 mt-1">👆 클릭 시 회원 리스트</p>
            </CardContent>
          </Card>

          {/* 카드 2: 소리·호흡 AI 사용 회원 */}
          <Card
            className="hover:shadow-lg transition-all cursor-pointer hover:border-green-300"
            onClick={() => {
              alert("소리·호흡 AI 사용 회원 리스트\n\n실제 환경에서는:\n- 마이크 기반 호흡 분석 사용자\n- 스트레스 감지 기능 사용자\n- 생체리듬 측정 사용자\n목록이 표시됩니다.");
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>🎙️ 소리·호흡 AI</span>
                <Activity className="h-4 w-4 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {aiMetrics.totalMembers > 0
                  ? `${Math.round((aiMetrics.voiceAiUsers / aiMetrics.totalMembers) * 100)}%`
                  : "—"}
              </div>
              <Progress value={aiMetrics.totalMembers > 0 ? (aiMetrics.voiceAiUsers / aiMetrics.totalMembers) * 100 : 0} className="mt-2" />
              <p className="text-xs text-gray-500 mt-2">
                전체 {aiMetrics.totalMembers.toLocaleString()}명 중 {aiMetrics.voiceAiUsers.toLocaleString()}명 사용
              </p>
              <p className="text-xs text-green-500 mt-1">👆 클릭 시 회원 리스트</p>
            </CardContent>
          </Card>

          {/* 카드 3: 카메라 AI 사용 회원 */}
          <Card
            className="hover:shadow-lg transition-all cursor-pointer hover:border-purple-300"
            onClick={() => {
              alert("카메라 AI 사용 회원 리스트\n\n실제 환경에서는:\n- 식사 인식 사용자\n- 자세 교정 사용자\n- 사진 기반 정신건강 분석 사용자\n목록이 표시됩니다.");
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>📸 카메라 AI</span>
                <Zap className="h-4 w-4 text-purple-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {aiMetrics.totalMembers > 0
                  ? `${Math.round((aiMetrics.cameraAiUsers / aiMetrics.totalMembers) * 100)}%`
                  : "—"}
              </div>
              <Progress value={aiMetrics.totalMembers > 0 ? (aiMetrics.cameraAiUsers / aiMetrics.totalMembers) * 100 : 0} className="mt-2" />
              <p className="text-xs text-gray-500 mt-2">
                전체 {aiMetrics.totalMembers.toLocaleString()}명 중 {aiMetrics.cameraAiUsers.toLocaleString()}명 사용
              </p>
              <p className="text-xs text-purple-500 mt-1">👆 클릭 시 회원 리스트</p>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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

          {/* ✅ 탭3: 세그멘테이션 → 클릭 시 리스트 + 일괄 액션 (보고서 2차 반영) */}
          <TabsContent value="segment" className="space-y-4">
            {segmentSelected ? (
              // 선택된 세그먼트 리스트 화면
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        {segmentSelected.emoji} {segmentSelected.name} — {segmentSelected.users.toLocaleString()}명
                      </CardTitle>
                      <CardDescription>{segmentSelected.desc}</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSegmentSelected(null)}>← 전체 세그먼트</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* 일괄 액션 버튼 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {[
                      { icon: '💬', label: '메시지 발송', color: 'bg-blue-600', msg: '격려 메시지를' },
                      { icon: '🎉', label: '이벤트 등록', color: 'bg-purple-600', msg: '이벤트를' },
                      { icon: '⭐', label: '포인트 지급', color: 'bg-yellow-600', msg: '포인트를' },
                      { icon: '🎯', label: '미션 배정', color: 'bg-green-600', msg: '미션을' },
                    ].map(action => (
                      <Button key={action.label}
                        className={`${action.color} text-white text-xs h-9 gap-1`}
                        onClick={() => {
                          toast.success(`${segmentSelected.name} ${segmentSelected.users}명에게 ${action.msg} 발송 완료!`);
                        }}>
                        <span>{action.icon}</span>{action.label}
                      </Button>
                    ))}
                  </div>
                  {/* 더미 회원 목록 */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-gray-200 text-xs text-gray-500">
                        <th className="text-left py-2 px-3">이름</th>
                        <th className="text-left py-2 px-3">이메일</th>
                        <th className="text-right py-2 px-3">AI점수</th>
                        <th className="text-center py-2 px-3">등급</th>
                      </tr></thead>
                      <tbody>
                        {segmentSelected.members.map((m: any, i: number) => (
                          <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-3 font-medium">{m.name}</td>
                            <td className="py-2 px-3 text-xs text-gray-400">{m.email}</td>
                            <td className="py-2 px-3 text-right font-mono"
                              style={{ color: segmentSelected.color }}>{m.score}</td>
                            <td className="py-2 px-3 text-center">
                              <Badge className="text-xs" style={{ background: segmentSelected.color + '22', color: segmentSelected.color }}>
                                {segmentSelected.tag}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-400 mt-3 text-center">
                    실제 환경: trpc.admin.getUsers (세그먼트 필터 연동) 전체 {segmentSelected.users}명 조회
                  </p>
                </CardContent>
              </Card>
            ) : (
              // 세그먼트 선택 화면
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    name: '상위 20%', emoji: '🏆', users: 249, engagement: 95, retention: 88, color: '#10b981', tag: 'VIP',
                    desc: '건강 점수 상위 20% — 칭찬 + 보너스 포인트 추천',
                    members: [
                      { name: '김건강', email: 'kim@ex.com', score: 98.2 },
                      { name: '이활력', email: 'lee@ex.com', score: 95.7 },
                      { name: '박수련', email: 'park@ex.com', score: 93.4 },
                      { name: '최웰니스', email: 'choi@ex.com', score: 91.8 },
                      { name: '정호흡', email: 'jung@ex.com', score: 90.5 },
                    ],
                  },
                  {
                    name: '중간 60%', emoji: '💪', users: 748, engagement: 68, retention: 72, color: '#3b82f6', tag: '일반',
                    desc: '건강 점수 중간 — 도전 미션 + 승급 이벤트 추천',
                    members: [
                      { name: '강건강', email: 'kang@ex.com', score: 78.2 },
                      { name: '윤활력', email: 'yoon@ex.com', score: 74.1 },
                      { name: '임수련', email: 'im@ex.com', score: 71.8 },
                      { name: '한웰니스', email: 'han@ex.com', score: 68.5 },
                      { name: '오호흡', email: 'oh@ex.com', score: 65.3 },
                    ],
                  },
                  {
                    name: '하위 20%', emoji: '⚠️', users: 250, engagement: 32, retention: 41, color: '#ef4444', tag: '개선 필요',
                    desc: '건강 점수 하위 20% — 응원 메시지 + 회복 미션 추천',
                    members: [
                      { name: '서개선', email: 'seo@ex.com', score: 38.1 },
                      { name: '문회복', email: 'moon@ex.com', score: 35.7 },
                      { name: '배노력', email: 'bae@ex.com', score: 32.4 },
                      { name: '조향상', email: 'jo@ex.com', score: 29.8 },
                      { name: '신성장', email: 'shin@ex.com', score: 26.5 },
                    ],
                  },
                  {
                    name: '30일 미활동', emoji: '😴', users: 89, engagement: 5, retention: 12, color: '#6b7280', tag: '휴면',
                    desc: '30일 이상 미접속 — 복귀 이벤트 + 포인트 지급 추천',
                    members: [
                      { name: '류복귀', email: 'ryu@ex.com', score: 0 },
                      { name: '표재시작', email: 'pyo@ex.com', score: 0 },
                      { name: '하돌아와', email: 'ha@ex.com', score: 0 },
                    ],
                  },
                ].map(seg => (
                  <Card key={seg.name}
                    className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 border-l-4"
                    style={{ borderLeftColor: seg.color }}
                    onClick={() => setSegmentSelected(seg)}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{seg.emoji}</span>
                          <div>
                            <h3 className="font-semibold text-sm">{seg.name}</h3>
                            <p className="text-xs text-gray-500">{seg.desc}</p>
                          </div>
                        </div>
                        <Badge className="text-lg font-bold px-3" style={{ background: seg.color + '22', color: seg.color }}>
                          {seg.users.toLocaleString()}명
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">참여도</p>
                          <Progress value={seg.engagement} className="h-2" />
                          <p className="text-xs font-semibold mt-0.5" style={{ color: seg.color }}>{seg.engagement}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">유지율</p>
                          <Progress value={seg.retention} className="h-2" />
                          <p className="text-xs font-semibold mt-0.5">{seg.retention}%</p>
                        </div>
                      </div>
                      <p className="text-xs mt-2" style={{ color: seg.color }}>👆 클릭 → 명단 + 일괄 발송</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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
