import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Bell, ChevronDown, KeyRound, Loader2, LogOut, Menu, UserCircle2 } from "lucide-react"
import { navItems, operatorNavItems } from "@/utils/navigation"
import { getRole, getAuthUser, getRoleLabel, clearAuth } from "@/utils/auth"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ChangePasswordDialog } from "@/layout/ChangePasswordDialog"
import { useLogoutMutation } from "@/store/services/authApi"

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
  const user = getAuthUser()
  const [logout, { isLoading: loggingOut }] = useLogoutMutation()
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout().unwrap()
    } finally {
      clearAuth()
      navigate("/login", { replace: true })
    }
  }

  // Operators never authenticated against /Authentication/login, so there's no session to
  // revoke server-side — just drop the locally-stored operator identity and role.
  const handleOperatorLogout = () => {
    clearAuth()
    navigate("/login", { replace: true })
  }

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
        {/* Bell — operators don't get notifications */}
        {role !== 'operator' && (
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
        )}

        {/* Operators — plain logout icon instead of the admin name dropdown */}
        {role === 'operator' && (
          <button
            aria-label="Logout"
            onClick={handleOperatorLogout}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        )}

        {/* Admin user — hidden for operators */}
        {role !== 'operator' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                <UserCircle2 className="h-7 w-7 shrink-0 text-gray-500" />
                <span className="hidden sm:inline-flex items-center gap-1">
                  {user?.employeeName ?? "Admin"}
                  {user && <span className="text-gray-400 font-normal">({getRoleLabel(user.employeeRole)})</span>}
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onSelect={() => {
                  // Let the menu close normally first, then open the dialog on the
                  // next tick — opening it synchronously (or preventing the menu's
                  // close) races Radix's body pointer-events lock between the two
                  // overlays and leaves the page unclickable.
                  setTimeout(() => setChangePasswordOpen(true), 0)
                }}
              >
                <KeyRound className="h-4 w-4" />
                Change Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout} className="text-red-600 focus:bg-red-50 focus:text-red-600">
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <ChangePasswordDialog
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />

      {loggingOut && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 text-white">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm font-medium">Logging out...</span>
          </div>
        </div>
      )}
    </header>
  )
}
