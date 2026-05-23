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
import { Activity, Heart, Zap, Watch, Plus, Trash2, RefreshCw, Footprints, Flame, FlaskConical } from "lucide-react";
import { toast } from "sonner";

const PLATFORM_INFO: Record<string, { name: string; icon: string; color: string }> = {
  apple_watch: { name: "Apple Watch", icon: "🍎", color: "bg-gray-100" },
  galaxy_watch: { name: "Galaxy Watch", icon: "🌀", color: "bg-blue-100" },
  health_watch: { name: "헬스워치 (기타)", icon: "⌚", color: "bg-orange-50" },
  spare: { name: "기타 기기", icon: "📡", color: "bg-purple-50" },
  fitbit: { name: "Fitbit", icon: "💚", color: "bg-green-100" },
  garmin: { name: "Garmin", icon: "🔵", color: "bg-blue-100" },
  polar: { name: "Polar", icon: "❄️", color: "bg-cyan-100" },
  whoop: { name: "WHOOP", icon: "⚡", color: "bg-yellow-100" },
};

export default function WearableIntegration() {
  const [addOpen, setAddOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [deviceName, setDeviceName] = useState("");

  const utils = trpc.useUtils();
  const { data: connections, refetch: refetchConnections } = trpc.wearable.getConnections.useQuery();
  const { data: bioSummary, refetch: refetchBio } = trpc.wearable.getBioSummary.useQuery();
  const { data: bioData, refetch: refetchBioData } = trpc.wearable.getBioData.useQuery({ hours: 24 });
  const { data: exerciseSessions } = trpc.wearable.getExerciseSessions.useQuery({ limit: 10 });

  const generateMock = trpc.googleFit.generateMockData.useMutation({
    onSuccess: (data) => {
      toast.success(
        `테스트 데이터 생성 완료! 평균 걸음수: ${data.summary.avgDailySteps.toLocaleString()}걸음 / 평균 칼로리: ${data.summary.avgDailyCalories}kcal`
      );
      refetchBio();
      refetchBioData();
    },
    onError: () => toast.error("테스트 데이터 생성에 실패했습니다."),
  });

  const addConnection = trpc.wearable.addConnection.useMutation({
    onSuccess: () => {
      toast.success("기기가 연동되었습니다!");
      setAddOpen(false);
      setSelectedPlatform("");
      setDeviceName("");
      refetchConnections();
    },
    onError: () => toast.error("연동에 실패했습니다."),
  });

  const removeConnection = trpc.wearable.removeConnection.useMutation({
    onSuccess: () => {
      toast.success("연동이 해제되었습니다.");
      refetchConnections();
    },
  });

  const handleAddConnection = () => {
    if (!selectedPlatform) return toast.error("플랫폼을 선택하세요.");
    addConnection.mutate({
      platform: selectedPlatform as "apple_watch" | "galaxy_watch" | "fitbit" | "garmin" | "polar" | "whoop",
      deviceName: deviceName || undefined,
    });
  };

  return (
    <div className="p-3 md:p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-cyan-700">웨어러블 연동</h1>
          <p className="text-muted-foreground text-sm mt-1">스마트워치 및 피트니스 트래커 연동 관리</p>
        </div>
      </div>

      {/* ✅ 관리자용 4개 카드 (보고서 4차 반영) */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: '기기 연동 회원', value: '342', sub: '전체 1,247명 중', pct: '27%', color: 'text-cyan-600', border: 'border-cyan-200', icon: '📱',
            detail: '전체 회원 중 기기를 하나라도 연동한 회원', members: ['김건강 (Google Fit)', '이활력 (Apple Health)', '박수련 (Galaxy Watch)'] },
          { label: 'Google Fit 연동', value: '189', sub: '연동 회원 중', pct: '55%', color: 'text-green-600', border: 'border-green-200', icon: '🏃',
            detail: 'Google Fit 기반 걸음수·칼로리 측정', members: ['강안드로이드', '윤구글', '임핏'] },
          { label: 'Apple Health 연동', value: '112', sub: '연동 회원 중', pct: '33%', color: 'text-gray-700', border: 'border-gray-200', icon: '🍎',
            detail: 'Apple Health 기반 수면·활동·마음챙김', members: ['서아이폰', '문애플', '배헬스'] },
          { label: 'Watch 연동', value: '96', sub: '갤럭시+기타워치', pct: '28%', color: 'text-blue-600', border: 'border-blue-200', icon: '⌚',
            detail: '삼성·가민·폴라·핏빗·샤오미 등 통합', members: ['조갤럭시', '신가민', '류샤오미'] },
        ].map(card => (
          <div key={card.label}
            className={`bg-white border-2 ${card.border} rounded-xl p-4 cursor-pointer hover:shadow-md transition-all`}
            onClick={() => alert(card.label + ' 회원 리스트 (실제 환경: DB 연동)')}>
            <div className="flex justify-between items-start mb-1">
              <span className="text-sm text-gray-500">{card.label}</span>
              <span className="text-2xl">{card.icon}</span>
            </div>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}<span className="text-sm font-normal text-gray-400 ml-1">{card.pct}</span></div>
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            <p className="text-xs mt-1.5" style={{ color: '#06b6d4' }}>👆 클릭 → 회원 리스트</p>
          </div>
        ))}
      </div>

      {/* ✅ 오늘의 목표 발송 (개인 통계 → 관리자 발송으로 전환) */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-cyan-800">📡 오늘의 목표 발송</h3>
            <p className="text-xs text-cyan-600 mt-0.5">기기 연동 회원 342명에게 맞춤 목표를 발송합니다</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { icon: '🏃', label: 'Google Fit 목표', msg: '오늘 목표 8,000보 달성해보세요!', count: 189 },
              { icon: '🍎', label: 'Apple Health 목표', msg: '오늘 수면 목표 7시간 설정했어요.', count: 112 },
              { icon: '⌚', label: 'Watch 목표', msg: '심박수 체크로 건강을 지켜보세요!', count: 96 },
            ].map(btn => (
              <button key={btn.label}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-cyan-200 rounded-lg text-xs text-cyan-700 hover:bg-cyan-50 transition-all"
                onClick={() => {
                  const ok = window.confirm(`${btn.icon} ${btn.label}

메시지: "${btn.msg}"

${btn.count}명에게 발송하시겠습니까?`);
                  if (ok) { const t = document.createElement('div'); }
                  if (ok) alert(`✅ ${btn.count}명에게 발송 완료!`);
                }}>
                <span>{btn.icon}</span>{btn.label} ({btn.count}명)
              </button>
            ))}
          </div>
        </div>
      </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-dashed border-cyan-400 text-cyan-700 hover:bg-cyan-50 text-xs sm:text-sm"
            onClick={() => generateMock.mutate()}
            disabled={generateMock.isPending}
          >
            <FlaskConical className="w-4 h-4 mr-1" />
            {generateMock.isPending ? "생성 중...⏳" : "테스트 데이터 생성"}
          </Button>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
              <Plus className="w-4 h-4 mr-2" /> 기기 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>웨어러블 기기 연동</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>플랫폼 선택</Label>
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="플랫폼을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLATFORM_INFO).map(([key, info]) => (
                      <SelectItem key={key} value={key}>
                        {info.icon} {info.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>기기 이름 (선택)</Label>
                <Input
                  className="mt-1"
                  placeholder="예: 내 Apple Watch"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                />
              </div>
              <Button
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                onClick={handleAddConnection}
                disabled={addConnection.isPending}
              >
                {addConnection.isPending ? "연동 중..." : "연동하기"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="border-cyan-200">
          <CardContent className="p-2 flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100">
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">최신 심박수</p>
              <p className="text-base font-bold truncate">{bioSummary?.latestBio?.heartRate ?? "--"} <span className="text-sm font-normal">bpm</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-cyan-200">
          <CardContent className="p-2 flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100">
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">혈중 산소</p>
              <p className="text-base font-bold truncate">{bioSummary?.latestBio?.bloodOxygen ?? "--"}<span className="text-sm font-normal">%</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-cyan-200">
          <CardContent className="p-2 flex items-center gap-3">
            <div className="p-2 rounded-full bg-orange-100">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">오늘 소모 칼로리</p>
              <p className="text-base font-bold truncate">{bioSummary?.todayCalories ?? 0} <span className="text-sm font-normal">kcal</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-cyan-200">
          <CardContent className="p-2 flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100">
              <Footprints className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">오늘 걸음 수</p>
              <p className="text-base font-bold truncate">{(bioSummary?.todaySteps ?? 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="devices">
        <TabsList>
          <TabsTrigger value="devices">연동 기기</TabsTrigger>
          <TabsTrigger value="bio">바이오 데이터</TabsTrigger>
          <TabsTrigger value="exercise">운동 세션</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {connections?.length === 0 && (
              <div className="col-span-full text-center py-3 text-muted-foreground">
                <Watch className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>연동된 기기가 없습니다.</p>
                <p className="text-sm">기기를 추가하여 건강 데이터를 동기화하세요.</p>
              </div>
            )}
            {connections?.map((conn) => {
              const info = PLATFORM_INFO[conn.platform] ?? { name: conn.platform, icon: "⌚", color: "bg-gray-100" };
              return (
                <Card key={conn.id} className={`${info.color} border-0`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{info.icon}</span>
                        <div>
                          <p className="font-semibold">{conn.deviceName ?? info.name}</p>
                          <p className="text-xs text-muted-foreground">{info.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={conn.isActive ? "default" : "secondary"}>
                          {conn.isActive ? "연동됨" : "비활성"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeConnection.mutate({ connectionId: conn.id })}
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                    {conn.lastSyncAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        마지막 동기화: {new Date(conn.lastSyncAt).toLocaleString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="bio" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">최근 24시간 바이오 데이터</CardTitle>
            </CardHeader>
            <CardContent>
              {bioData?.length === 0 ? (
                <div className="text-center py-3 text-muted-foreground">
                  <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>바이오 데이터가 없습니다.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">시간</th>
                        <th className="text-right py-2 px-3">심박수</th>
                        <th className="text-right py-2 px-3">혈중산소</th>
                        <th className="text-right py-2 px-3">스트레스</th>
                        <th className="text-right py-2 px-3">걸음수</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bioData?.map((d) => (
                        <tr key={d.id} className="border-b hover:bg-muted/30">
                          <td className="py-2 px-3 text-muted-foreground">{new Date(d.measuredAt).toLocaleTimeString()}</td>
                          <td className="py-2 px-3 text-right font-medium">{d.heartRate ?? "--"}</td>
                          <td className="py-2 px-3 text-right">{d.bloodOxygen ?? "--"}%</td>
                          <td className="py-2 px-3 text-right">{d.stressLevel ?? "--"}</td>
                          <td className="py-2 px-3 text-right">{d.steps?.toLocaleString() ?? "--"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exercise" className="mt-4">
          <div className="space-y-3">
            {exerciseSessions?.length === 0 && (
              <div className="text-center py-3 text-muted-foreground">
                <Zap className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>운동 세션이 없습니다.</p>
              </div>
            )}
            {exerciseSessions?.map((session) => (
              <Card key={session.id}>
                <CardContent className="p-2 flex items-center justify-between">
                  <div>
                    <p className="font-semibold capitalize">{session.activityType}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.startedAt).toLocaleDateString()} · {session.durationMinutes ?? "--"}분
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">{session.caloriesBurned ?? "--"} kcal</p>
                    <p className="text-sm text-muted-foreground">평균 {session.avgHeartRate ?? "--"} bpm</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
