/**
 * SleepSettings.tsx — 수면 자동 체크 설정 페이지
 * 기본값: 자동 체크 ON (사용자가 거부 선택 시 옵트아웃)
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Moon, Clock, Bell, AlertCircle, CheckCircle2, Info } from "lucide-react";

export default function SleepSettings() {
  const { data: settings, isLoading, refetch } = trpc.sleep.getSettings.useQuery();
  const updateMutation = trpc.sleep.updateSettings.useMutation({
    onSuccess: (res) => {
      toast.success(res.message);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const [localStartHour, setLocalStartHour] = useState<number | null>(null);
  const [localEndHour, setLocalEndHour] = useState<number | null>(null);
  const [localMinMinutes, setLocalMinMinutes] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-1.5">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm text-muted-foreground">수면 설정을 불러오지 못했습니다.</p>
        <Button variant="outline" onClick={() => refetch()}>다시 시도</Button>
      </div>
    );
  }

  // 슬라이더 값: 18~26 범위 (18=오후6시, 24=자정, 25=오전1시, 26=오전2시)
  // DB 저장값: 0~23 (실제 시간)
  const toSliderVal = (h: number) => h < 6 ? h + 24 : h; // 0~5 → 24~29, 18~23 그대로
  const fromSliderVal = (v: number) => v >= 24 ? v - 24 : v; // 24~29 → 0~5

  const startHour = localStartHour ?? settings.sleepStartHour;
  const endHour = localEndHour ?? settings.sleepEndHour;
  const minMinutes = localMinMinutes ?? settings.minSleepMinutes;
  const isActive = settings.autoTrackEnabled && !settings.optedOut;

  const handleToggleAutoTrack = () => {
    updateMutation.mutate({ autoTrackEnabled: !settings.autoTrackEnabled });
  };

  const handleOptOut = () => {
    updateMutation.mutate({ optedOut: !settings.optedOut });
  };

  const handleSaveTimeSettings = () => {
    updateMutation.mutate({
      sleepStartHour: startHour,
      sleepEndHour: endHour,
      minSleepMinutes: minMinutes,
    });
  };

  const formatHour = (h: number) => {
    const period = h >= 12 ? "오후" : "오전";
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${period} ${display}시`;
  };

  return (
    <div className="max-w-2xl mx-auto p-3 md:p-4 space-y-1.5">
      {/* 헤더 */}
      <div className="flex items-center gap-1.5">
        <Moon className="h-7 w-7 text-indigo-500" />
        <div>
          <h1 className="text-base font-bold truncate">수면 자동 체크</h1>
          <p className="text-sm text-muted-foreground">수면 시간을 자동으로 감지하고 기록합니다</p>
        </div>
        <div className="ml-auto">
          {isActive ? (
            <Badge className="bg-green-100 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" /> 활성화됨
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-gray-100 text-gray-500">
              <AlertCircle className="h-3 w-3 mr-1" /> 비활성화됨
            </Badge>
          )}
        </div>
      </div>

      {/* 메인 ON/OFF 카드 */}
      <Card className={isActive ? "border-green-200 bg-green-50/30" : "border-gray-200"}>
        <CardHeader className="pb-1">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">수면 자동 감지</CardTitle>
              <CardDescription className="mt-1">
                앱이 수면 패턴을 자동으로 감지하여 기록합니다. 기본으로 활성화되어 있습니다.
              </CardDescription>
            </div>
            <Switch
              checked={settings.autoTrackEnabled}
              onCheckedChange={handleToggleAutoTrack}
              disabled={updateMutation.isPending}
            />
          </div>
        </CardHeader>
      </Card>

      {/* 옵트아웃 카드 */}
      <Card className={settings.optedOut ? "border-orange-200 bg-orange-50/30" : ""}>
        <CardHeader className="pb-1">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-1.5">
                수면 체크 거부
                {settings.optedOut && (
                  <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                    거부 중
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                수면 자동 체크를 원하지 않으시면 거부를 선택하세요. 언제든지 다시 활성화할 수 있습니다.
              </CardDescription>
            </div>
            <Switch
              checked={settings.optedOut}
              onCheckedChange={handleOptOut}
              disabled={updateMutation.isPending}
            />
          </div>
        </CardHeader>
        {settings.optedOut && settings.optedOutAt && (
          <CardContent className="pt-0">
            <p className="text-xs text-orange-600">
              거부 일시: {new Date(settings.optedOutAt).toLocaleString("ko-KR")}
            </p>
          </CardContent>
        )}
      </Card>

      <Separator />

      {/* 수면 시간대 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> 수면 감지 시간대
          </CardTitle>
          <CardDescription>
            이 시간대에 앱이 수면 여부를 감지합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {/* 수면 시작 시간 */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">수면 시작</span>
              <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                {formatHour(startHour)}
              </span>
            </div>
            <Slider
              value={[toSliderVal(startHour)]}
              min={18}
              max={26}
              step={1}
              onValueChange={([v]) => setLocalStartHour(fromSliderVal(v))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>오후 6시</span>
              <span>오전 2시</span>
            </div>
          </div>

          {/* 수면 종료 시간 */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">기상 시간</span>
              <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                {formatHour(endHour)}
              </span>
            </div>
            <Slider
              value={[endHour]}
              min={4}
              max={12}
              step={1}
              onValueChange={([v]) => setLocalEndHour(v)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>오전 4시</span>
              <span>오후 12시</span>
            </div>
          </div>

          {/* 최소 수면 시간 */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">최소 수면 시간</span>
              <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                {minMinutes}분
              </span>
            </div>
            <Slider
              value={[minMinutes]}
              min={10}
              max={120}
              step={10}
              onValueChange={([v]) => setLocalMinMinutes(v)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10분</span>
              <span>2시간</span>
            </div>
          </div>

          <Button
            onClick={handleSaveTimeSettings}
            disabled={updateMutation.isPending}
            className="w-full"
          >
            시간 설정 저장
          </Button>
        </CardContent>
      </Card>

      {/* 알림 설정 */}
      <Card>
        <CardHeader className="pb-1">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-1.5">
                <Bell className="h-4 w-4" /> 수면 알림
              </CardTitle>
              <CardDescription className="mt-1">
                수면 기록 완료 시 알림을 받습니다
              </CardDescription>
            </div>
            <Switch
              checked={settings.notificationsEnabled}
              onCheckedChange={(v) => updateMutation.mutate({ notificationsEnabled: v })}
              disabled={updateMutation.isPending}
            />
          </div>
        </CardHeader>
      </Card>

      {/* 포인트 안내 */}
      <Card className="bg-indigo-50/50 border-indigo-100">
        <CardContent className="pt-2">
          <div className="flex gap-1.5">
            <Info className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
            <div className="text-sm text-indigo-700 space-y-1">
              <p className="font-medium">수면 포인트 적립 기준</p>
              <p>7시간 이상 수면 → <strong>+50pt</strong></p>
              <p>6시간 이상 수면 → <strong>+30pt</strong></p>
              <p>최소 시간 이상 수면 → <strong>+10pt</strong></p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 마지막 기록 정보 */}
      {settings.lastAutoRecordedAt && (
        <p className="text-xs text-center text-muted-foreground">
          마지막 자동 기록: {new Date(settings.lastAutoRecordedAt).toLocaleString("ko-KR")}
        </p>
      )}
    </div>
  );
}
