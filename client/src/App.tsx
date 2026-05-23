import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import MembershipDashboard from './pages/MembershipDashboard';
import CopyEditor from './pages/CopyEditor';
import SleepSettings from './pages/SleepSettings';
import AiAnalyticsDashboard from './pages/AiAnalyticsDashboard';
import MissionDashboard from './pages/MissionDashboard';
import EventDashboard from './pages/EventDashboard';
import SchedulerDashboard from './pages/SchedulerDashboard';
import DashboardLayout from "./components/DashboardLayout";
import UsersManagement from './pages/UsersManagement';
import MembershipBenefits from './pages/MembershipBenefits';
import MembershipManagement from './pages/MembershipManagement';
import ProjectsManagement from './pages/ProjectsManagement';
import MonitoringDashboard from './pages/MonitoringDashboard';
import StatsDashboard from './pages/StatsDashboard';
import PaymentDashboard from './pages/PaymentDashboard';
import RevenueDetailsPage from './pages/Payment/RevenueDetailsPage';
import SettlementDetailsPage from './pages/Payment/SettlementDetailsPage';
import RefundDetailsPage from './pages/Payment/RefundDetailsPage';
import TransactionDetailsPage from './pages/Payment/TransactionDetailsPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import TermsOfService from './pages/TermsOfService';
import WearableIntegration from './pages/WearableIntegration';
import FeedbackAdvancedDashboard from './pages/FeedbackAdvancedDashboard';
import CommunityHub from './pages/CommunityHub';
import AdvancedAnalytics from './pages/AdvancedAnalytics';

// Group A: AI 피드백 페이지
import AiFeedbackDashboard from './pages/AiFeedbackDashboard';

// Group C: 이벤트/스케줄 페이지
import EventManagement from './pages/EventManagement';
import TargetAudienceManager from './pages/TargetAudienceManager';
import ScheduledMissionManager from './pages/ScheduledMissionManager';
import SleepDetectionSettings from './pages/SleepDetectionSettings';
import FeedbackTemplateManager from './pages/FeedbackTemplateManager';
import MembershipCheckout from './pages/MembershipCheckout';
import PaymentSuccess from './pages/PaymentSuccess';

function Router() {
  return (
    <Switch>
      <Route path={"/login"} component={() => <LoginPage />} />
      <Route path={"/admin"} component={() => (
        <DashboardLayout>
          <AdminDashboard />
        </DashboardLayout>
      )} />
      <Route path={"/"} component={() => (
        <DashboardLayout>
          <Home />
        </DashboardLayout>
      )} />
      <Route path={"/membership"} component={MembershipDashboard} />
      <Route path={"/copy-editor"} component={CopyEditor} />
      
      {/* 결제 관리 */}
      <Route path={"/admin/payment"} component={() => (
        <DashboardLayout>
          <PaymentDashboard />
        </DashboardLayout>
      )} />
      <Route path={"/admin/payment/revenue"} component={() => (
        <DashboardLayout>
          <RevenueDetailsPage />
        </DashboardLayout>
      )} />
      <Route path={"/admin/payment/settlement"} component={() => (
        <DashboardLayout>
          <SettlementDetailsPage />
        </DashboardLayout>
      )} />
      <Route path={"/admin/payment/refund"} component={() => (
        <DashboardLayout>
          <RefundDetailsPage />
        </DashboardLayout>
      )} />
      <Route path={"/admin/payment/transaction"} component={() => (
        <DashboardLayout>
          <TransactionDetailsPage />
        </DashboardLayout>
      )} />
      
      {/* AI 분석 & 랭킹 */}
      <Route path={"/admin/ai-analytics"} component={() => (
        <DashboardLayout>
          <AiAnalyticsDashboard />
        </DashboardLayout>
      )} />
      
      {/* Group A: AI 피드백 (독립 페이지) */}
      <Route path={"/admin/ai"} component={() => (
        <DashboardLayout>
          <AiFeedbackDashboard />
        </DashboardLayout>
      )} />
      <Route path={"/admin/ai-feedback"} component={() => (
        <DashboardLayout>
          <AiFeedbackDashboard />
        </DashboardLayout>
      )} />
      
      {/* 미션 관리 */}
      <Route path={"/admin/missions"} component={() => (
        <DashboardLayout>
          <MissionDashboard />
        </DashboardLayout>
      )} />
      
      {/* Group C: 이벤트 관리 (활성화) */}
      <Route path={"/admin/events"} component={() => (
        <DashboardLayout>
          <EventManagement />
        </DashboardLayout>
      )} />
      
      {/* Group C: 타겟 발송 */}
      <Route path={"/admin/target-audience"} component={() => (
        <DashboardLayout>
          <TargetAudienceManager />
        </DashboardLayout>
      )} />
      
      {/* Group C: 스케줄러 (미션 자동 발송) */}
      <Route path={"/admin/scheduler"} component={() => (
        <DashboardLayout>
          <ScheduledMissionManager />
        </DashboardLayout>
      )} />
      
      {/* 프로젝트 관리 */}
      <Route path={"/admin/users"} component={() => (
        <UsersManagement />
      )} />
      <Route path={"/admin/projects"} component={() => (
        <DashboardLayout>
          <ProjectsManagement />
        </DashboardLayout>
      )} />
      
      {/* 모니터링 */}
      <Route path={"/admin/monitoring"} component={() => (
        <DashboardLayout>
          <MonitoringDashboard />
        </DashboardLayout>
      )} />
      
      {/* 통계 */}
      <Route path={"/admin/stats"} component={() => (
        <DashboardLayout>
          <StatsDashboard />
        </DashboardLayout>
      )} />
      
      {/* Group C: 수면 감지 전체 시스템 설정 */}
      <Route path={"/sleep-settings"} component={() => (
        <DashboardLayout>
          <SleepDetectionSettings />
        </DashboardLayout>
      )} />
      
      {/* Group B: 피드백 템플릿 관리 */}
      <Route path={"/admin/feedback-templates"} component={() => (
        <DashboardLayout>
          <FeedbackTemplateManager />
        </DashboardLayout>
      )} />
      
      {/* 설정 */}
      <Route path={"/admin/settings"} component={() => (
        <DashboardLayout>
          <SettingsPage />
        </DashboardLayout>
      )} />
      
      {/* 약관 페이지 (공개) */}
      <Route path={"/terms"} component={TermsOfService} />
      <Route path={"/terms/privacy"} component={TermsOfService} />
      <Route path={"/terms/health"} component={TermsOfService} />

      {/* P1: 웨어러블 연동 */}
      <Route path={"/admin/wearable"} component={() => (
        <DashboardLayout>
          <WearableIntegration />
        </DashboardLayout>
      )} />

      {/* P2: AI 피드백 고도화 */}
      <Route path={"/admin/feedback-advanced"} component={() => (
        <DashboardLayout>
          <FeedbackAdvancedDashboard />
        </DashboardLayout>
      )} />

      {/* P3: 커뮤니티 허브 */}
      <Route path={"/admin/community"} component={() => (
        <DashboardLayout>
          <CommunityHub />
        </DashboardLayout>
      )} />

      {/* P4: 고급 분석 */}
      <Route path={"/admin/analytics"} component={() => (
        <DashboardLayout>
          <AdvancedAnalytics />
        </DashboardLayout>
      )} />



      {/* 404 */}
      {/* ✅ 신규: 멤버십 결제 + 결제완료/취소 (3개 레포 이식) */}
      <Route path={"/admin/membership/management"} component={() => (
        <MembershipManagement />
      )} />
      <Route path={"/admin/membership/benefits"} component={() => (
        <MembershipBenefits />
      )} />
      <Route path={"/admin/membership/checkout"} component={() => (
        <MembershipCheckout />
      )} />
      <Route path={"/payment/success"} component={() => (
        <PaymentSuccess />
      )} />
      <Route path={"/payment/cancel"} component={() => (
        <PaymentSuccess />
      )} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
