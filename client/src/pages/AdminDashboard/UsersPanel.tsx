import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Filter, Download } from 'lucide-react';

/**
 * 사용자 관리 대시보드
 * 국제 타이포그래피 스타일 기반
 */

const USERS = [
  {
    id: 1,
    name: '김철수',
    email: 'kim@example.com',
    project: '장부관리사',
    role: 'admin',
    subscription: 'premium',
    joinDate: '2024-01-15',
    status: 'active',
  },
  {
    id: 2,
    name: '이영희',
    email: 'lee@example.com',
    project: '스포츠회복사',
    role: 'user',
    subscription: 'basic',
    joinDate: '2024-02-20',
    status: 'active',
  },
  {
    id: 3,
    name: '박민준',
    email: 'park@example.com',
    project: '로또',
    role: 'user',
    subscription: 'premium',
    joinDate: '2024-01-10',
    status: 'active',
  },
  {
    id: 4,
    name: '최수진',
    email: 'choi@example.com',
    project: 'GLWA',
    role: 'user',
    subscription: 'basic',
    joinDate: '2024-03-05',
    status: 'inactive',
  },
  {
    id: 5,
    name: '정민호',
    email: 'jung@example.com',
    project: '숨호흡',
    role: 'admin',
    subscription: 'premium',
    joinDate: '2024-01-20',
    status: 'active',
  },
];

const roleLabels = {
  admin: '관리자',
  user: '사용자',
};

const subscriptionLabels = {
  basic: '기본',
  premium: '프리미엄',
};

const statusLabels = {
  active: '활성',
  inactive: '비활성',
};

export default function UsersPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');

  const filteredUsers = USERS.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8">
      {/* 제목 */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-5xl font-bold text-black mb-2">
          사용자 관리
        </h1>
        <p className="text-gray-600 text-lg">
          전체 프로젝트의 사용자 목록 및 역할을 관리합니다
        </p>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        {/* 검색 */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <Input
            placeholder="이름 또는 이메일로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-gray-200"
          />
        </div>

        {/* 필터 */}
        <div className="flex gap-1.5">
          <Button
            variant={filterRole === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterRole('all')}
            className="text-xs font-semibold uppercase"
          >
            <Filter size={16} className="mr-2" />
            전체
          </Button>
          <Button
            variant={filterRole === 'admin' ? 'default' : 'outline'}
            onClick={() => setFilterRole('admin')}
            className="text-xs font-semibold uppercase"
          >
            관리자
          </Button>
          <Button
            variant={filterRole === 'user' ? 'default' : 'outline'}
            onClick={() => setFilterRole('user')}
            className="text-xs font-semibold uppercase"
          >
            사용자
          </Button>
        </div>

        {/* 다운로드 */}
        <Button
          variant="outline"
          className="text-xs font-semibold uppercase"
        >
          <Download size={16} className="mr-2" />
          내보내기
        </Button>
      </div>

      {/* 사용자 테이블 */}
      <Card className="border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200 bg-gray-50">
              <TableHead className="font-bold text-black text-xs uppercase tracking-wide">
                이름
              </TableHead>
              <TableHead className="font-bold text-black text-xs uppercase tracking-wide">
                이메일
              </TableHead>
              <TableHead className="font-bold text-black text-xs uppercase tracking-wide">
                프로젝트
              </TableHead>
              <TableHead className="font-bold text-black text-xs uppercase tracking-wide">
                역할
              </TableHead>
              <TableHead className="font-bold text-black text-xs uppercase tracking-wide">
                구독
              </TableHead>
              <TableHead className="font-bold text-black text-xs uppercase tracking-wide">
                가입일
              </TableHead>
              <TableHead className="font-bold text-black text-xs uppercase tracking-wide">
                상태
              </TableHead>
              <TableHead className="font-bold text-black text-xs uppercase tracking-wide">
                작업
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow
                key={user.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <TableCell className="font-semibold text-black">
                  {user.name}
                </TableCell>
                <TableCell className="text-gray-600 text-sm">
                  {user.email}
                </TableCell>
                <TableCell className="text-gray-600 text-sm">
                  {user.project}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={user.role === 'admin' ? 'default' : 'outline'}
                    className="text-xs font-semibold uppercase"
                  >
                    {roleLabels[user.role as keyof typeof roleLabels]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="text-xs font-semibold uppercase"
                  >
                    {subscriptionLabels[user.subscription as keyof typeof subscriptionLabels]}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-600 text-sm">
                  {new Date(user.joinDate).toLocaleDateString('ko-KR')}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={user.status === 'active' ? 'default' : 'outline'}
                    className="text-xs font-semibold uppercase"
                  >
                    {statusLabels[user.status as keyof typeof statusLabels]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-semibold uppercase text-red-500 hover:text-red-600"
                  >
                    편집
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* 페이지네이션 정보 */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          총 <span className="font-semibold text-black">{filteredUsers.length}</span>명의 사용자
        </span>
        <span>
          페이지 <span className="font-semibold text-black">1</span> / 1
        </span>
      </div>
    </div>
  );
}
