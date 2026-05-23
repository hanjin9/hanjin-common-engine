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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface User {
  id: number;
  name?: string;
  email?: string;
  role: 'admin' | 'user';
}

interface UserRoleModalProps {
  open: boolean;
  user?: User;
  onOpenChange: (open: boolean) => void;
  onSave: (userId: number, newRole: 'admin' | 'user') => void;
}

export function UserRoleModal({
  open,
  user,
  onOpenChange,
  onSave,
}: UserRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'user'>(
    user?.role || 'user'
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // 시뮬레이션
      onSave(user.id, selectedRole);
      toast.success(`${user.name}의 역할이 변경되었습니다`);
      onOpenChange(false);
    } catch (error) {
      toast.error('역할 변경에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>사용자 역할 변경</DialogTitle>
          <DialogDescription>
            {user?.name}({user?.email})의 역할을 변경합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-4">
          <div className="grid gap-2">
            <Label htmlFor="role">새로운 역할</Label>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as 'admin' | 'user')}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">
                  <span>👤 일반 사용자</span>
                </SelectItem>
                <SelectItem value="admin">
                  <span>👨‍💼 관리자</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {selectedRole === 'admin'
                ? '관리자는 모든 시스템 설정과 사용자 관리 권한을 갖습니다.'
                : '일반 사용자는 기본 기능만 사용할 수 있습니다.'}
            </p>
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
            {isSaving ? '변경 중...' : '변경'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
