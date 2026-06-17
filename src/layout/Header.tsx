import { useLocation, useNavigate } from "react-router-dom"
import { Bell, ChevronDown, Menu, UserCircle2 } from "lucide-react"
import { navItems, operatorNavItems } from "@/utils/navigation"
import { getRole } from "@/utils/auth"
import { SidebarTrigger } from "@/components/ui/sidebar"

const EXTRA_TITLES: Record<string, string> = {
  "/notifications": "Notifications",
}

function getPageTitle(pathname: string): string {
  if (EXTRA_TITLES[pathname]) return EXTRA_TITLES[pathname]
  const allItems = [...navItems, ...operatorNavItems]
  for (const item of allItems) {
    if (item.path && pathname === item.path) return item.label
    if (item.children) {
      const match = item.children.find((c) => pathname.startsWith(c.path))
      if (match) return match.label
    }
  }
  return "Dashboard"
}

export function Header() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const title = getPageTitle(pathname)
  const role = getRole()

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      {/* Left — burger (mobile only) + page title */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 lg:hidden">
          <Menu className="h-5 w-5" />
        </SidebarTrigger>
        <h1 className="text-base font-bold text-[#0d1b2e] md:text-lg">{title}</h1>
      </div>

      {/* Right — notifications + user */}
      <div className="flex items-center gap-3">
        {/* Bell */}
        <button
          aria-label="Notifications"
          onClick={() => navigate("/notifications")}
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white">
            2
          </span>
        </button>

        {/* Admin user — hidden for operators */}
        {role !== 'operator' && (
          <button className="flex items-center gap-2 rounded-full px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
            <UserCircle2 className="h-7 w-7 shrink-0 text-gray-500" />
            <span className="hidden sm:inline-flex items-center gap-1">
              Admin
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </span>
          </button>
        )}
      </div>
    </header>
  )
}
