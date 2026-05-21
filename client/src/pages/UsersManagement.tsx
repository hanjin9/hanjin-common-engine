import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { UserRoleModal } from '@/components/UserRoleModal';
import { Users } from 'lucide-react';

interface UserData {
  id: number;
  name?: string;
  email?: string;
  role: 'admin' | 'user';
}

export default function UsersManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data: users, isLoading, refetch } = trpc.admin.getUsers.useQuery();
  const updateRoleMutation = trpc.admin.updateUserRole.useMutation();

  const filteredUsers = (users as UserData[] || []).filter((user: UserData) =>
    (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRoleChange = async (userId: number, newRole: 'admin' | 'user') => {
    try {
      await updateRoleMutation.mutateAsync({ userId, role: newRole });
      toast.success(`역할이 ${newRole === 'admin' ? '관리자' : '사용자'}로 변경되었습니다.`);
      refetch();
      setIsModalOpen(false);
    } catch (error) {
      toast.error('역할 변경에 실패했습니다.');
    }
  };

  const handleOpenModal = (user: UserData) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Spinner className="h-8 w-8" />
        <p className="text-muted-foreground">사용자 데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold">사용자 관리</h1>
        <p className="text-gray-600 mt-2">전체 사용자 {users?.length || 0}명</p>
      </div>

      <div className="flex gap-4 flex-col md:flex-row">
        <Input
          placeholder="사용자 검색 (이름, 이메일)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        <Button variant="outline" onClick={() => { refetch(); toast.success('새로고침 완료'); }}>
          🔄 새로고침
        </Button>
      </div>

      {filteredUsers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground text-center">
              {searchQuery ? '검색 결과가 없습니다' : '사용자가 없습니다'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((user: UserData) => (
            <Card 
              key={user.id}
              className="hover:shadow-md transition-all hover:scale-102 cursor-pointer"
              onClick={() => handleOpenModal(user)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{user.name || '이름 없음'}</h3>
                    <p className="text-sm text-gray-600">{user.email || '이메일 없음'}</p>
                    <div className="flex gap-2 mt-3">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' ? '👨‍💼 관리자' : '👤 사용자'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal(user);
                      }}
                      disabled={updateRoleMutation.isPending}
                    >
                      역할 변경
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <UserRoleModal
        open={isModalOpen}
        user={selectedUser}
        onOpenChange={setIsModalOpen}
        onSave={handleRoleChange}
      />
    </div>
  );
}
