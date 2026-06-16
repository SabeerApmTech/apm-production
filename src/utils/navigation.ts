import {
  LayoutDashboard,
  CalendarRange,
  Factory,
  CalendarClock,
  ClipboardList,
  Ticket,
  Database,
  UserCog,
  Building2,
  Settings,
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
      { label: "Completed Schedule", path: "/completed-schedules" },
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
    label: "Rework Schedules",
    icon: CalendarClock,
    children: [
      { label: "Pending Rework Schedules", path: "/rework-schedules/pending" },
      { label: "Completed Rework Schedules", path: "/rework-schedules/completed" },
      { label: "Handover To Store", path: "/rework-schedules/handover-to-store" },
    ],
  },
  {
    label: "Rework Data",
    icon: ClipboardList,
    children: [
      { label: "Rework Transaction Log", path: "/rework-data/log" },
      { label: "Rework Production History", path: "/rework-data/history" },
    ],
  },
  {
    label: "Tickets",
    icon: Ticket,
    path: "/tickets",
  },
  {
    label: "Master Data",
    icon: Database,
    children: [
      { label: "Products", path: "/master-data/products" },
      { label: "Company", path: "/master-data/company" },
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
  },
  {
    label: "Settings",
    icon: Settings,
    children: [
      { label: "General", path: "/settings" },
      { label: "Notifications", path: "/settings/notifications" },
    ],
  },
]
