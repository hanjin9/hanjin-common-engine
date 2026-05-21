import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertCircle, AlertTriangle, CheckCircle, Bell, X, ChevronRight
} from 'lucide-react';
import { useRouter } from 'wouter';

interface Notification {
  id: string;
  type: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  timestamp: string;
  actionUrl?: string;
  actionLabel?: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'error',
    title: '결제 오류 발생',
    message: '사용자 U004의 결제가 실패했습니다. 재시도가 필요합니다.',
    timestamp: '5분 전',
    actionUrl: '/admin/payment',
    actionLabel: '결제 관리로 이동',
    read: false,
  },
  {
    id: '2',
    type: 'warning',
    title: '시스템 경고',
    message: '서버 응답 시간이 평소보다 느립니다. (2.3초)',
    timestamp: '15분 전',
    actionUrl: '/admin/monitoring',
    actionLabel: '모니터링 보기',
    read: false,
  },
  {
    id: '3',
    type: 'error',
    title: '추가 인시던트',
    message: 'API 게이트웨이에서 5개의 요청이 타임아웃되었습니다.',
    timestamp: '30분 전',
    actionUrl: '/admin/monitoring',
    actionLabel: '상세 보기',
    read: false,
  },
  {
    id: '4',
    type: 'success',
    title: '정산 완료',
    message: '5월 21일 정산이 완료되었습니다. (₩2,432,700)',
    timestamp: '1시간 전',
    read: true,
  },
  {
    id: '5',
    type: 'info',
    title: '일일 보고서',
    message: '오늘의 일일 보고서가 생성되었습니다.',
    timestamp: '2시간 전',
    read: true,
  },
];

export function NotificationWidget() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [isExpanded, setIsExpanded] = useState(false);
  const [, navigate] = useRouter();

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'success':
        return 'default';
      default:
        return 'outline';
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const handleDismiss = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleActionClick = (notification: Notification) => {
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      handleMarkAsRead(notification.id);
      setIsExpanded(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 알림 버튼 */}
      <div className="relative">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative rounded-full w-14 h-14 p-0 shadow-lg hover:shadow-xl transition-all"
          variant="default"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 rounded-full w-6 h-6 flex items-center justify-center p-0 bg-red-500"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* 알림 패널 */}
      {isExpanded && (
        <Card className="absolute bottom-20 right-0 w-96 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">알림</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {unreadCount}개의 읽지 않은 알림
              </p>
            )}
          </CardHeader>

          <CardContent className="p-0 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">알림이 없습니다</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-muted/50 transition-colors ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-950' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* 아이콘 */}
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notification.type)}
                      </div>

                      {/* 콘텐츠 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm">{notification.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                          )}
                        </div>

                        {/* 타임스탬프 */}
                        <p className="text-xs text-muted-foreground mt-2">
                          {notification.timestamp}
                        </p>

                        {/* 액션 버튼 */}
                        {notification.actionUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 w-full text-xs"
                            onClick={() => handleActionClick(notification)}
                          >
                            {notification.actionLabel}
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>

                      {/* 닫기 버튼 */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-shrink-0 h-6 w-6 p-0"
                        onClick={() => handleDismiss(notification.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          {/* 푸터 */}
          {notifications.length > 0 && (
            <div className="border-t p-3 text-center">
              <Button
                size="sm"
                variant="ghost"
                className="text-xs"
                onClick={() => setNotifications([])}
              >
                모두 삭제
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
