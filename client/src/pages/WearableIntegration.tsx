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
import { Activity, Heart, Zap, Watch, Plus, Trash2, RefreshCw, Footprints, Flame } from "lucide-react";
import { toast } from "sonner";

const PLATFORM_INFO: Record<string, { name: string; icon: string; color: string }> = {
  apple_watch: { name: "Apple Watch", icon: "🍎", color: "bg-gray-100" },
  galaxy_watch: { name: "Galaxy Watch", icon: "🌀", color: "bg-blue-100" },
  fitbit: { name: "Fitbit", icon: "💚", color: "bg-green-100" },
  garmin: { name: "Garmin", icon: "🔵", color: "bg-blue-100" },
  polar: { name: "Polar", icon: "❄️", color: "bg-cyan-100" },
  whoop: { name: "WHOOP", icon: "⚡", color: "bg-yellow-100" },
};

export default function WearableIntegration() {
  const [addOpen, setAddOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [deviceName, setDeviceName] = useState("");

  const { data: connections, refetch: refetchConnections } = trpc.wearable.getConnections.useQuery();
  const { data: bioSummary } = trpc.wearable.getBioSummary.useQuery();
  const { data: bioData } = trpc.wearable.getBioData.useQuery({ hours: 24 });
  const { data: exerciseSessions } = trpc.wearable.getExerciseSessions.useQuery({ limit: 10 });

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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cyan-700">웨어러블 연동</h1>
          <p className="text-muted-foreground text-sm mt-1">스마트워치 및 피트니스 트래커 연동 관리</p>
        </div>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-cyan-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100">
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">최신 심박수</p>
              <p className="text-xl font-bold">{bioSummary?.latestBio?.heartRate ?? "--"} <span className="text-sm font-normal">bpm</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-cyan-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100">
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">혈중 산소</p>
              <p className="text-xl font-bold">{bioSummary?.latestBio?.bloodOxygen ?? "--"}<span className="text-sm font-normal">%</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-cyan-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-orange-100">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">오늘 소모 칼로리</p>
              <p className="text-xl font-bold">{bioSummary?.todayCalories ?? 0} <span className="text-sm font-normal">kcal</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-cyan-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100">
              <Footprints className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">오늘 걸음 수</p>
              <p className="text-xl font-bold">{(bioSummary?.todaySteps ?? 0).toLocaleString()}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections?.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
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
                <div className="text-center py-8 text-muted-foreground">
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
              <div className="text-center py-12 text-muted-foreground">
                <Zap className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>운동 세션이 없습니다.</p>
              </div>
            )}
            {exerciseSessions?.map((session) => (
              <Card key={session.id}>
                <CardContent className="p-4 flex items-center justify-between">
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
