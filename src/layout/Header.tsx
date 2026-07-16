import { useState } from "react"
import { createPortal } from "react-dom"
import { useLocation, useNavigate } from "react-router-dom"
import { Bell, ChevronDown, IdCard, KeyRound, Loader2, LogOut, Menu, Moon, Sun, UserCircle2 } from "lucide-react"
import { navItems, operatorNavItems } from "@/utils/navigation"
import { getRole, getAuthUser, getRoleLabel, clearAuth, getCurrentEmployeeId } from "@/utils/auth"
import { useTheme } from "@/hooks/useTheme"
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
import { useGetNotificationCountsQuery } from "@/store/services/notificationApi"

const NOTIFICATION_COUNTS_POLL_MS = 10000

const EXTRA_TITLES: Record<string, string> = {
  "/notifications": "Notifications",
  "/notifications/settings": "Notification Settings",
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
  const employeeId = getCurrentEmployeeId()
  const [logout, { isLoading: loggingOut }] = useLogoutMutation()
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { data: notificationCounts } = useGetNotificationCountsQuery(employeeId, {
    skip: !employeeId || role === 'operator',
    pollingInterval: NOTIFICATION_COUNTS_POLL_MS,
  })
  const unreadCount = notificationCounts?.unread ?? 0

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
    navigate("/operator-login", { replace: true })
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      {/* Left — burger (mobile only) + page title */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent lg:hidden">
          <Menu className="h-5 w-5" />
        </SidebarTrigger>
        <h1 className="text-base font-bold text-foreground md:text-lg">{title}</h1>
      </div>

      {/* Right — theme toggle + notifications + user */}
      <div className="flex items-center gap-3">
        {role !== 'operator' && (
          <button
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent transition-colors"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        )}

        {role !== 'operator' && (
          <button
            aria-label="Notifications"
            onClick={() => navigate("/notifications")}
            className="relative flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        )}

        {/* Operators — plain logout icon instead of the admin name dropdown */}
        {role === 'operator' && (
          <button
            aria-label="Logout"
            onClick={handleOperatorLogout}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        )}

        {/* Admin user — hidden for operators */}
        {role !== 'operator' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full px-2 py-1 text-sm font-medium text-foreground hover:bg-accent transition-colors">
                <UserCircle2 className="h-7 w-7 shrink-0 text-muted-foreground" />
                <span className="hidden sm:inline-flex items-center gap-1">
                  {user?.employeeName ?? "Admin"}
                  {user && <span className="text-muted-foreground font-normal">({getRoleLabel(user.employeeRole)})</span>}
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              {user && (
                <>
                  <div className="flex flex-col gap-2 px-3 py-2.5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <IdCard className="h-4 w-4 text-muted-foreground" />
                      Profile Info
                    </div>
                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                      <span className="text-muted-foreground">Employee ID</span>
                      <span className="text-right font-medium text-foreground">{user.employeeId}</span>
                      <span className="text-muted-foreground">Name</span>
                      <span className="text-right font-medium text-foreground">{user.employeeName}</span>
                      <span className="text-muted-foreground">Department</span>
                      <span className="text-right font-medium text-foreground">{user.department ?? "-"}</span>
                      <span className="text-muted-foreground">Role</span>
                      <span className="text-right font-medium text-foreground">{getRoleLabel(user.employeeRole)}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}
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
              <DropdownMenuItem
                onSelect={handleLogout}
                className="text-red-600 focus:bg-red-50 focus:text-red-600 dark:text-red-400 dark:focus:bg-red-950/40 dark:focus:text-red-400"
              >
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

      {loggingOut && createPortal(
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 text-white">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm font-medium">Logging out...</span>
          </div>
        </div>,
        document.body
      )}
    </header>
  )
}
