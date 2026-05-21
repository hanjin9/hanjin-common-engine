import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

interface Project {
  id: number;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
}

export default function ProjectsManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: projects, isLoading, refetch } = trpc.projects.list.useQuery();
  const updateProjectMutation = trpc.projects.update.useMutation();

  const filteredProjects = (projects as Project[] || []).filter((project: Project) =>
    (project.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusToggle = async (projectId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateProjectMutation.mutateAsync({ 
        id: projectId, 
        status: newStatus as 'active' | 'inactive'
      });
      toast.success(`프로젝트 상태가 변경되었습니다.`);
      refetch();
    } catch (error) {
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">프로젝트 관리</h1>
        <p className="text-gray-600 mt-2">전체 프로젝트 {projects?.length || 0}개</p>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="프로젝트 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid gap-4">
        {filteredProjects.map((project: Project) => (
          <Card key={project.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{project.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                  <div className="flex gap-2 mt-3">
                    <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                      {project.status === 'active' ? '활성' : '비활성'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusToggle(project.id, project.status)}
                    disabled={updateProjectMutation.isPending}
                  >
                    {project.status === 'active' ? '비활성화' : '활성화'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
