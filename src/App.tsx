import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Login } from "@/pages/auth/Login";
import { DashboardLayout } from "@/layout/DashboardLayout";
import { Dashboard } from "./pages/dashboard/Dashboard";
import { Manager } from "./pages/user_management/manager/Manager";
import { Supervisor } from "./pages/user_management/supervisor/Supervisor";
import { Operator } from "./pages/user_management/operator/Operator";
import { Department } from "./pages/department/Department";
import { Products } from "./pages/master_data/products/Products";
import { Company } from "./pages/master_data/company/Company";
import { PendingSchedules } from "./pages/pending_schedules/PendingSchedules"
import { CompletedSchedules } from "./pages/completed_schedules/CompletedSchedules";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/user-management/manager" element={<Manager />} />
          <Route path="/user-management/supervisor" element={<Supervisor />} />
          <Route path="/user-management/operator" element={<Operator />} />
          <Route path="/department" element={<Department />} />
          <Route path="/master-data/products" element={<Products />} />
          <Route path="/master-data/company" element={<Company />} />
          <Route path="/pending-schedules" element={<PendingSchedules />} />
          <Route path="/completed-schedules" element={<CompletedSchedules />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
