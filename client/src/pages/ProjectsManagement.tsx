import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { ProjectSettingsModal } from '@/components/ProjectSettingsModal';
import { Folder } from 'lucide-react';

interface Project {
  id: number;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
}

export default function ProjectsManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data: projects, isLoading, refetch } = trpc.projects.list.useQuery();
  const updateProjectMutation = trpc.projects.update.useMutation();

  const filteredProjects = (projects as Project[] || []).filter((project: Project) =>
    (project.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async (project: Project) => {
    try {
      await updateProjectMutation.mutateAsync({ 
        id: project.id, 
        status: project.status
      });
      toast.success('프로젝트 설정이 저장되었습니다.');
      refetch();
      setIsModalOpen(false);
    } catch (error) {
      toast.error('저장에 실패했습니다.');
    }
  };

  const handleStatusToggle = async (projectId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateProjectMutation.mutateAsync({ 
        id: projectId, 
        status: newStatus as 'active' | 'inactive'
      });
      toast.success(`프로젝트 상태가 ${newStatus === 'active' ? '활성' : '비활성'}으로 변경되었습니다.`);
      refetch();
      setIsModalOpen(false);
    } catch (error) {
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  const handleOpenModal = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Spinner className="h-8 w-8" />
        <p className="text-muted-foreground">프로젝트 데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 md:p-4">
      <div>
        <h1 className="text-base font-bold truncate">프로젝트 관리</h1>
        <p className="text-gray-600 mt-2">전체 프로젝트 {projects?.length || 0}개</p>
      </div>

      <div className="flex gap-2 flex-col md:flex-row">
        <Input
          placeholder="프로젝트 검색 (이름, 설명)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        <Button variant="outline" onClick={() => { refetch(); toast.success('새로고침 완료'); }}>
          🔄 새로고침
        </Button>
      </div>

      {filteredProjects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Folder className="h-6 w-6 text-muted-foreground mb-1 opacity-50" />
            <p className="text-muted-foreground text-center">
              {searchQuery ? '검색 결과가 없습니다' : '프로젝트가 없습니다'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project: Project) => (
            <Card 
              key={project.id}
              className="hover:shadow-md transition-all hover:scale-102 cursor-pointer"
              onClick={() => handleOpenModal(project)}
            >
              <CardHeader className="pb-1">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                    {project.status === 'active' ? '✅ 활성' : '⏸️ 비활성'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <p className="text-sm text-gray-600">{project.description || '설명 없음'}</p>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenModal(project);
                    }}
                    disabled={updateProjectMutation.isPending}
                  >
                    설정
                  </Button>
                  <Button
                    size="sm"
                    variant={project.status === 'active' ? 'destructive' : 'default'}
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusToggle(project.id, project.status);
                    }}
                    disabled={updateProjectMutation.isPending}
                  >
                    {project.status === 'active' ? '비활성화' : '활성화'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProjectSettingsModal
        open={isModalOpen}
        project={selectedProject}
        onOpenChange={setIsModalOpen}
        onSave={handleSave}
      />
    </div>
  );
}
