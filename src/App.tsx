import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "@/pages/auth/Login";
import { DashboardLayout } from "@/layout/DashboardLayout";
import { Manager } from "./pages/user_management/manager/Manager";
import { Supervisor } from "./pages/user_management/supervisor/Supervisor";
import { Operator } from "./pages/user_management/operator/Operator";
import { Department } from "./pages/department/Department";
import { Products } from "./pages/master_data/products/Products";
import { Company } from "./pages/master_data/company/Company";
import { PendingSchedules } from "./pages/schedules/pending_schedules/PendingSchedules"
import { CompletedSchedules } from "./pages/schedules/completed_schedules/CompletedSchedules"
import { HandoverToStore } from "./pages/schedules/handover_to_store/HandoverToStore";
import { ProductionHistory } from "./pages/production_data/production_history/ProductionHistory";
import { TransactionLog } from "./pages/production_data/transaction_log/TransactionLog";
import { PendingReworkSchedules } from "./pages/rework_schedules/pending_rework_schedules/PendingReworkSchedules";
import { CompletedReworkSchedules } from "./pages/rework_schedules/completed_rework_schedules/CompletedReworkSchedules";
import { ReworkHandoverToStore } from "./pages/rework_schedules/handover_to_store/HandoverToStore";
import { Tickets } from "./pages/tickets/Tickets";
import { Notifications } from "./pages/notifications/Notifications";
import { ReworkTransactionLog } from "./pages/rework_data/transaction_log/TransactionLog";
import { ReworkHistory } from "./pages/rework_data/rework_history/ReworkHistory";
import { EmployeeWiseLiveTracking } from "./pages/dashboard/employee_tracking/EmployeeWiseLiveTracking";
import { ScheduleWiseLiveTracking } from "./pages/dashboard/schedule_tracking/ScheduleWiseLiveTracking";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/dashboard/employee-wise-tracking" replace />} />
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
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/rework-data/log" element={<ReworkTransactionLog />} />
          <Route path="/rework-data/history" element={<ReworkHistory />} />
          <Route path="/dashboard/employee-wise-tracking" element={<EmployeeWiseLiveTracking />} />
          <Route path="/dashboard/schedule-wise-tracking" element={<ScheduleWiseLiveTracking />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
