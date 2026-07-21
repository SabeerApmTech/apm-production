import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { DashboardLayout } from "@/layout/DashboardLayout";
import { PageSkeleton } from "@/components/PageSkeleton";
import { AuthExpiryWatcher } from "@/components/AuthExpiryWatcher";
import { getRole, getAuthUser, isTokenExpired, clearAuth } from "@/utils/auth";

const Login                  = lazy(() => import("./pages/auth/Login").then(m => ({ default: m.Login })));
const OperatorLogin           = lazy(() => import("./pages/auth/OperatorLogin").then(m => ({ default: m.OperatorLogin })));
const Manager                = lazy(() => import("./pages/user_management/manager/Manager").then(m => ({ default: m.Manager })));
const Supervisor             = lazy(() => import("./pages/user_management/supervisor/Supervisor").then(m => ({ default: m.Supervisor })));
const Operator               = lazy(() => import("./pages/user_management/operator/Operator").then(m => ({ default: m.Operator })));
const Department             = lazy(() => import("./pages/department/Department").then(m => ({ default: m.Department })));
const Products               = lazy(() => import("./pages/master_data/products/Products").then(m => ({ default: m.Products })));
const Company                = lazy(() => import("./pages/master_data/company/Company").then(m => ({ default: m.Company })));
const Store                  = lazy(() => import("./pages/master_data/store/Store").then(m => ({ default: m.Store })));
const PendingSchedules       = lazy(() => import("./pages/schedules/pending_schedules/PendingSchedules").then(m => ({ default: m.PendingSchedules })));
const CompletedSchedules     = lazy(() => import("./pages/schedules/completed_schedules/CompletedSchedules").then(m => ({ default: m.CompletedSchedules })));
const HandoverToStore        = lazy(() => import("./pages/schedules/handover_to_store/HandoverToStore").then(m => ({ default: m.HandoverToStore })));
const TransactionLog         = lazy(() => import("./pages/production_data/transaction_log/TransactionLog").then(m => ({ default: m.TransactionLog })));
const ProductionHistory      = lazy(() => import("./pages/production_data/production_history/ProductionHistory").then(m => ({ default: m.ProductionHistory })));
const PendingReworkSchedules = lazy(() => import("./pages/rework_schedules/pending_rework_schedules/PendingReworkSchedules").then(m => ({ default: m.PendingReworkSchedules })));
const CompletedReworkSchedules = lazy(() => import("./pages/rework_schedules/completed_rework_schedules/CompletedReworkSchedules").then(m => ({ default: m.CompletedReworkSchedules })));
const ReworkHandoverToStore  = lazy(() => import("./pages/rework_schedules/handover_to_store/HandoverToStore").then(m => ({ default: m.ReworkHandoverToStore })));
const ReworkTransactionLog   = lazy(() => import("./pages/rework_data/transaction_log/TransactionLog").then(m => ({ default: m.ReworkTransactionLog })));
const ReworkHistory          = lazy(() => import("./pages/rework_data/rework_history/ReworkHistory").then(m => ({ default: m.ReworkHistory })));
const Notifications          = lazy(() => import("./pages/notifications/Notifications").then(m => ({ default: m.Notifications })));
const NotificationSettings   = lazy(() => import("./pages/notifications/NotificationSettings").then(m => ({ default: m.NotificationSettings })));
const EmployeeWiseLiveTracking  = lazy(() => import("./pages/dashboard/employee_tracking/EmployeeWiseLiveTracking").then(m => ({ default: m.EmployeeWiseLiveTracking })));
const ScheduleWiseLiveTracking  = lazy(() => import("./pages/dashboard/schedule_tracking/ScheduleWiseLiveTracking").then(m => ({ default: m.ScheduleWiseLiveTracking })));
const OperatorLogReport      = lazy(() => import("./pages/live_tracking/OperatorLogReport").then(m => ({ default: m.OperatorLogReport })));
const ProductionMonitoring   = lazy(() => import("./pages/production_monitoring/ProductionMonitoring").then(m => ({ default: m.ProductionMonitoring })));
const EmployeePerformanceReport = lazy(() => import("./pages/reports/employee_performance/EmployeePerformanceReport").then(m => ({ default: m.EmployeePerformanceReport })));
const ProductWiseReport      = lazy(() => import("./pages/reports/product_wise/ProductWiseReport").then(m => ({ default: m.ProductWiseReport })));
const ReworkEmployeePerformanceReport = lazy(() => import("./pages/rework_reports/employee_performance/EmployeePerformanceReport").then(m => ({ default: m.ReworkEmployeePerformanceReport })));
const ReworkProductWiseReport = lazy(() => import("./pages/rework_reports/product_wise/ProductWiseReport").then(m => ({ default: m.ReworkProductWiseReport })));

/** Redirects unauthenticated users (or admins whose token has expired) to /login */
function ProtectedLayout() {
  if (getRole() === 'operator') return <DashboardLayout />;

  const user = getAuthUser();
  if (user && isTokenExpired()) {
    clearAuth();
    return <Navigate to="/login" replace />;
  }
  if (!user) return <Navigate to="/login" replace />;
  return <DashboardLayout />;
}

/** Redirects operators away from admin-only routes */
function AdminRoute() {
  const role = getRole();
  if (role === 'operator') return <Navigate to="/production-monitoring" replace />;
  return <Outlet />;
}

/** Sends users to their role's home on root visit */
function RoleRedirect() {
  const role = getRole();
  if (role === 'operator') return <Navigate to="/production-monitoring" replace />;
  return <Navigate to="/dashboard/employee-wise-tracking" replace />;
}

function App() {
  return (
    // useTransitions defaults to true, which wraps route changes in React.startTransition — when
    // a lazy route's chunk hasn't loaded yet, a transition update suspends *without* showing the
    // Suspense fallback below, so the URL changes but the old page stays frozen on screen until
    // the chunk arrives. Opting out makes navigation synchronous so PageSkeleton shows instantly.
    <BrowserRouter useTransitions={false}>
      <Toaster position="top-right" richColors closeButton />
      <AuthExpiryWatcher />
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/operator-login" element={<OperatorLogin />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<RoleRedirect />} />

            {/* Operator-accessible routes */}
            <Route path="/live-tracking" element={<EmployeeWiseLiveTracking />} />
            {/* Reached via the "View Detail" link on /live-tracking — read-only view of another operator's current job */}
            <Route path="/live-tracking/log-report" element={<OperatorLogReport />} />
            <Route path="/production-monitoring" element={<ProductionMonitoring />} />

            {/* Admin-only routes — operators are redirected to /production-monitoring */}
            <Route element={<AdminRoute />}>
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/notifications/settings" element={<NotificationSettings />} />
              <Route path="/user-management/manager" element={<Manager />} />
              <Route path="/user-management/supervisor" element={<Supervisor />} />
              <Route path="/user-management/operator" element={<Operator />} />
              <Route path="/department" element={<Department />} />
              <Route path="/master-data/products" element={<Products />} />
              <Route path="/master-data/company" element={<Company />} />
              <Route path="/master-data/store" element={<Store />} />
              <Route path="/pending-schedules" element={<PendingSchedules />} />
              <Route path="/completed-schedules" element={<CompletedSchedules />} />
              <Route path="/handover-to-store" element={<HandoverToStore />} />
              <Route path="/production/log" element={<TransactionLog />} />
              <Route path="/production/history" element={<ProductionHistory />} />
              <Route path="/rework-schedules/pending" element={<PendingReworkSchedules />} />
              <Route path="/rework-schedules/completed" element={<CompletedReworkSchedules />} />
              <Route path="/rework-schedules/handover-to-store" element={<ReworkHandoverToStore />} />
              <Route path="/rework-data/log" element={<ReworkTransactionLog />} />
              <Route path="/rework-data/history" element={<ReworkHistory />} />
              <Route path="/reports/employee-performance" element={<EmployeePerformanceReport />} />
              <Route path="/reports/product-wise" element={<ProductWiseReport />} />
              <Route path="/rework/reports/employee-performance" element={<ReworkEmployeePerformanceReport />} />
              <Route path="/rework/reports/product-wise" element={<ReworkProductWiseReport />} />
              <Route path="/dashboard/employee-wise-tracking" element={<EmployeeWiseLiveTracking />} />
              <Route path="/dashboard/schedule-wise-tracking" element={<ScheduleWiseLiveTracking />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
