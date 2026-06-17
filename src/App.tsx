import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { DashboardLayout } from "@/layout/DashboardLayout";
import { PageSkeleton } from "@/components/PageSkeleton";
// import { getRole } from "@/utils/auth";

const Login                  = lazy(() => import("./pages/auth/Login").then(m => ({ default: m.Login })));
const Manager                = lazy(() => import("./pages/user_management/manager/Manager").then(m => ({ default: m.Manager })));
const Supervisor             = lazy(() => import("./pages/user_management/supervisor/Supervisor").then(m => ({ default: m.Supervisor })));
const Operator               = lazy(() => import("./pages/user_management/operator/Operator").then(m => ({ default: m.Operator })));
const Department             = lazy(() => import("./pages/department/Department").then(m => ({ default: m.Department })));
const Products               = lazy(() => import("./pages/master_data/products/Products").then(m => ({ default: m.Products })));
const Company                = lazy(() => import("./pages/master_data/company/Company").then(m => ({ default: m.Company })));
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
const EmployeeWiseLiveTracking  = lazy(() => import("./pages/dashboard/employee_tracking/EmployeeWiseLiveTracking").then(m => ({ default: m.EmployeeWiseLiveTracking })));
const ScheduleWiseLiveTracking  = lazy(() => import("./pages/dashboard/schedule_tracking/ScheduleWiseLiveTracking").then(m => ({ default: m.ScheduleWiseLiveTracking })));
const LiveTrackingPage       = lazy(() => import("./pages/live_tracking/LiveTracking").then(m => ({ default: m.LiveTracking })));
const ProductionMonitoring   = lazy(() => import("./pages/production_monitoring/ProductionMonitoring").then(m => ({ default: m.ProductionMonitoring })));

/** Redirects unauthenticated users to /login */
function ProtectedLayout() {
  // const role = getRole();
  // if (!role) return <Navigate to="/login" replace />;
  return <DashboardLayout />;
}

/** Redirects operators away from admin-only routes */
function AdminRoute() {
  // const role = getRole();
  // if (role === 'operator') return <Navigate to="/production-monitoring" replace />;
  return <Outlet />;
}

/** Sends users to their role's home on root visit */
function RoleRedirect() {
  // const role = getRole();
  // if (role === 'operator') return <Navigate to="/production-monitoring" replace />;
  return <Navigate to="/dashboard/employee-wise-tracking" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<RoleRedirect />} />

            {/* Operator-accessible routes */}
            <Route path="/live-tracking" element={<LiveTrackingPage />} />
            <Route path="/production-monitoring" element={<ProductionMonitoring />} />

            {/* Admin-only routes — operators are redirected to /live-tracking */}
            <Route element={<AdminRoute />}>
              <Route path="/user-management/manager" element={<Manager />} />
              <Route path="/user-management/supervisor" element={<Supervisor />} />
              <Route path="/user-management/operator" element={<Operator />} />
              <Route path="/department" element={<Department />} />
              <Route path="/master-data/products" element={<Products />} />
              <Route path="/master-data/company" element={<Company />} />
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
              <Route path="/notifications" element={<Notifications />} />
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
