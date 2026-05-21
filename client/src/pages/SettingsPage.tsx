import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Settings, Bell, Lock, Zap, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    appName: '한진 공통 엔진',
    appDescription: '6개 프로젝트 통합 운영 및 리셀러 사업화를 위한 공통 엔진',
    maintenanceMode: false,
    emailNotifications: true,
    smsNotifications: false,
    maxUploadSize: 50,
  });
  const [isSaving, setIsSaving] = useState(false);

  const updateSettingsMutation = trpc.admin.updateSettings.useMutation();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettingsMutation.mutateAsync(settings);
      toast.success('✅ 설정이 저장되었습니다');
    } catch (error) {
      toast.error('❌ 설정 저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          시스템 설정
        </h1>
        <p className="text-gray-600 mt-2">애플리케이션 설정 및 구성</p>
      </div>

      {/* 기본 정보 */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            기본 정보
          </CardTitle>
          <CardDescription>앱의 기본 정보를 설정합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">앱 이름</label>
            <Input
              value={settings.appName}
              onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
              placeholder="앱 이름"
              className="hover:shadow-md transition-shadow"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">앱 설명</label>
            <Textarea
              value={settings.appDescription}
              onChange={(e) => setSettings({ ...settings, appDescription: e.target.value })}
              placeholder="앱 설명"
              rows={3}
              className="hover:shadow-md transition-shadow"
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* 시스템 설정 */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            시스템 설정
          </CardTitle>
          <CardDescription>시스템 운영 옵션을 설정합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-all hover:scale-102">
            <div>
              <p className="font-medium">유지보수 모드</p>
              <p className="text-sm text-gray-600">활성화 시 사용자 접근 제한</p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => {
                setSettings({ ...settings, maintenanceMode: checked });
                toast.info(checked ? '유지보수 모드가 활성화되었습니다' : '유지보수 모드가 비활성화되었습니다');
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">최대 업로드 크기 (MB)</label>
            <Input
              type="number"
              value={settings.maxUploadSize}
              onChange={(e) => setSettings({ ...settings, maxUploadSize: parseInt(e.target.value) })}
              placeholder="최대 업로드 크기"
              className="hover:shadow-md transition-shadow"
            />
            <p className="text-xs text-muted-foreground">사용자가 업로드할 수 있는 최대 파일 크기</p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* 알림 설정 */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            알림 설정
          </CardTitle>
          <CardDescription>알림 수신 방식을 설정합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-all hover:scale-102">
            <div>
              <p className="font-medium">이메일 알림</p>
              <p className="text-sm text-gray-600">시스템 알림을 이메일로 수신</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => {
                setSettings({ ...settings, emailNotifications: checked });
                toast.info(checked ? '이메일 알림이 활성화되었습니다' : '이메일 알림이 비활성화되었습니다');
              }}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-all hover:scale-102">
            <div>
              <p className="font-medium">SMS 알림</p>
              <p className="text-sm text-gray-600">긴급 알림을 SMS로 수신</p>
            </div>
            <Switch
              checked={settings.smsNotifications}
              onCheckedChange={(checked) => {
                setSettings({ ...settings, smsNotifications: checked });
                toast.info(checked ? 'SMS 알림이 활성화되었습니다' : 'SMS 알림이 비활성화되었습니다');
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* 보안 설정 */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-red-500" />
            보안 설정
          </CardTitle>
          <CardDescription>계정 보안을 관리합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full hover:shadow-md transition-all hover:scale-102 active:scale-95"
            onClick={() => toast.info('비밀번호 변경 기능은 준비 중입니다')}
          >
            🔐 관리자 비밀번호 변경
          </Button>
          <Button 
            variant="outline" 
            className="w-full hover:shadow-md transition-all hover:scale-102 active:scale-95"
            onClick={() => toast.info('세션 초기화 기능은 준비 중입니다')}
          >
            🔄 세션 초기화
          </Button>
          <Button 
            variant="outline" 
            className="w-full hover:shadow-md transition-all hover:scale-102 active:scale-95"
            onClick={() => toast.info('API 키 재생성 기능은 준비 중입니다')}
          >
            🔑 API 키 재생성
          </Button>
          <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-xs text-red-700 dark:text-red-300">
              ⚠️ 보안 관련 작업은 신중하게 진행해주세요. 실수로 인한 피해는 복구하기 어려울 수 있습니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex gap-4 sticky bottom-4">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="gap-2 hover:shadow-md transition-all active:scale-95"
        >
          {isSaving ? '저장 중...' : '✅ 설정 저장'}
        </Button>
        <Button 
          variant="outline"
          onClick={() => {
            setSettings({
              appName: '한진 공통 엔진',
              appDescription: '6개 프로젝트 통합 운영 및 리셀러 사업화를 위한 공통 엔진',
              maintenanceMode: false,
              emailNotifications: true,
              smsNotifications: false,
              maxUploadSize: 50,
            });
            toast.info('설정이 초기화되었습니다');
          }}
          className="hover:shadow-md transition-all active:scale-95"
        >
          ↩️ 초기화
        </Button>
      </div>
    </div>
  );
}
