import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Users, CreditCard, TrendingUp } from 'lucide-react';

/**
 * 6개 프로젝트 관리 패널
 * 국제 타이포그래피 스타일 기반
 */

const PROJECTS = [
  {
    id: 1,
    name: '장부관리사',
    status: 'active',
    users: 1245,
    revenue: '$12,450',
    growth: '+15.3%',
    color: '#E53935',
  },
  {
    id: 2,
    name: '스포츠회복사',
    status: 'active',
    users: 892,
    revenue: '$8,920',
    growth: '+8.2%',
    color: '#E53935',
  },
  {
    id: 3,
    name: '로또',
    status: 'active',
    users: 3421,
    revenue: '$34,210',
    growth: '+22.5%',
    color: '#E53935',
  },
  {
    id: 4,
    name: 'GLWA',
    status: 'active',
    users: 567,
    revenue: '$5,670',
    growth: '+5.1%',
    color: '#E53935',
  },
  {
    id: 5,
    name: '숨호흡',
    status: 'active',
    users: 2134,
    revenue: '$21,340',
    growth: '+18.7%',
    color: '#E53935',
  },
  {
    id: 6,
    name: '랜딩',
    status: 'active',
    users: 4567,
    revenue: '$45,670',
    growth: '+31.2%',
    color: '#E53935',
  },
];

export default function ProjectsPanel() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  return (
    <div className="space-y-8">
      {/* 제목 */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-5xl font-bold text-black mb-2">
          프로젝트 관리
        </h1>
        <p className="text-gray-600 text-lg">
          6개 프로젝트의 사용자 및 결제 현황을 한눈에 모니터링합니다
        </p>
      </div>

      {/* 프로젝트 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PROJECTS.map((project) => (
          <Card
            key={project.id}
            className={`p-6 cursor-pointer transition-all duration-250 border ${
              selectedProject === project.id
                ? 'border-red-500 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedProject(project.id)}
          >
            {/* 프로젝트 헤더 */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {/* 포인트 사각형 */}
                  <div
                    className="w-3 h-3"
                    style={{ backgroundColor: project.color }}
                  />
                  <h3 className="text-xl font-bold text-black">
                    {project.name}
                  </h3>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs font-semibold uppercase tracking-wide"
                >
                  {project.status === 'active' ? '운영중' : '중지'}
                </Badge>
              </div>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>

            {/* 구분선 */}
            <div className="border-t border-gray-200 my-4" />

            {/* 통계 정보 */}
            <div className="space-y-4 mb-6">
              {/* 사용자 수 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Users size={16} />
                  <span className="text-sm font-medium">사용자</span>
                </div>
                <span className="text-lg font-bold text-black">
                  {project.users.toLocaleString()}
                </span>
              </div>

              {/* 매출 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <CreditCard size={16} />
                  <span className="text-sm font-medium">매출</span>
                </div>
                <span className="text-lg font-bold text-black">
                  {project.revenue}
                </span>
              </div>

              {/* 성장률 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <TrendingUp size={16} />
                  <span className="text-sm font-medium">성장률</span>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {project.growth}
                </span>
              </div>
            </div>

            {/* 구분선 */}
            <div className="border-t border-gray-200 my-4" />

            {/* 액션 버튼 */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 text-xs font-semibold uppercase"
              >
                상세보기
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold uppercase"
              >
                관리
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* 프로젝트 요약 통계 */}
      <div className="border-t border-gray-200 pt-8">
        <h2 className="text-2xl font-bold text-black mb-6">전체 통계</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-6 border-gray-200">
            <div className="text-gray-600 text-sm font-medium mb-2">
              전체 프로젝트
            </div>
            <div className="text-3xl font-bold text-black">6</div>
          </Card>
          <Card className="p-6 border-gray-200">
            <div className="text-gray-600 text-sm font-medium mb-2">
              총 사용자
            </div>
            <div className="text-3xl font-bold text-black">
              {PROJECTS.reduce((sum, p) => sum + p.users, 0).toLocaleString()}
            </div>
          </Card>
          <Card className="p-6 border-gray-200">
            <div className="text-gray-600 text-sm font-medium mb-2">
              총 매출
            </div>
            <div className="text-3xl font-bold text-black">
              $128,260
            </div>
          </Card>
          <Card className="p-6 border-gray-200">
            <div className="text-gray-600 text-sm font-medium mb-2">
              평균 성장률
            </div>
            <div className="text-3xl font-bold text-green-600">
              +16.8%
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
