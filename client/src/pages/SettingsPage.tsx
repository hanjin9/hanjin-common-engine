import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    appName: '한진 공통 엔진',
    appDescription: '6개 프로젝트 통합 운영 및 리셀러 사업화를 위한 공통 엔진',
    maintenanceMode: false,
    emailNotifications: true,
    smsNotifications: false,
    maxUploadSize: 50,
  });

  const updateSettingsMutation = trpc.admin.updateSettings.useMutation();

  const handleSave = async () => {
    try {
      await updateSettingsMutation.mutateAsync(settings);
      toast.success('설정이 저장되었습니다.');
    } catch (error) {
      toast.error('설정 저장에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">시스템 설정</h1>
        <p className="text-gray-600 mt-2">애플리케이션 설정 및 구성</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">앱 이름</label>
            <Input
              value={settings.appName}
              onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
              placeholder="앱 이름"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">앱 설명</label>
            <Textarea
              value={settings.appDescription}
              onChange={(e) => setSettings({ ...settings, appDescription: e.target.value })}
              placeholder="앱 설명"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>시스템 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">유지보수 모드</p>
              <p className="text-sm text-gray-600">활성화 시 사용자 접근 제한</p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">최대 업로드 크기 (MB)</label>
            <Input
              type="number"
              value={settings.maxUploadSize}
              onChange={(e) => setSettings({ ...settings, maxUploadSize: parseInt(e.target.value) })}
              placeholder="최대 업로드 크기"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>알림 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">이메일 알림</p>
              <p className="text-sm text-gray-600">시스템 알림을 이메일로 수신</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">SMS 알림</p>
              <p className="text-sm text-gray-600">긴급 알림을 SMS로 수신</p>
            </div>
            <Switch
              checked={settings.smsNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>보안 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full">
            관리자 비밀번호 변경
          </Button>
          <Button variant="outline" className="w-full">
            세션 초기화
          </Button>
          <Button variant="outline" className="w-full">
            API 키 재생성
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={handleSave} disabled={updateSettingsMutation.isPending}>
          설정 저장
        </Button>
        <Button variant="outline">
          취소
        </Button>
      </div>
    </div>
  );
}
