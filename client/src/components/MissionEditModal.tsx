import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Mission {
  id: number;
  title: string;
  description: string;
  reward: number;
}

interface MissionEditModalProps {
  open: boolean;
  mission?: Mission;
  onOpenChange: (open: boolean) => void;
  onSave: (mission: Mission) => void;
}

export function MissionEditModal({
  open,
  mission,
  onOpenChange,
  onSave,
}: MissionEditModalProps) {
  const [formData, setFormData] = useState<Mission>(
    mission || { id: 0, title: '', description: '', reward: 0 }
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('미션 제목을 입력해주세요');
      return;
    }
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // 시뮬레이션
      onSave(formData);
      toast.success('미션이 저장되었습니다');
      onOpenChange(false);
    } catch (error) {
      toast.error('저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mission ? '미션 수정' : '새 미션 만들기'}</DialogTitle>
          <DialogDescription>
            미션의 정보를 입력하고 저장하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">미션 제목</Label>
            <Input
              id="title"
              placeholder="예: 아침 운동하기"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              placeholder="미션에 대한 상세 설명을 입력하세요"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reward">보상 포인트</Label>
            <Input
              id="reward"
              type="number"
              placeholder="0"
              value={formData.reward}
              onChange={(e) =>
                setFormData({ ...formData, reward: parseInt(e.target.value) || 0 })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            취소
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
