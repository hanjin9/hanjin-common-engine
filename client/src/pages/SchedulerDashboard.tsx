/**
 * SchedulerDashboard.tsx — Heartbeat 크론 관리 대시보드
 * - 일일 미션 발송 크론 등록/삭제
 * - 주간 리포트 크론 등록/삭제
 * - 등록된 크론 목록 조회
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Clock, Calendar, RefreshCw, Trash2, Plus,
  AlertCircle, CheckCircle2, Timer, Zap
} from "lucide-react";

function formatDate(d: string | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

export default function SchedulerDashboard() {
  const [deletingUid, setDeletingUid] = useState<string | null>(null);

  const { data: cronData, isLoading, refetch } = trpc.scheduler.listCronJobs.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const setupDaily = trpc.scheduler.setupDailyMissionCron.useMutation({
    onSuccess: (data) => {
      toast.success(`일일 미션 크론 등록 완료! 다음 실행: ${formatDate(data.nextExecutionAt)}`);
      refetch();
    },
    onError: (err) => toast.error(`등록 실패: ${err.message}`),
  });

  const setupWeekly = trpc.scheduler.setupWeeklyReportCron.useMutation({
    onSuccess: (data) => {
      toast.success(`주간 리포트 크론 등록 완료! 다음 실행: ${formatDate(data.nextExecutionAt)}`);
      refetch();
    },
    onError: (err) => toast.error(`등록 실패: ${err.message}`),
  });

  const deleteCron = trpc.scheduler.deleteCronJob.useMutation({
    onSuccess: () => {
      toast.success("크론 삭제 완료");
      setDeletingUid(null);
      refetch();
    },
    onError: (err) => {
      toast.error(`삭제 실패: ${err.message}`);
      setDeletingUid(null);
    },
  });

  const jobs = cronData?.jobs ?? [];
  const dailyJob = jobs.find(j => j.callbackPath === "/api/scheduled/daily-mission");
  const weeklyJob = jobs.find(j => j.callbackPath === "/api/scheduled/weekly-mission-report");

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Timer className="w-6 h-6 text-amber-400" />
              업무 스케줄 관리
            </h1>
            <p className="text-slate-400 text-sm mt-1">AI 피드백 자동 발송 · 미션 자동화 · 업무 스케줄</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-slate-600 text-slate-300">
            <RefreshCw className="w-4 h-4 mr-1" /> 새로고침
          </Button>
        </div>

        {/* 배포 안내 */}
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="pt-4 pb-3 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-200">
              <strong>배포 후 실제 동작합니다.</strong> 개발 환경에서는 핸들러만 등록되며, 크론 등록 후 실제 발송은 프로덕션 배포 시 활성화됩니다.
            </p>
          </CardContent>
        </Card>

        {/* 크론 카드 2개 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 일일 미션 발송 */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                일일 미션 자동 발송
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-slate-400 space-y-1">
                <p>⏰ 매일 <strong className="text-white">오전 10:00 KST</strong> (UTC 01:00)</p>
                <p>📍 경로: <code className="text-xs bg-slate-700 px-1 rounded">/api/scheduled/daily-mission</code></p>
                <p>📋 크론: <code className="text-xs bg-slate-700 px-1 rounded">0 0 1 * * *</code></p>
              </div>
              {dailyJob ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">등록됨</span>
                    <Badge variant="outline" className={dailyJob.isEnable ? "border-green-500 text-green-400" : "border-red-500 text-red-400"}>
                      {dailyJob.isEnable ? "활성" : "비활성"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">다음 실행: {formatDate(dailyJob.nextExecutionAt)}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10 w-full"
                    onClick={() => {
                      setDeletingUid(dailyJob.taskUid);
                      deleteCron.mutate({ taskUid: dailyJob.taskUid });
                    }}
                    disabled={deletingUid === dailyJob.taskUid}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    {deletingUid === dailyJob.taskUid ? "삭제 중..." : "크론 삭제"}
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                  onClick={() => setupDaily.mutate()}
                  disabled={setupDaily.isPending}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {setupDaily.isPending ? "등록 중..." : "크론 등록"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* 주간 리포트 */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                주간 미션 리포트
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-slate-400 space-y-1">
                <p>⏰ 매주 <strong className="text-white">월요일 09:00 KST</strong> (UTC 00:00)</p>
                <p>📍 경로: <code className="text-xs bg-slate-700 px-1 rounded">/api/scheduled/weekly-mission-report</code></p>
                <p>📋 크론: <code className="text-xs bg-slate-700 px-1 rounded">0 0 0 * * 1</code></p>
              </div>
              {weeklyJob ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">등록됨</span>
                    <Badge variant="outline" className={weeklyJob.isEnable ? "border-green-500 text-green-400" : "border-red-500 text-red-400"}>
                      {weeklyJob.isEnable ? "활성" : "비활성"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">다음 실행: {formatDate(weeklyJob.nextExecutionAt)}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10 w-full"
                    onClick={() => {
                      setDeletingUid(weeklyJob.taskUid);
                      deleteCron.mutate({ taskUid: weeklyJob.taskUid });
                    }}
                    disabled={deletingUid === weeklyJob.taskUid}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    {deletingUid === weeklyJob.taskUid ? "삭제 중..." : "크론 삭제"}
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                  onClick={() => setupWeekly.mutate()}
                  disabled={setupWeekly.isPending}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {setupWeekly.isPending ? "등록 중..." : "크론 등록"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ✅ AI 피드백 자동 발송 크론 (보고서 3·4순위 반영) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* AI 1차 피드백 자동 발송 */}
          <div className="bg-green-900/30 border border-green-700/40 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-400">🤖</span>
              <h3 className="font-semibold text-green-300">AI 1차 피드백 자동 발송</h3>
              <span className="ml-auto text-xs bg-green-800 text-green-300 px-2 py-0.5 rounded">자동</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">미션 완료 즉시 자동 발송 · 격려/칭찬 피드백</p>
            <p>📋 크론: <code className="text-xs bg-slate-700 px-1 rounded">* * * * *</code> (실시간 트리거)</p>
            <div className="mt-3 flex gap-2">
              <button className="flex-1 py-1.5 rounded bg-green-700 hover:bg-green-600 text-xs text-white transition">활성화</button>
              <button className="flex-1 py-1.5 rounded border border-slate-600 text-xs text-slate-300 hover:bg-slate-700 transition">설정</button>
            </div>
          </div>

          {/* AI 2차 피드백 자동 발송 */}
          <div className="bg-yellow-900/30 border border-yellow-700/40 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-400">⚠️</span>
              <h3 className="font-semibold text-yellow-300">AI 2차 피드백 자동 발송</h3>
              <span className="ml-auto text-xs bg-yellow-800 text-yellow-300 px-2 py-0.5 rounded">D+3</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">3일 미활동 시 경고/개선 피드백 자동 발송</p>
            <p>📋 크론: <code className="text-xs bg-slate-700 px-1 rounded">0 9 * * *</code> (매일 09:00)</p>
            <div className="mt-3 flex gap-2">
              <button className="flex-1 py-1.5 rounded bg-yellow-700 hover:bg-yellow-600 text-xs text-white transition">활성화</button>
              <button className="flex-1 py-1.5 rounded border border-slate-600 text-xs text-slate-300 hover:bg-slate-700 transition">설정</button>
            </div>
          </div>

          {/* AI 3차 피드백 자동 발송 */}
          <div className="bg-purple-900/30 border border-purple-700/40 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-purple-400">⚡</span>
              <h3 className="font-semibold text-purple-300">AI 3차 프리미엄 피드백</h3>
              <span className="ml-auto text-xs bg-purple-800 text-purple-300 px-2 py-0.5 rounded">D+7</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">7일 미활동 · 하위 20% → 자동 분류 후 코치 검토 발송</p>
            <p>📋 크론: <code className="text-xs bg-slate-700 px-1 rounded">0 10 * * 1</code> (매주 월 10:00)</p>
            <div className="mt-3 flex gap-2">
              <button className="flex-1 py-1.5 rounded bg-purple-700 hover:bg-purple-600 text-xs text-white transition">활성화</button>
              <button className="flex-1 py-1.5 rounded border border-slate-600 text-xs text-slate-300 hover:bg-slate-700 transition">설정</button>
            </div>
          </div>

          {/* 미션 완료 포인트 자동 지급 */}
          <div className="bg-blue-900/30 border border-blue-700/40 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-400">⭐</span>
              <h3 className="font-semibold text-blue-300">미션 완료 포인트 자동 지급</h3>
              <span className="ml-auto text-xs bg-blue-800 text-blue-300 px-2 py-0.5 rounded">실시간</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">미션 완료 즉시 설정 포인트 자동 지급 + 격려 문자</p>
            <p>📋 크론: <code className="text-xs bg-slate-700 px-1 rounded">* * * * *</code> (실시간 트리거)</p>
            <div className="mt-3 flex gap-2">
              <button className="flex-1 py-1.5 rounded bg-blue-700 hover:bg-blue-600 text-xs text-white transition">활성화</button>
              <button className="flex-1 py-1.5 rounded border border-slate-600 text-xs text-slate-300 hover:bg-slate-700 transition">설정</button>
            </div>
          </div>

          {/* 수면 체크 리마인더 */}
          <div className="bg-indigo-900/30 border border-indigo-700/40 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-indigo-400">🌙</span>
              <h3 className="font-semibold text-indigo-300">수면 체크 리마인더</h3>
              <span className="ml-auto text-xs bg-indigo-800 text-indigo-300 px-2 py-0.5 rounded">매일</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">취침 전 수면 목표 푸시 · 계절별 맞춤 문구 적용</p>
            <p>📋 크론: <code className="text-xs bg-slate-700 px-1 rounded">0 22 * * *</code> (매일 22:00)</p>
            <div className="mt-3 flex gap-2">
              <button className="flex-1 py-1.5 rounded bg-indigo-700 hover:bg-indigo-600 text-xs text-white transition">활성화</button>
              <button className="flex-1 py-1.5 rounded border border-slate-600 text-xs text-slate-300 hover:bg-slate-700 transition">설정</button>
            </div>
          </div>

          {/* 웰니스 주간 요약 */}
          <div className="bg-teal-900/30 border border-teal-700/40 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-teal-400">📊</span>
              <h3 className="font-semibold text-teal-300">웰니스 주간 요약 발송</h3>
              <span className="ml-auto text-xs bg-teal-800 text-teal-300 px-2 py-0.5 rounded">주간</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">주간 건강 점수 · 미션 달성률 · 개인 분석 리포트</p>
            <p>📋 크론: <code className="text-xs bg-slate-700 px-1 rounded">0 8 * * 1</code> (매주 월 08:00)</p>
            <div className="mt-3 flex gap-2">
              <button className="flex-1 py-1.5 rounded bg-teal-700 hover:bg-teal-600 text-xs text-white transition">활성화</button>
              <button className="flex-1 py-1.5 rounded border border-slate-600 text-xs text-slate-300 hover:bg-slate-700 transition">설정</button>
            </div>
          </div>

        </div>

        {/* ✅ AI 피드백 자동 발송 스케줄 (보고서 3차 반영) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">

          {/* AI 피드백 1차 자동 발송 */}
          <div className="bg-green-950 border border-green-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="text-white font-semibold">AI 피드백 1차 자동 발송</h3>
                <p className="text-green-400 text-xs">미션 완료 즉시 격려 메시지</p>
              </div>
              <span className="ml-auto bg-green-700 text-green-100 text-xs px-2 py-0.5 rounded-full">활성</span>
            </div>
            <p className="text-green-300 text-xs mb-3">📋 트리거: 미션 완료 이벤트 감지 즉시</p>
            <p className="text-slate-400 text-xs">채널: 앱 푸시 + 이메일 | 포인트 자동 지급 연동</p>
          </div>

          {/* AI 피드백 2차 자동 발송 */}
          <div className="bg-yellow-950 border border-yellow-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⚡</span>
              <div>
                <h3 className="text-white font-semibold">AI 피드백 2차 자동 발송</h3>
                <p className="text-yellow-400 text-xs">3일 미활동 · 점수 하락 시 경고</p>
              </div>
              <span className="ml-auto bg-yellow-700 text-yellow-100 text-xs px-2 py-0.5 rounded-full">활성</span>
            </div>
            <p className="text-yellow-300 text-xs mb-3">📋 크론: <code className="text-xs bg-slate-700 px-1 rounded">0 9 * * *</code> (매일 09:00 미활동 감지)</p>
            <p className="text-slate-400 text-xs">채널: SMS + 앱 푸시 | 수면 부족 3일 연속 자동 트리거</p>
          </div>

          {/* AI 피드백 3차 자동 발송 */}
          <div className="bg-purple-950 border border-purple-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">👑</span>
              <div>
                <h3 className="text-white font-semibold">AI 피드백 3차 자동 발송</h3>
                <p className="text-purple-400 text-xs">D+7 프리미엄 피드백 (코치 추가 가능)</p>
              </div>
              <span className="ml-auto bg-purple-700 text-purple-100 text-xs px-2 py-0.5 rounded-full">활성</span>
            </div>
            <p className="text-purple-300 text-xs mb-3">📋 크론: <code className="text-xs bg-slate-700 px-1 rounded">0 10 * * *</code> (매일 10:00 D+7 대상 검사)</p>
            <p className="text-slate-400 text-xs">채널: 이메일 + PDF | 코치 수동 내용 추가 가능</p>
          </div>

          {/* 미션 완료자 포인트 자동 지급 */}
          <div className="bg-orange-950 border border-orange-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⭐</span>
              <div>
                <h3 className="text-white font-semibold">미션 완료자 포인트 자동 지급</h3>
                <p className="text-orange-400 text-xs">완료 즉시 설정 포인트 자동 지급</p>
              </div>
              <span className="ml-auto bg-orange-700 text-orange-100 text-xs px-2 py-0.5 rounded-full">활성</span>
            </div>
            <p className="text-orange-300 text-xs mb-3">📋 트리거: 미션 완료 이벤트 즉시</p>
            <p className="text-slate-400 text-xs">19단계 × 20슬롯 포인트 자동 계산 지급</p>
          </div>

          {/* 수면 체크 리마인더 */}
          <div className="bg-blue-950 border border-blue-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">😴</span>
              <div>
                <h3 className="text-white font-semibold">수면 체크 리마인더</h3>
                <p className="text-blue-400 text-xs">계절별 맞춤 수면 목표 발송</p>
              </div>
              <span className="ml-auto bg-blue-700 text-blue-100 text-xs px-2 py-0.5 rounded-full">활성</span>
            </div>
            <p className="text-blue-300 text-xs mb-3">📋 크론: <code className="text-xs bg-slate-700 px-1 rounded">0 22 * * *</code> (매일 22:00 취침 리마인더)</p>
            <p className="text-slate-400 text-xs">봄/여름/가을/겨울 계절별 맞춤 문구 자동 선택</p>
          </div>

          {/* 웰니스 주간 요약 발송 */}
          <div className="bg-teal-950 border border-teal-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📊</span>
              <div>
                <h3 className="text-white font-semibold">웰니스 주간 요약 발송</h3>
                <p className="text-teal-400 text-xs">매주 월요일 개인 건강 리포트</p>
              </div>
              <span className="ml-auto bg-teal-700 text-teal-100 text-xs px-2 py-0.5 rounded-full">활성</span>
            </div>
            <p className="text-teal-300 text-xs mb-3">📋 크론: <code className="text-xs bg-slate-700 px-1 rounded">0 8 * * 1</code> (매주 월요일 08:00)</p>
            <p className="text-slate-400 text-xs">10단계 수련 진도 + AI 점수 + 포인트 요약</p>
          </div>

        </div>

        {/* 등록된 크론 전체 목록 */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              등록된 크론 전체 목록
              {cronData && (
                <Badge variant="secondary" className="ml-2 text-xs">{cronData.total}개</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full bg-slate-700" />)}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>등록된 크론이 없습니다.</p>
                <p className="text-xs mt-1">위 버튼으로 크론을 등록하세요.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-400">이름</TableHead>
                      <TableHead className="text-slate-400">크론 표현식</TableHead>
                      <TableHead className="text-slate-400">경로</TableHead>
                      <TableHead className="text-slate-400">마지막 실행</TableHead>
                      <TableHead className="text-slate-400">다음 실행</TableHead>
                      <TableHead className="text-slate-400">상태</TableHead>
                      <TableHead className="text-slate-400">삭제</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map(job => (
                      <TableRow key={job.taskUid} className="border-slate-700 hover:bg-slate-700/30">
                        <TableCell className="text-sm text-white font-medium">{job.name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-slate-700 px-1.5 py-0.5 rounded text-amber-300">
                            {job.cronExpression}
                          </code>
                        </TableCell>
                        <TableCell className="text-xs text-slate-400 font-mono">{job.callbackPath}</TableCell>
                        <TableCell className="text-xs text-slate-400">{formatDate(job.lastExecutedAt)}</TableCell>
                        <TableCell className="text-xs text-slate-300">{formatDate(job.nextExecutionAt)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={job.isEnable
                              ? "border-green-500/50 text-green-400 text-xs"
                              : "border-slate-500 text-slate-400 text-xs"}
                          >
                            {job.isEnable ? "활성" : "비활성"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"
                            onClick={() => {
                              setDeletingUid(job.taskUid);
                              deleteCron.mutate({ taskUid: job.taskUid });
                            }}
                            disabled={deletingUid === job.taskUid}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
