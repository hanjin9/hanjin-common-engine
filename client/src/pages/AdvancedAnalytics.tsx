import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, AlertTriangle, Brain, FileText, FlaskConical, Plus, Play, Pause } from "lucide-react";
import { toast } from "sonner";

const PREDICTION_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  churn_risk: { label: "이탈 위험도", color: "text-red-600", icon: <AlertTriangle className="w-5 h-5 text-red-500" /> },
  health_risk: { label: "건강 위험도", color: "text-orange-600", icon: <AlertTriangle className="w-5 h-5 text-orange-500" /> },
  engagement_score: { label: "참여도 점수", color: "text-blue-600", icon: <TrendingUp className="w-5 h-5 text-blue-500" /> },
  upgrade_probability: { label: "업그레이드 확률", color: "text-green-600", icon: <TrendingUp className="w-5 h-5 text-green-500" /> },
};

export default function AdvancedAnalytics() {
  const [selectedUserId, setSelectedUserId] = useState<number>(1);
  const [predictionType, setPredictionType] = useState<string>("churn_risk");
  const [expName, setExpName] = useState("");
  const [expType, setExpType] = useState<string>("mission");
  const [createExpOpen, setCreateExpOpen] = useState(false);

  const { data: summary } = trpc.analytics.getAnalyticsSummary.useQuery();
  const { data: predictions, refetch: refetchPredictions } = trpc.analytics.getPredictions.useQuery({ userId: selectedUserId });
  const { data: experiments, refetch: refetchExperiments } = trpc.analytics.getExperiments.useQuery();

  const runPrediction = trpc.analytics.runPrediction.useMutation({
    onSuccess: () => { toast.success("예측 분석이 완료되었습니다!"); refetchPredictions(); },
    onError: () => toast.error("예측 분석에 실패했습니다."),
  });

  const createExperiment = trpc.analytics.createExperiment.useMutation({
    onSuccess: () => {
      toast.success("A/B 테스트가 생성되었습니다!");
      setCreateExpOpen(false);
      setExpName("");
      refetchExperiments();
    },
    onError: () => toast.error("생성에 실패했습니다."),
  });

  const updateExpStatus = trpc.analytics.updateExperimentStatus.useMutation({
    onSuccess: () => { toast.success("상태가 변경되었습니다."); refetchExperiments(); },
  });

  const generateReport = trpc.analytics.generateReport.useMutation({
    onSuccess: () => toast.success("월간 리포트가 생성되었습니다!"),
    onError: () => toast.error("리포트 생성에 실패했습니다."),
  });

  const now = new Date();

  return (
    <div className="p-3 md:p-4 space-y-3">
      <div>
        <h1 className="text-xl font-bold text-amber-700">고급 분석 & 리포트</h1>
        <p className="text-muted-foreground text-sm mt-1">AI 예측 분석, 월간 리포트, A/B 테스트 관리</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-amber-50 border-0">
          <CardContent className="p-2 flex items-center gap-3">
            <Brain className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">총 예측 수행</p>
              <p className="text-xl font-bold">{summary?.totalPredictions ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-0">
          <CardContent className="p-2 flex items-center gap-3">
            <FlaskConical className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">진행 중 A/B 테스트</p>
              <p className="text-xl font-bold">{summary?.activeExperiments ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-0">
          <CardContent className="p-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">총 사용자</p>
              <p className="text-xl font-bold">{summary?.totalUsers ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="predictions">
        <TabsList>
          <TabsTrigger value="predictions">AI 예측 분석</TabsTrigger>
          <TabsTrigger value="reports">월간 리포트</TabsTrigger>
          <TabsTrigger value="ab">A/B 테스트</TabsTrigger>
        </TabsList>

        {/* 예측 분석 탭 */}
        <TabsContent value="predictions" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">예측 분석 실행</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 flex-wrap">
                <div>
                  <Label className="text-xs">사용자 ID</Label>
                  <Input
                    type="number"
                    className="w-28 mt-1"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs">예측 유형</Label>
                  <Select value={predictionType} onValueChange={setPredictionType}>
                    <SelectTrigger className="w-44 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PREDICTION_LABELS).map(([key, info]) => (
                        <SelectItem key={key} value={key}>{info.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => runPrediction.mutate({
                      targetUserId: selectedUserId,
                      predictionType: predictionType as "churn_risk" | "health_risk" | "engagement_score" | "upgrade_probability",
                    })}
                    disabled={runPrediction.isPending}
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    {runPrediction.isPending ? "분석 중..." : "예측 실행"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {predictions?.map((pred) => {
              const info = PREDICTION_LABELS[pred.predictionType];
              const score = parseFloat(pred.score ?? "0");
              return (
                <Card key={pred.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      {info?.icon}
                      <span className="font-semibold text-sm">{info?.label}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        신뢰도 {((parseFloat(pred.confidence ?? "0")) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="text-xl font-bold mb-2 text-amber-600">
                      {(score * 100).toFixed(1)}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div
                        className="bg-amber-500 h-2 rounded-full transition-all"
                        style={{ width: `${score * 100}%` }}
                      />
                    </div>
                    {pred.recommendation && (
                      <p className="text-xs text-muted-foreground">{pred.recommendation}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(pred.predictedAt).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* 월간 리포트 탭 */}
        <TabsContent value="reports" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">월간 리포트 생성</CardTitle>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => generateReport.mutate({
                    targetUserId: selectedUserId,
                    year: now.getFullYear(),
                    month: now.getMonth() + 1,
                  })}
                  disabled={generateReport.isPending}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {generateReport.isPending ? "생성 중..." : `${now.getFullYear()}년 ${now.getMonth() + 1}월 리포트 생성`}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>사용자 ID를 입력하고 리포트를 생성하세요.</p>
                <div className="mt-4">
                  <Input
                    type="number"
                    className="w-32 mx-auto"
                    placeholder="사용자 ID"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* A/B 테스트 탭 */}
        <TabsContent value="ab" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={createExpOpen} onOpenChange={setCreateExpOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" /> 실험 생성
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>A/B 테스트 생성</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>실험 이름</Label>
                    <Input className="mt-1" value={expName} onChange={(e) => setExpName(e.target.value)} />
                  </div>
                  <div>
                    <Label>실험 유형</Label>
                    <Select value={expType} onValueChange={setExpType}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mission">미션</SelectItem>
                        <SelectItem value="feedback">피드백</SelectItem>
                        <SelectItem value="ui">UI</SelectItem>
                        <SelectItem value="notification">알림</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => createExperiment.mutate({
                      name: expName,
                      experimentType: expType as "mission" | "feedback" | "ui" | "notification",
                      variantA: { label: "A안" },
                      variantB: { label: "B안" },
                    })}
                    disabled={!expName || createExperiment.isPending}
                  >
                    {createExperiment.isPending ? "생성 중..." : "생성하기"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {experiments?.map((exp) => (
            <Card key={exp.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{exp.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant={exp.status === "running" ? "default" : "secondary"}>
                      {exp.status === "running" ? "진행 중" : exp.status === "draft" ? "초안" : exp.status === "completed" ? "완료" : "일시정지"}
                    </Badge>
                    {exp.status === "draft" && (
                      <Button size="sm" variant="outline" className="h-7"
                        onClick={() => updateExpStatus.mutate({ experimentId: exp.id, status: "running" })}>
                        <Play className="w-3 h-3 mr-1" /> 시작
                      </Button>
                    )}
                    {exp.status === "running" && (
                      <Button size="sm" variant="outline" className="h-7"
                        onClick={() => updateExpStatus.mutate({ experimentId: exp.id, status: "paused" })}>
                        <Pause className="w-3 h-3 mr-1" /> 일시정지
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 text-sm text-muted-foreground">
                  <span>유형: {exp.experimentType}</span>
                  <span>트래픽 분배: {exp.trafficSplit}%</span>
                  {exp.winnerVariant && <span className="text-green-600 font-medium">승자: {exp.winnerVariant}</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  생성: {new Date(exp.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
