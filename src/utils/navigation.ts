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
  Warehouse,
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
      { label: "Open Schedule", path: "/schedules/open" },
      { label: "Closed Schedule", path: "/schedules/closed" },
      { label: "Stock Data", path: "/schedules/stock-data" },
    ],
  },
  {
    label: "Production Data",
    icon: Factory,
    children: [
      { label: "Transaction Log", path: "/production/log" },
      { label: "Production History", path: "/production/history" },
      { label: "QR Scan Records", path: "/production/produced-products" },
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
    label: "Handover To Store",
    icon: Warehouse,
    path: "/schedules/handover-to-store",
  },
  {
    label: "Master Data",
    icon: Database,
    children: [
      { label: "Production Items", path: "/master-data/production-items" },
      { label: "Products", path: "/master-data/products" },
      { label: "Company", path: "/master-data/company" },
      { label: "Store", path: "/master-data/store" },
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
