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
    path: "/",
  },
  {
    label: "Schedules",
    icon: CalendarRange,
    children: [
      { label: "View Schedules", path: "/schedules" },
      { label: "Create Schedule", path: "/schedules/create" },
    ],
  },
  {
    label: "Production Data",
    icon: Factory,
    children: [
      { label: "Overview", path: "/production" },
      { label: "Reports", path: "/production/reports" },
    ],
  },
  {
    label: "Rework Schedules",
    icon: CalendarClock,
    children: [
      { label: "View", path: "/rework-schedules" },
      { label: "Create", path: "/rework-schedules/create" },
    ],
  },
  {
    label: "Rework Data",
    icon: ClipboardList,
    path: "/rework-data",
  },
  {
    label: "Tickets Data",
    icon: Ticket,
    path: "/tickets",
  },
  {
    label: "Master Data",
    icon: Database,
    children: [
      { label: "Categories", path: "/master-data/categories" },
      { label: "Products", path: "/master-data/products" },
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
