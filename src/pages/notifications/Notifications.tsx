import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search, SlidersHorizontal, Bell, Ticket as TicketIcon,
  CalendarClock, CheckCircle2, UserCheck, Package, ArrowLeft, CheckCircle, Clock, Loader2, Check, ArrowUpRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getCurrentEmployeeId } from "@/utils/auth"
import {
  useClearAllNotificationsMutation,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/store/services/notificationApi"
import type { NotificationItem } from "@/types/notification"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type FilterTab = "All" | "Unread" | "Read"

const TAB_IS_READ: Record<FilterTab, boolean | undefined> = {
  All: undefined,
  Unread: false,
  Read: true,
}

const EMPTY_NOTIFICATIONS: NotificationItem[] = []

/* ── Icon / color config, keyed by module (case-insensitive) ─────── */
const MODULE_CFG: Record<string, { bg: string; icon: string; Icon: React.ComponentType<{ className?: string }> }> = {
  ticket:   { bg: "bg-rose-100 dark:bg-rose-950/40",     icon: "text-rose-500 dark:text-rose-400",     Icon: TicketIcon    },
  schedule: { bg: "bg-amber-100 dark:bg-amber-950/40",   icon: "text-amber-500 dark:text-amber-400",   Icon: CalendarClock },
  target:   { bg: "bg-green-100 dark:bg-green-950/40",   icon: "text-green-500 dark:text-green-400",   Icon: CheckCircle2  },
  rework:   { bg: "bg-purple-100 dark:bg-purple-950/40", icon: "text-purple-500 dark:text-purple-400", Icon: UserCheck     },
  product:  { bg: "bg-indigo-100 dark:bg-indigo-950/40", icon: "text-indigo-500 dark:text-indigo-400", Icon: Package       },
}
const DEFAULT_MODULE_CFG = { bg: "bg-blue-100 dark:bg-blue-950/40", icon: "text-blue-500 dark:text-blue-400", Icon: Bell }

function moduleCfg(module: string) {
  return MODULE_CFG[module.toLowerCase()] ?? DEFAULT_MODULE_CFG
}

/* ── Module -> route, for the "navigate to module" icon ───────────── */
const MODULE_ROUTES: Record<string, string> = {
  schedule: "/pending-schedules",
  product: "/master-data/products",
  company: "/master-data/company",
  store: "/master-data/store",
  department: "/department",
  rework: "/rework-schedules/pending",
}

function moduleRoute(module: string): string | undefined {
  return MODULE_ROUTES[module.toLowerCase()]
}

/* ── Date helpers ──────────────────────────────────────────────────── */
function formatTimeAgo(iso: string): string {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
  const timeStr = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return `Yesterday ${timeStr}`
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + ` ${timeStr}`
}

function formatFullDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  })
}

function groupLabel(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86400000)
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

/* ── Notification list item ─────────────────────────────────────── */
function NotifCard({ notif, selected, onClick }: {
  notif: NotificationItem
  selected: boolean
  onClick: () => void
}) {
  const cfg = moduleCfg(notif.module)
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border transition-all",
        selected
          ? "border-blue-300 bg-blue-50 shadow-sm border-l-4 border-l-blue-500 dark:border-blue-800 dark:bg-blue-950/30"
          : "border-border bg-card hover:border-muted-foreground/40 hover:shadow-sm"
      )}
    >
      <div className="flex gap-3 px-3.5 py-3">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", cfg.bg)}>
          <cfg.Icon className={cn("h-5 w-5", cfg.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-foreground leading-snug truncate">{notif.title}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTimeAgo(notif.createdAt)}</span>
              {!notif.isRead && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.module}</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.message}</p>
        </div>
      </div>
    </button>
  )
}

/* ── Notification detail ────────────────────────────────────────── */
function NotifDetail({ notif, onBack, onMarkRead, marking, onNavigate }: {
  notif: NotificationItem
  onBack: () => void
  onMarkRead: () => void
  marking: boolean
  onNavigate?: () => void
}) {
  const cfg = moduleCfg(notif.module)
  const details: { label: string; value: string }[] = [
    { label: "Reference ID", value: notif.referenceId },
    { label: "Module", value: notif.module },
    { label: "Type", value: notif.notificationType },
    { label: "Date & Time", value: formatFullDateTime(notif.createdAt) },
  ]

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-start gap-3 px-4 py-4 border-b border-border">
        <button
          onClick={onBack}
          className="md:hidden flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors mt-0.5"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", cfg.bg)}>
          <cfg.Icon className={cn("h-5 w-5", cfg.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base font-bold text-foreground leading-snug">{notif.title}</h2>
            <div className="flex items-center gap-1.5 shrink-0">
              {onNavigate && (
                <button
                  onClick={onNavigate}
                  aria-label={`Go to ${notif.module}`}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent transition-colors"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Go to {notif.module}</span>
                </button>
              )}
              {!notif.isRead && (
                <button
                  onClick={onMarkRead}
                  disabled={marking}
                  className="flex items-center gap-1.5 rounded-lg border border-blue-300 px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-60 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/30"
                >
                  {marking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">Mark as Read</span>
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">{notif.message}</p>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* Info table */}
        <div className="px-4 pt-3 pb-2">
          <table className="w-full text-sm border-collapse border border-border rounded-lg overflow-hidden">
            <tbody>
              {details.map(({ label, value }) => (
                <tr key={label} className="border-b border-border last:border-0">
                  <td className="py-2.5 px-3 text-xs font-semibold text-muted-foreground bg-muted/50 w-36 border-r border-border">
                    {label}
                  </td>
                  <td className="py-2.5 px-3 text-sm text-foreground">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Description */}
        <div className="px-4 py-3 border-t border-border">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</h4>
          <p className="text-sm text-foreground leading-relaxed">{notif.message}</p>
        </div>
      </div>

      {/* Footer timestamp */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-t border-border bg-muted/30">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{formatFullDateTime(notif.createdAt)} ({formatTimeAgo(notif.createdAt)})</span>
      </div>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────────── */
export function Notifications() {
  const navigate = useNavigate()
  const employeeId = getCurrentEmployeeId()
  const [search,       setSearch]       = useState("")
  const [activeTab,    setActiveTab]    = useState<FilterTab>("All")
  const [moduleFilter, setModuleFilter] = useState<string | null>(null)
  const [selectedId,   setSelectedId]   = useState<number | null>(null)
  const [clearAllOpen, setClearAllOpen] = useState(false)

  const { data, isLoading, isFetching } = useGetNotificationsQuery(
    { employeeId, isRead: TAB_IS_READ[activeTab], module: moduleFilter ?? undefined },
    { skip: !employeeId, refetchOnMountOrArgChange: true }
  )
  const { data: allData } = useGetNotificationsQuery(
    { employeeId },
    { skip: !employeeId, refetchOnMountOrArgChange: true }
  )

  const availableModules = useMemo(() => {
    const modules = new Set<string>()
    for (const n of allData?.notifications ?? []) modules.add(n.module)
    return Array.from(modules).sort()
  }, [allData])
  const [markNotificationRead, { isLoading: marking }] = useMarkNotificationReadMutation()
  const [markAllNotificationsRead, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation()
  const [clearAllNotifications, { isLoading: clearing }] = useClearAllNotificationsMutation()

  const notifications = data?.notifications ?? EMPTY_NOTIFICATIONS

  const counts = useMemo(() => {
    const all = allData?.notifications ?? []
    return {
      all: all.length,
      unread: all.filter((n) => !n.isRead).length,
      read: all.filter((n) => n.isRead).length,
    }
  }, [allData])

  const filtered = useMemo(() => {
    if (!search.trim()) return notifications
    const q = search.toLowerCase()
    return notifications.filter((n) =>
      n.title.toLowerCase().includes(q) ||
      n.message.toLowerCase().includes(q) ||
      n.module.toLowerCase().includes(q)
    )
  }, [notifications, search])

  const selected = notifications.find((n) => n.notificationId === selectedId) ?? null

  // Group filtered by "Today" / "Yesterday" / date
  const groups = useMemo(() => {
    const map = new Map<string, NotificationItem[]>()
    for (const n of filtered) {
      const key = groupLabel(n.createdAt)
      const list = map.get(key) ?? []
      list.push(n)
      map.set(key, list)
    }
    return map
  }, [filtered])

  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: "All",    label: "All",    count: counts.all    },
    { key: "Unread", label: "Unread", count: counts.unread },
    { key: "Read",   label: "Read",   count: counts.read   },
  ]

  const handleSelect = (notif: NotificationItem) => {
    setSelectedId(notif.notificationId)
    if (!notif.isRead) {
      markNotificationRead(notif.notificationId)
    }
  }

  const handleNavigateToModule = (module: string) => {
    const route = moduleRoute(module)
    if (route) navigate(route)
  }

  const handleMarkAllRead = () => {
    if (employeeId) markAllNotificationsRead(employeeId)
  }

  const handleClearAll = () => {
    if (!employeeId) return
    setClearAllOpen(true)
  }

  const confirmClearAll = () => {
    setClearAllOpen(false)
    setSelectedId(null)
    clearAllNotifications(employeeId)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 min-h-0">
      <div className="flex flex-1 gap-4 min-h-0">
        {/* List panel */}
        <div className={cn(
          "flex flex-col gap-3 min-h-0 overflow-hidden",
          selectedId
            ? "hidden md:flex md:flex-1"
            : "flex-1"
        )}>
          {/* Tabs */}
          <div className="flex shrink-0 items-center justify-between gap-2">
            <div className="flex">
              {TABS.map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={cn(
                    "pb-2.5 px-3 text-sm font-medium transition-colors whitespace-nowrap shrink-0",
                    activeTab === key
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 -mb-px"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                  <span className={cn("ml-1 text-xs", activeTab === key ? "text-blue-400" : "text-muted-foreground")}>
                    ({count})
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll || counts.unread === 0}
                className="rounded-lg px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:hover:bg-transparent dark:text-blue-400 dark:hover:bg-blue-950/30"
              >
                Mark all read
              </button>
              <button
                onClick={handleClearAll}
                disabled={clearing || counts.all === 0}
                className="rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* Search + Filter */}
          <div className="flex gap-2 shrink-0">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Notification"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-card text-foreground pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors shrink-0",
                    moduleFilter
                      ? "border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400"
                      : "border-border bg-card text-muted-foreground hover:bg-accent"
                  )}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {moduleFilter ? moduleFilter : "Filter"}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem onSelect={() => setModuleFilter(null)} className="justify-between">
                  All Modules
                  {!moduleFilter && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
                {availableModules.map((module) => (
                  <DropdownMenuItem key={module} onSelect={() => setModuleFilter(module)} className="justify-between">
                    {module}
                    {moduleFilter === module && <Check className="h-4 w-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Grouped list */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-0.5">
            {isLoading || isFetching ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading notifications...</p>
              </div>
            ) : groups.size === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
                <Bell className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No notifications found</p>
              </div>
            ) : (
              Array.from(groups.entries()).map(([group, items]) => (
                <div key={group} className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">{group}</p>
                  {items.map((notif) => (
                    <NotifCard
                      key={notif.notificationId}
                      notif={notif}
                      selected={selectedId === notif.notificationId}
                      onClick={() => handleSelect(notif)}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selected ? (
          <NotifDetail
            notif={selected}
            onBack={() => setSelectedId(null)}
            onMarkRead={() => markNotificationRead(selected.notificationId)}
            marking={marking}
            onNavigate={moduleRoute(selected.module) ? () => handleNavigateToModule(selected.module) : undefined}
          />
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 gap-3">
            <Bell className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">Select a notification to view details</p>
          </div>
        )}
      </div>

      <Dialog open={clearAllOpen} onOpenChange={setClearAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear all notifications?</DialogTitle>
            <DialogDescription>This will remove all your notifications and cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearAllOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmClearAll} disabled={clearing}>
              {clearing ? "Clearing..." : "Clear All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
