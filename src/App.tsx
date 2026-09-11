import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { DashboardLayout } from "@/layout/DashboardLayout";
import { PageSkeleton } from "@/components/PageSkeleton";
import { AuthExpiryWatcher } from "@/components/AuthExpiryWatcher";
import { getRole, getAuthUser, isTokenExpired, clearAuth } from "@/utils/auth";

const Login                  = lazy(() => import("./pages/auth/Login").then(m => ({ default: m.Login })));
const Manager                = lazy(() => import("./pages/user_management/manager/Manager").then(m => ({ default: m.Manager })));
const Supervisor             = lazy(() => import("./pages/user_management/supervisor/Supervisor").then(m => ({ default: m.Supervisor })));
const Operator               = lazy(() => import("./pages/user_management/operator/Operator").then(m => ({ default: m.Operator })));
const Department             = lazy(() => import("./pages/department/Department").then(m => ({ default: m.Department })));
const ProductionItems = lazy(() => import("./pages/master_data/production_items/ProductionItems").then(m => ({ default: m.ProductionItems })));
const Products               = lazy(() => import("./pages/master_data/products/Products").then(m => ({ default: m.Products })));
const Company                = lazy(() => import("./pages/master_data/company/Company").then(m => ({ default: m.Company })));
const Store                  = lazy(() => import("./pages/master_data/store/Store").then(m => ({ default: m.Store })));
const ProcessTeam            = lazy(() => import("./pages/master_data/process_team/ProcessTeam").then(m => ({ default: m.ProcessTeam })));
const OpenSchedules          = lazy(() => import("./pages/schedules/open_schedules/OpenSchedules").then(m => ({ default: m.OpenSchedules })));
const ClosedSchedules        = lazy(() => import("./pages/schedules/closed_schedules/ClosedSchedules").then(m => ({ default: m.ClosedSchedules })));
const StockData              = lazy(() => import("./pages/schedules/stock_data/StockData").then(m => ({ default: m.StockData })));
const HandoverToStore        = lazy(() => import("./pages/schedules/handover_to_store/HandoverToStore").then(m => ({ default: m.HandoverToStore })));
const TransactionLog         = lazy(() => import("./pages/production_data/transaction_log/TransactionLog").then(m => ({ default: m.TransactionLog })));
const ProductionHistory      = lazy(() => import("./pages/production_data/production_history/ProductionHistory").then(m => ({ default: m.ProductionHistory })));
const QrScanRecords          = lazy(() => import("./pages/production_data/qr_scan_records/QrScanRecords").then(m => ({ default: m.QrScanRecords })));
const Notifications          = lazy(() => import("./pages/notifications/Notifications").then(m => ({ default: m.Notifications })));
const NotificationSettings   = lazy(() => import("./pages/notifications/NotificationSettings").then(m => ({ default: m.NotificationSettings })));
const EmployeeWiseLiveTracking  = lazy(() => import("./pages/dashboard/employee_tracking/EmployeeWiseLiveTracking").then(m => ({ default: m.EmployeeWiseLiveTracking })));
const ScheduleWiseLiveTracking  = lazy(() => import("./pages/dashboard/schedule_tracking/ScheduleWiseLiveTracking").then(m => ({ default: m.ScheduleWiseLiveTracking })));
const OperatorLogReport      = lazy(() => import("./pages/live_tracking/OperatorLogReport").then(m => ({ default: m.OperatorLogReport })));
const ProductionMonitoring   = lazy(() => import("./pages/production_monitoring/ProductionMonitoring").then(m => ({ default: m.ProductionMonitoring })));
const EmployeePerformanceReport = lazy(() => import("./pages/reports/employee_performance/EmployeePerformanceReport").then(m => ({ default: m.EmployeePerformanceReport })));
const ProductWiseReport      = lazy(() => import("./pages/reports/product_wise/ProductWiseReport").then(m => ({ default: m.ProductWiseReport })));

/** Redirects unauthenticated users (or users whose token has expired) to /login */
function ProtectedLayout() {
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
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<RoleRedirect />} />

            {/* Operator-accessible routes */}
            <Route path="/live-tracking" element={<EmployeeWiseLiveTracking />} />
            {/* Reached via the "View Detail" link on /live-tracking — read-only view of another operator's current job */}
            <Route path="/live-tracking/log-report" element={<OperatorLogReport />} />
            <Route path="/production-monitoring" element={<ProductionMonitoring />} />
            <Route path="/notifications" element={<Notifications />} />

            {/* Admin-only routes — operators are redirected to /production-monitoring */}
            <Route element={<AdminRoute />}>
              <Route path="/notifications/settings" element={<NotificationSettings />} />
              <Route path="/user-management/manager" element={<Manager />} />
              <Route path="/user-management/supervisor" element={<Supervisor />} />
              <Route path="/user-management/operator" element={<Operator />} />
              <Route path="/department" element={<Department />} />
              <Route path="/master-data/production-items" element={<ProductionItems />} />
              <Route path="/master-data/products" element={<Products />} />
              <Route path="/master-data/company" element={<Company />} />
              <Route path="/master-data/store" element={<Store />} />
              <Route path="/master-data/process-team" element={<ProcessTeam />} />
              <Route path="/schedules/open" element={<OpenSchedules />} />
              <Route path="/schedules/closed" element={<ClosedSchedules />} />
              <Route path="/schedules/stock-data" element={<StockData />} />
              <Route path="/schedules/handover-to-store" element={<HandoverToStore />} />
              <Route path="/production/log" element={<TransactionLog />} />
              <Route path="/production/history" element={<ProductionHistory />} />
              <Route path="/production/produced-products" element={<QrScanRecords />} />
              <Route path="/reports/employee-performance" element={<EmployeePerformanceReport />} />
              <Route path="/reports/product-wise" element={<ProductWiseReport />} />
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
