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
import ProjectsManagement from './pages/ProjectsManagement';
import MonitoringDashboard from './pages/MonitoringDashboard';
import StatsDashboard from './pages/StatsDashboard';
import PaymentDashboard from './pages/PaymentDashboard';
import RevenueDetailsPage from './pages/Payment/RevenueDetailsPage';
import SettlementDetailsPage from './pages/Payment/SettlementDetailsPage';
import RefundDetailsPage from './pages/Payment/RefundDetailsPage';
import TransactionDetailsPage from './pages/Payment/TransactionDetailsPage';
import MissionDashboardPage from './pages/MissionDashboard';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';

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
      <Route path={"/sleep-settings"} component={() => (
        <DashboardLayout>
          <SleepSettings />
        </DashboardLayout>
      )} />
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
      <Route path={"/admin/ai-analytics"} component={AiAnalyticsDashboard} />
      <Route path={"/admin/missions"} component={() => (
        <DashboardLayout>
          <MissionDashboard />
        </DashboardLayout>
      )} />
      <Route path={"/admin/events"} component={() => (
        <DashboardLayout>
          <EventDashboard />
        </DashboardLayout>
      )} />
      <Route path={"/admin/scheduler"} component={() => (
        <DashboardLayout>
          <SchedulerDashboard />
        </DashboardLayout>
      )} />
      <Route path={"/admin/users"} component={() => (
        <DashboardLayout>
          <UsersManagement />
        </DashboardLayout>
      )} />
      <Route path={"/admin/projects"} component={() => (
        <DashboardLayout>
          <ProjectsManagement />
        </DashboardLayout>
      )} />
      <Route path={"/admin/monitoring"} component={() => (
        <DashboardLayout>
          <MonitoringDashboard />
        </DashboardLayout>
      )} />
      <Route path={"/admin/stats"} component={() => (
        <DashboardLayout>
          <StatsDashboard />
        </DashboardLayout>
      )} />
      <Route path={"/admin/mission"} component={() => (
        <DashboardLayout>
          <MissionDashboardPage />
        </DashboardLayout>
      )} />
      <Route path={"/admin/ai"} component={() => (
        <DashboardLayout>
          <AiAnalyticsDashboard />
        </DashboardLayout>
      )} />
      <Route path={"/admin/settings"} component={() => (
        <DashboardLayout>
          <SettingsPage />
        </DashboardLayout>
      )} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
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
