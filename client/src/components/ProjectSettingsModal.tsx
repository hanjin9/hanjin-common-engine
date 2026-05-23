import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

interface Project {
  id: number;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
}

interface ProjectSettingsModalProps {
  open: boolean;
  project?: Project;
  onOpenChange: (open: boolean) => void;
  onSave: (project: Project) => void;
}

export function ProjectSettingsModal({
  open,
  project,
  onOpenChange,
  onSave,
}: ProjectSettingsModalProps) {
  const [formData, setFormData] = useState<Project>(
    project || { id: 0, name: '', description: '', status: 'active' }
  );
  const [isSaving, setIsSaving] = useState(false);
  
  // DB에서 프로젝트 목록 조회
  const { data: projectList, isLoading: isLoadingProjects } = trpc.admin.getProjects.useQuery();

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('프로젝트를 선택해주세요');
      return;
    }
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // 시뮬레이션
      onSave(formData);
      toast.success('프로젝트 설정이 저장되었습니다');
      onOpenChange(false);
    } catch (error) {
      toast.error('저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>프로젝트 설정</DialogTitle>
          <DialogDescription>
            프로젝트의 정보를 수정합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">프로젝트 선택</Label>
            {isLoadingProjects ? (
              <div className="flex items-center justify-center h-10 border rounded-md bg-muted">
                <Spinner className="h-4 w-4" />
              </div>
            ) : (
              <Select
                value={formData.name}
                onValueChange={(value) =>
                  setFormData({ ...formData, name: value })
                }
              >
                <SelectTrigger id="name">
                  <SelectValue placeholder="프로젝트를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {projectList && projectList.length > 0 ? (
                    projectList.map((proj: any) => (
                      <SelectItem key={proj.id} value={proj.name}>
                        <div className="flex items-center gap-2">
                          <span>{proj.name}</span>
                          {proj.isActive ? (
                            <span className="text-xs text-green-600">✓</span>
                          ) : (
                            <span className="text-xs text-gray-400">○</span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      프로젝트가 없습니다
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              현재 운영 중인 프로젝트 목록에서 선택합니다.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              placeholder="프로젝트에 대한 설명을 입력하세요"
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">상태</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value as 'active' | 'inactive' })
              }
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  <span>✅ 활성</span>
                </SelectItem>
                <SelectItem value="inactive">
                  <span>⏸️ 비활성</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-md">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              💡 활성 프로젝트만 사용자가 접근할 수 있습니다.
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
          <Button onClick={handleSave} disabled={isSaving || isLoadingProjects}>
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
