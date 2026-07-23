import {
  LayoutDashboard,
  CalendarRange,
  Factory,
  Database,
  UserCog,
  Building2,
  Monitor,
  Navigation,
  FileBarChart,
  FileChartColumn,
  RotateCcw,
  Recycle,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type NavChild = {
  label: string
  path: string
}

export type NavItem = {
  label: string
  icon: LucideIcon
  path?: string
  children?: NavChild[]
}

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    children: [
      { label: "Employee Wise Live Tracking", path: "/dashboard/employee-wise-tracking" },
      { label: "Schedule Wise Live Tracking", path: "/dashboard/schedule-wise-tracking" },
    ],
  },
  {
    label: "Schedules",
    icon: CalendarRange,
    children: [
      { label: "Pending Schedules", path: "/pending-schedules" },
      { label: "Completed Schedules", path: "/completed-schedules" },
      { label: "Handover To Store", path: "/handover-to-store" },
    ],
  },
  {
    label: "Production Data",
    icon: Factory,
    children: [
      { label: "Transaction Log", path: "/production/log" },
      { label: "Production History", path: "/production/history" },
    ],
  },
  {
    label: "Production Report",
    icon: FileBarChart,
    children: [
      { label: "Employee Performance Report", path: "/reports/employee-performance" },
      { label: "Product Wise Report", path: "/reports/product-wise" },
    ],
  },
  {
    label: "Rework Schedules",
    icon: RotateCcw,
    children: [
      { label: "Pending Rework Schedules", path: "/rework-schedules/pending" },
      { label: "Completed Rework Schedules", path: "/rework-schedules/completed" },
      { label: "Handover To Store", path: "/rework-schedules/handover-to-store" },
    ],
  },
  
  {
    label: "Rework Data",
    icon: Recycle,
    children: [
      { label: "Transaction Log", path: "/rework-data/log" },
      { label: "Production History", path: "/rework-data/history" },
    ],
  },
  {
    label: "Rework Report",
    icon: FileChartColumn,
    children: [
      { label: "Employee Performance Report", path: "/rework/reports/employee-performance" },
      { label: "Product Wise Report", path: "/rework/reports/product-wise" },
    ],
  },
  {
    label: "Master Data",
    icon: Database,
    children: [
      { label: "Products", path: "/master-data/products" },
      { label: "Company", path: "/master-data/company" },
      { label: "Store", path: "/master-data/store" },
      { label: "Process Team", path: "/master-data/process-team" },
    ],
  },
  {
    label: "User Management",
    icon: UserCog,
    children: [
      { label: "Manager", path: "/user-management/manager" },
      { label: "Supervisor", path: "/user-management/supervisor" },
      { label: "Operator", path: "/user-management/operator" },
    ],
  },
  {
    label: "Department",
    icon: Building2,
    path: "/department",
  }
]

export const operatorNavItems: NavItem[] = [
  {
    label: "Production Monitoring",
    icon: Monitor,
    path: "/production-monitoring",
  },
  {
    label: "Live Tracking",
    icon: Navigation,
    path: "/live-tracking",
  },
]
