import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

interface User {
  id: number;
  name?: string;
  email?: string;
  role: 'admin' | 'user';
}

export default function UsersManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: users, isLoading, refetch } = trpc.admin.getUsers.useQuery();
  const updateRoleMutation = trpc.admin.updateUserRole.useMutation();

  const filteredUsers = (users as User[] || []).filter((user: User) =>
    (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRoleChange = async (userId: number, newRole: 'admin' | 'user') => {
    try {
      await updateRoleMutation.mutateAsync({ userId, role: newRole });
      toast.success(`역할이 ${newRole === 'admin' ? '관리자' : '사용자'}로 변경되었습니다.`);
      refetch();
    } catch (error) {
      toast.error('역할 변경에 실패했습니다.');
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">사용자 관리</h1>
        <p className="text-gray-600 mt-2">전체 사용자 {users?.length || 0}명</p>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="사용자 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid gap-4">
        {filteredUsers.map((user: User) => (
          <Card key={user.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{user.name || '이름 없음'}</h3>
                  <p className="text-sm text-gray-600">{user.email || '이메일 없음'}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role === 'admin' ? '관리자' : '사용자'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  {user.role !== 'admin' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRoleChange(user.id, 'admin')}
                      disabled={updateRoleMutation.isPending}
                    >
                      관리자로 변경
                    </Button>
                  )}
                  {user.role === 'admin' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRoleChange(user.id, 'user')}
                      disabled={updateRoleMutation.isPending}
                    >
                      사용자로 변경
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
