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
import PaymentDashboard from './pages/PaymentDashboard';
import AiAnalyticsDashboard from './pages/AiAnalyticsDashboard';
import DashboardLayout from "./components/DashboardLayout";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/admin"} component={() => (
        <DashboardLayout>
          <AdminDashboard />
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
      <Route path={"/admin/ai-analytics"} component={() => (
        <DashboardLayout>
          <AiAnalyticsDashboard />
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
