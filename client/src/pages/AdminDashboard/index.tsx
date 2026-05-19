import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProjectsPanel from './ProjectsPanel';
import UsersPanel from './UsersPanel';
import PaymentChart from './PaymentChart';
import KPICards from './KPICards';

/**
 * 관리자 대시보드 메인 페이지
 * 국제 타이포그래피 스타일 기반
 */

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-black mb-2">
            한진 공통 엔진
          </h1>
          <p className="text-gray-600">
            멀티 프로젝트 SaaS 운영 플랫폼 관리자 대시보드
          </p>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* 탭 네비게이션 */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 mb-8 border-b border-gray-200 bg-transparent">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-black rounded-none bg-transparent text-gray-600 font-semibold uppercase text-sm tracking-wide"
              >
                개요
              </TabsTrigger>
              <TabsTrigger
                value="projects"
                className="data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-black rounded-none bg-transparent text-gray-600 font-semibold uppercase text-sm tracking-wide"
              >
                프로젝트
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-black rounded-none bg-transparent text-gray-600 font-semibold uppercase text-sm tracking-wide"
              >
                사용자
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-black rounded-none bg-transparent text-gray-600 font-semibold uppercase text-sm tracking-wide"
              >
                결제
              </TabsTrigger>
            </TabsList>

            {/* 개요 탭 */}
            <TabsContent value="overview" className="space-y-8">
              <KPICards />
            </TabsContent>

            {/* 프로젝트 탭 */}
            <TabsContent value="projects" className="space-y-8">
              <ProjectsPanel />
            </TabsContent>

            {/* 사용자 탭 */}
            <TabsContent value="users" className="space-y-8">
              <UsersPanel />
            </TabsContent>

            {/* 결제 탭 */}
            <TabsContent value="payments" className="space-y-8">
              <PaymentChart />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-gray-200 px-8 py-6 mt-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>© 2026 한진 공통 엔진. 모든 권리 보유.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-black transition-colors">
                도움말
              </a>
              <a href="#" className="hover:text-black transition-colors">
                문서
              </a>
              <a href="#" className="hover:text-black transition-colors">
                피드백
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
