import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, Send, MessageSquare, Mic, Mail, Bell, Smartphone } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  sent: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  push: <Bell className="w-4 h-4" />,
  sms: <MessageSquare className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  voice: <Mic className="w-4 h-4" />,
  in_app: <Smartphone className="w-4 h-4" />,
};

const TYPE_LABELS: Record<string, string> = {
  auto_1st: "1차 자동",
  auto_2nd: "2차 자동",
  manual_3rd: "3차 수동",
};

export default function FeedbackAdvancedDashboard() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [previewFeedback, setPreviewFeedback] = useState<{ title: string; content: string } | null>(null);

  const { data: feedbackQueue, refetch } = trpc.feedbackAdvanced.getFeedbackQueue.useQuery({
    status: statusFilter !== "all" ? (statusFilter as "pending" | "approved" | "sent" | "failed" | "cancelled") : undefined,
    feedbackType: typeFilter !== "all" ? (typeFilter as "auto_1st" | "auto_2nd" | "manual_3rd") : undefined,
    limit: 50,
    offset: 0,
  });

  const { data: stats } = trpc.feedbackAdvanced.getFeedbackStats.useQuery();

  const approveFeedback = trpc.feedbackAdvanced.approveFeedback.useMutation({
    onSuccess: () => { toast.success("피드백이 승인되었습니다."); refetch(); },
    onError: () => toast.error("승인에 실패했습니다."),
  });

  const rejectFeedback = trpc.feedbackAdvanced.rejectFeedback.useMutation({
    onSuccess: () => { toast.success("피드백이 거절되었습니다."); refetch(); },
    onError: () => toast.error("거절에 실패했습니다."),
  });

  const markSent = trpc.feedbackAdvanced.markFeedbackSent.useMutation({
    onSuccess: () => { toast.success("발송 완료로 처리되었습니다."); refetch(); },
  });

  const statMap = stats?.statusStats?.reduce((acc, s) => {
    acc[s.status] = s.count;
    return acc;
  }, {} as Record<string, number>) ?? {};

  return (
    <div className="p-3 md:p-4 space-y-3">
      <div>
        <h1 className="text-xl font-bold text-indigo-700">AI 피드백 고도화</h1>
        <p className="text-muted-foreground text-sm mt-1">3단계 피드백 시스템 관리 (1차 자동 → 2차 자동 → 3차 수동)</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { label: "대기 중", key: "pending", icon: <Clock className="w-5 h-5 text-yellow-500" />, bg: "bg-yellow-50" },
          { label: "승인됨", key: "approved", icon: <CheckCircle className="w-5 h-5 text-blue-500" />, bg: "bg-blue-50" },
          { label: "발송됨", key: "sent", icon: <Send className="w-5 h-5 text-green-500" />, bg: "bg-green-50" },
          { label: "실패", key: "failed", icon: <XCircle className="w-5 h-5 text-red-500" />, bg: "bg-red-50" },
          { label: "취소됨", key: "cancelled", icon: <XCircle className="w-5 h-5 text-gray-400" />, bg: "bg-gray-50" },
        ].map((item) => (
          <Card key={item.key} className={`${item.bg} border-0`}>
            <CardContent className="p-2 flex items-center gap-3">
              {item.icon}
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-base font-bold truncate">{statMap[item.key] ?? 0}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 채널별 통계 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">채널별 발송 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {stats?.channelStats?.map((cs) => (
              <div key={cs.channel} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
                {CHANNEL_ICONS[cs.channel]}
                <span className="text-sm font-medium capitalize">{cs.channel}</span>
                <Badge variant="secondary">{cs.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 피드백 큐 테이블 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">피드백 큐</CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="pending">대기 중</SelectItem>
                  <SelectItem value="approved">승인됨</SelectItem>
                  <SelectItem value="sent">발송됨</SelectItem>
                  <SelectItem value="failed">실패</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 유형</SelectItem>
                  <SelectItem value="auto_1st">1차 자동</SelectItem>
                  <SelectItem value="auto_2nd">2차 자동</SelectItem>
                  <SelectItem value="manual_3rd">3차 수동</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">유형</th>
                  <th className="text-left py-2 px-3">채널</th>
                  <th className="text-left py-2 px-3">제목</th>
                  <th className="text-left py-2 px-3">티어</th>
                  <th className="text-left py-2 px-3">상태</th>
                  <th className="text-left py-2 px-3">생성일</th>
                  <th className="text-right py-2 px-3">액션</th>
                </tr>
              </thead>
              <tbody>
                {feedbackQueue?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-3 text-muted-foreground">
                      피드백이 없습니다.
                    </td>
                  </tr>
                )}
                {feedbackQueue?.map((fb) => (
                  <tr key={fb.id} className="border-b hover:bg-muted/30">
                    <td className="py-2 px-3">
                      <Badge variant="outline" className="text-xs">
                        {TYPE_LABELS[fb.feedbackType]}
                      </Badge>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        {CHANNEL_ICONS[fb.channel]}
                        <span className="capitalize text-xs">{fb.channel}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 max-w-[200px] truncate">{fb.title}</td>
                    <td className="py-2 px-3">
                      <span className="text-xs text-muted-foreground">{fb.rankTier ?? "--"}</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[fb.status]}`}>
                        {fb.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-xs text-muted-foreground">
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setPreviewFeedback({ title: fb.title, content: fb.content })}
                        >
                          미리보기
                        </Button>
                        {fb.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-green-600"
                              onClick={() => approveFeedback.mutate({ feedbackId: fb.id })}
                            >
                              승인
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-red-500"
                              onClick={() => rejectFeedback.mutate({ feedbackId: fb.id })}
                            >
                              거절
                            </Button>
                          </>
                        )}
                        {fb.status === "approved" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-blue-600"
                            onClick={() => markSent.mutate({ feedbackId: fb.id })}
                          >
                            발송완료
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 미리보기 모달 */}
      <Dialog open={!!previewFeedback} onOpenChange={() => setPreviewFeedback(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{previewFeedback?.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm leading-relaxed">{previewFeedback?.content}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
