import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, TrendingUp, DollarSign, Activity, AlertCircle, Settings } from "lucide-react";
import { useState, useEffect } from "react";

// 7개 프로젝트 데이터
const PROJECTS = [
  { id: 1, name: "숨호흡 (호흡)", slug: "breathing-app", type: "wellness", color: "#3b82f6" },
  { id: 2, name: "GLWA 프랜차이즈", slug: "glwa-franchise", type: "franchise", color: "#8b5cf6" },
  { id: 3, name: "GLWA 커뮤니티", slug: "glwa-community", type: "community", color: "#ec4899" },
  { id: 4, name: "장부관리사", slug: "bread-coach", type: "business", color: "#f59e0b" },
  { id: 5, name: "스포츠회복사", slug: "sports-recovery", type: "health", color: "#10b981" },
  { id: 6, name: "로또", slug: "coin-lotto", type: "gaming", color: "#06b6d4" },
  { id: 7, name: "랜딩페이지", slug: "landing", type: "marketing", color: "#6366f1" },
];

// 샘플 통계 데이터
const MONTHLY_STATS = [
  { month: "1월", users: 400, revenue: 2400, subscriptions: 240 },
  { month: "2월", users: 520, revenue: 2210, subscriptions: 290 },
  { month: "3월", users: 680, revenue: 2290, subscriptions: 340 },
  { month: "4월", users: 890, revenue: 2000, subscriptions: 400 },
  { month: "5월", users: 1200, revenue: 2181, subscriptions: 500 },
];

const MEMBERSHIP_DISTRIBUTION = [
  { name: "Silver", value: 400, color: "#c0c0c0" },
  { name: "Gold", value: 300, color: "#ffd700" },
  { name: "Blue Sapphire", value: 200, color: "#0f52ba" },
  { name: "Green Emerald", value: 150, color: "#50c878" },
  { name: "Diamond", value: 100, color: "#b9f2ff" },
  { name: "Blue Diamond", value: 80, color: "#0047ab" },
  { name: "Platinum", value: 60, color: "#e5e4e2" },
  { name: "Black Platinum", value: 30, color: "#000000" },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">
      {/* 헤더 */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">관리자 대시보드</h1>
        <p className="text-muted-foreground">
          전체 프로젝트 현황 및 멤버십 통계를 한눈에 확인하세요.
        </p>
      </div>

      {/* KPI 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,450</div>
            <p className="text-xs text-muted-foreground">+2.5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 구독</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5,230</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">월 매출</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이탈율</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2%</div>
            <p className="text-xs text-muted-foreground">-0.5% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="projects">프로젝트</TabsTrigger>
          <TabsTrigger value="membership">멤버십</TabsTrigger>
          <TabsTrigger value="monitoring">모니터링</TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* 월별 통계 */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>월별 사용자 및 매출</CardTitle>
                <CardDescription>지난 5개월간의 추이</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={MONTHLY_STATS}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="users" stroke="#3b82f6" name="사용자" />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" name="매출($100)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 막대 차트 */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>월별 구독 현황</CardTitle>
                <CardDescription>활성 구독 수 추이</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={MONTHLY_STATS}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="subscriptions" fill="#8b5cf6" name="활성 구독" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 프로젝트 탭 */}
        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PROJECTS.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                  </div>
                  <CardDescription className="text-xs">{project.slug}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">사용자</p>
                      <p className="font-semibold">{Math.floor(Math.random() * 5000) + 100}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">구독</p>
                      <p className="font-semibold">{Math.floor(Math.random() * 2000) + 50}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">매출</p>
                      <p className="font-semibold">${Math.floor(Math.random() * 50000) + 1000}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">상태</p>
                      <p className="font-semibold text-green-600">활성</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 멤버십 탭 */}
        <TabsContent value="membership" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* 멤버십 분포 */}
            <Card>
              <CardHeader>
                <CardTitle>멤버십 분포</CardTitle>
                <CardDescription>8단계별 회원 수</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={MEMBERSHIP_DISTRIBUTION}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {MEMBERSHIP_DISTRIBUTION.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 멤버십 통계 */}
            <Card>
              <CardHeader>
                <CardTitle>멤버십 현황</CardTitle>
                <CardDescription>등급별 통계</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {MEMBERSHIP_DISTRIBUTION.map((tier) => (
                    <div key={tier.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tier.color }}
                        />
                        <span className="text-sm font-medium">{tier.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{tier.value}명</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 모니터링 탭 */}
        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>운영자 모니터링</CardTitle>
              <CardDescription>실시간 시스템 상태</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">API 응답 시간</h3>
                    <span className="text-sm text-green-600">정상</span>
                  </div>
                  <p className="text-2xl font-bold">142ms</p>
                  <p className="text-xs text-muted-foreground">평균 응답 시간</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">DB 연결</h3>
                    <span className="text-sm text-green-600">정상</span>
                  </div>
                  <p className="text-2xl font-bold">99.9%</p>
                  <p className="text-xs text-muted-foreground">가용성</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">에러율</h3>
                    <span className="text-sm text-green-600">정상</span>
                  </div>
                  <p className="text-2xl font-bold">0.02%</p>
                  <p className="text-xs text-muted-foreground">지난 24시간</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">활성 세션</h3>
                    <span className="text-sm text-green-600">정상</span>
                  </div>
                  <p className="text-2xl font-bold">1,247</p>
                  <p className="text-xs text-muted-foreground">현재 접속자</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
