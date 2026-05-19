import React from 'react';
import { Card } from '@/components/ui/card';
import {
  Users,
  CreditCard,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

/**
 * 통계 KPI 요약 카드
 * 국제 타이포그래피 스타일 기반
 */

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  color: 'red' | 'green' | 'blue' | 'gray';
}

function KPICard({ title, value, change, icon, color }: KPICardProps) {
  const colorClasses = {
    red: 'text-red-500',
    green: 'text-green-600',
    blue: 'text-blue-500',
    gray: 'text-gray-600',
  };

  const bgColorClasses = {
    red: 'bg-red-50',
    green: 'bg-green-50',
    blue: 'bg-blue-50',
    gray: 'bg-gray-50',
  };

  return (
    <Card className="p-6 border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium mb-2 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-4xl font-bold text-black mb-2">
            {value}
          </p>
          {change && (
            <p className="text-sm font-semibold text-green-600">
              {change}
            </p>
          )}
        </div>
        <div className={`${bgColorClasses[color]} p-3 rounded-lg`}>
          <div className={colorClasses[color]}>
            {icon}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function KPICards() {
  return (
    <div className="space-y-8">
      {/* 제목 */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-5xl font-bold text-black mb-2">
          핵심 지표 (KPI)
        </h1>
        <p className="text-gray-600 text-lg">
          전체 시스템의 주요 성과 지표를 한눈에 확인합니다
        </p>
      </div>

      {/* KPI 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 총 사용자 */}
        <KPICard
          title="총 사용자"
          value="12,826"
          change="+2,145 (↑20.1%)"
          icon={<Users size={24} />}
          color="red"
        />

        {/* 총 매출 */}
        <KPICard
          title="총 매출"
          value="$128,260"
          change="+$18,450 (↑16.8%)"
          icon={<CreditCard size={24} />}
          color="green"
        />

        {/* 활성 구독 */}
        <KPICard
          title="활성 구독"
          value="720"
          change="+95 (↑15.2%)"
          icon={<Activity size={24} />}
          color="blue"
        />

        {/* 평균 성장률 */}
        <KPICard
          title="평균 성장률"
          value="+16.8%"
          change="전월 대비 +2.3%"
          icon={<TrendingUp size={24} />}
          color="red"
        />

        {/* 결제 성공률 */}
        <KPICard
          title="결제 성공률"
          value="96.3%"
          change="+1.2% (↑우수)"
          icon={<CheckCircle size={24} />}
          color="green"
        />

        {/* 이탈 사용자 */}
        <KPICard
          title="이탈 사용자"
          value="145"
          change="-32 (↓18.1%)"
          icon={<AlertCircle size={24} />}
          color="gray"
        />
      </div>

      {/* 상세 분석 섹션 */}
      <div className="border-t border-gray-200 pt-8">
        <h2 className="text-2xl font-bold text-black mb-6">
          프로젝트별 KPI
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 프로젝트별 사용자 증가 */}
          <Card className="p-6 border-gray-200">
            <h3 className="text-lg font-bold text-black mb-4">
              프로젝트별 사용자 증가
            </h3>
            <div className="space-y-3">
              {[
                { name: '로또', value: 3421, growth: '+31.2%' },
                { name: '랜딩', value: 4567, growth: '+28.5%' },
                { name: '숨호흡', value: 2134, growth: '+18.7%' },
                { name: '장부관리사', value: 1245, growth: '+15.3%' },
                { name: '스포츠회복사', value: 892, growth: '+8.2%' },
                { name: 'GLWA', value: 567, growth: '+5.1%' },
              ].map((project) => (
                <div
                  key={project.name}
                  className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-semibold text-black">
                      {project.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {project.value.toLocaleString()} 사용자
                    </p>
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    {project.growth}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* 프로젝트별 매출 기여도 */}
          <Card className="p-6 border-gray-200">
            <h3 className="text-lg font-bold text-black mb-4">
              프로젝트별 매출 기여도
            </h3>
            <div className="space-y-3">
              {[
                { name: '랜딩', value: '$45,670', percent: 35.6 },
                { name: '로또', value: '$34,210', percent: 26.7 },
                { name: '숨호흡', value: '$21,340', percent: 16.6 },
                { name: '장부관리사', value: '$12,450', percent: 9.7 },
                { name: '스포츠회복사', value: '$8,920', percent: 6.9 },
                { name: 'GLWA', value: '$5,670', percent: 4.4 },
              ].map((project) => (
                <div key={project.name} className="pb-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-black">
                      {project.name}
                    </p>
                    <p className="text-sm font-bold text-red-500">
                      {project.percent}%
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all"
                      style={{ width: `${project.percent}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {project.value}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
