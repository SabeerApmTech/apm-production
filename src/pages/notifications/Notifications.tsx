import { useState, useMemo } from "react"
import {
  Search, SlidersHorizontal, Bell, Ticket as TicketIcon,
  CalendarClock, CheckCircle2, UserCheck, ArrowLeft, CheckCircle, Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Types ─────────────────────────────────────────────────────── */
type NotifType     = "ticket" | "schedule" | "target" | "rework" | "system"
type NotifPriority = "High" | "Medium" | "Low"
type FilterTab     = "All" | "Unread" | "Read"

interface DetailField { label: string; value: string }

interface NotifItem {
  id: string
  type: NotifType
  title: string
  meta: string
  subtext: string
  timeAgo: string
  fullDateTime: string
  isRead: boolean
  group: string
  priority?: NotifPriority
  shortDesc: string
  details: DetailField[]
  description: string
}

/* ── Mock Data ──────────────────────────────────────────────────── */
const NOTIFICATIONS: NotifItem[] = [
  {
    id: "N001", type: "ticket",
    title: "New Ticket Raised",
    meta: "Schedule Id : S001 - 26", subtext: "Issues Reported by Surya",
    timeAgo: "10 mins ago", fullDateTime: "May 14, 2026 11:00 am",
    isRead: false, group: "Today", priority: "High",
    shortDesc: "A new high priority ticket has been raised for Schedule S001-26.",
    details: [
      { label: "Ticket ID",      value: "TK-1001"              },
      { label: "Issue Type",     value: "Login Issue"           },
      { label: "Department",     value: "Production"            },
      { label: "Date & Time",    value: "May 14, 2026 10:50 AM" },
      { label: "Reported By",    value: "Surya"                 },
    ],
    description: "User Surya from the Production department is unable to login into the Production Management System. An authentication error is received while signing in.",
  },
  {
    id: "N002", type: "schedule",
    title: "Production Schedule Delayed",
    meta: "Ticket Id : TK-1002", subtext: "Reported by Ashwin - Admin",
    timeAgo: "30 mins ago", fullDateTime: "May 14, 2026 11:00 pm",
    isRead: false, group: "Today", priority: "High",
    shortDesc: "Production schedule has been delayed.",
    details: [
      { label: "Schedule Id",    value: "S-1001"                },
      { label: "Delay Duration", value: "2 Hours"               },
      { label: "Department",     value: "Production"            },
      { label: "Date & Time",    value: "May 14, 2026 11:00 PM" },
      { label: "Reported By",    value: "System"                },
    ],
    description: "The production schedule S-1001 has been delayed by 2 hours due to machine maintenance.",
  },
  {
    id: "N003", type: "target",
    title: "Target Achieved",
    meta: "Product - APM : 001", subtext: "Target Qty Completed",
    timeAgo: "Yesterday 4:30 pm", fullDateTime: "May 13, 2026 4:30 pm",
    isRead: true, group: "Yesterday", priority: "Low",
    shortDesc: "Production target has been successfully achieved.",
    details: [
      { label: "Product",     value: "APM-001"             },
      { label: "Target Qty",  value: "3000 Units"          },
      { label: "Achieved Qty",value: "3000 Units"          },
      { label: "Department",  value: "Production"          },
      { label: "Date & Time", value: "May 13, 2026 4:30 PM"},
    ],
    description: "The production target for product APM-001 has been fully completed. All 3000 units have been manufactured and passed QC.",
  },
  {
    id: "N004", type: "rework",
    title: "Rework Schedule Assigned",
    meta: "Schedule Id : RS-001", subtext: "Assigned To Operator Team",
    timeAgo: "Yesterday 11:00 am", fullDateTime: "May 13, 2026 11:00 am",
    isRead: true, group: "Yesterday", priority: "Medium",
    shortDesc: "A rework schedule has been assigned to the Operator Team.",
    details: [
      { label: "Rework Schedule", value: "RS-001"                },
      { label: "Assigned To",     value: "Operator Team"         },
      { label: "Product",         value: "AIS 140"               },
      { label: "Date & Time",     value: "May 13, 2026 11:00 AM" },
      { label: "Created By",      value: "2547 : Basheer"        },
    ],
    description: "Rework schedule RS-001 for product AIS 140 has been assigned to the Operator Team. Please review the schedule and begin the rework process.",
  },
  {
    id: "N005", type: "system",
    title: "System Maintenance Alert",
    meta: "Scheduled Downtime", subtext: "System will be offline for 1 hour",
    timeAgo: "Yesterday 8:00 am", fullDateTime: "May 13, 2026 8:00 am",
    isRead: true, group: "Yesterday", priority: "Medium",
    shortDesc: "Planned system maintenance scheduled.",
    details: [
      { label: "Start Time",    value: "May 13, 2026 10:00 PM" },
      { label: "Duration",      value: "1 Hour"                },
      { label: "Affected Area", value: "All Modules"           },
      { label: "Notified By",   value: "System"                },
    ],
    description: "The system will undergo planned maintenance from 10:00 PM to 11:00 PM. All users will be logged out automatically. Please save your work beforehand.",
  },
]

/* ── Icon / color config ────────────────────────────────────────── */
const TYPE_CFG: Record<NotifType, { bg: string; icon: string; Icon: React.ComponentType<{ className?: string }> }> = {
  ticket:   { bg: "bg-rose-100 dark:bg-rose-950/40",     icon: "text-rose-500 dark:text-rose-400",     Icon: TicketIcon    },
  schedule: { bg: "bg-amber-100 dark:bg-amber-950/40",   icon: "text-amber-500 dark:text-amber-400",   Icon: CalendarClock },
  target:   { bg: "bg-green-100 dark:bg-green-950/40",   icon: "text-green-500 dark:text-green-400",   Icon: CheckCircle2  },
  rework:   { bg: "bg-purple-100 dark:bg-purple-950/40", icon: "text-purple-500 dark:text-purple-400", Icon: UserCheck     },
  system:   { bg: "bg-blue-100 dark:bg-blue-950/40",     icon: "text-blue-500 dark:text-blue-400",     Icon: Bell          },
}

const PRIORITY_STYLE: Record<NotifPriority, string> = {
  High:   "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  Medium: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  Low:    "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
}

/* ── Notification list item ─────────────────────────────────────── */
function NotifCard({ notif, selected, onClick }: { notif: NotifItem; selected: boolean; onClick: () => void }) {
  const cfg = TYPE_CFG[notif.type]
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
              <span className="text-xs text-muted-foreground whitespace-nowrap">{notif.timeAgo}</span>
              {!notif.isRead && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.meta}</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.subtext}</p>
        </div>
      </div>
    </button>
  )
}

/* ── Notification detail ────────────────────────────────────────── */
function NotifDetail({ notif, onBack }: { notif: NotifItem; onBack: () => void }) {
  const cfg = TYPE_CFG[notif.type]
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
            <button className="flex items-center gap-1.5 rounded-lg border border-blue-300 px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors shrink-0 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/30">
              <CheckCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mark as Resolved</span>
            </button>
          </div>
          {notif.priority && (
            <span className={cn("inline-block mt-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full", PRIORITY_STYLE[notif.priority])}>
              {notif.priority} Priority
            </span>
          )}
          <p className="text-xs text-muted-foreground mt-1.5">{notif.shortDesc}</p>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* Info table */}
        <div className="px-4 pt-3 pb-2">
          <table className="w-full text-sm border-collapse border border-border rounded-lg overflow-hidden">
            <tbody>
              {notif.details.map(({ label, value }) => (
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
          <p className="text-sm text-foreground leading-relaxed">{notif.description}</p>
        </div>
      </div>

      {/* Footer timestamp */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-t border-border bg-muted/30">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{notif.fullDateTime} ({notif.timeAgo})</span>
      </div>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────────── */
export function Notifications() {
  const [search,     setSearch]     = useState("")
  const [activeTab,  setActiveTab]  = useState<FilterTab>("All")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const counts = useMemo(() => ({
    all:    NOTIFICATIONS.length,
    unread: NOTIFICATIONS.filter(n => !n.isRead).length,
    read:   NOTIFICATIONS.filter(n => n.isRead).length,
  }), [])

  const filtered = useMemo(() => {
    let list = NOTIFICATIONS
    if (activeTab === "Unread") list = list.filter(n => !n.isRead)
    if (activeTab === "Read")   list = list.filter(n => n.isRead)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.meta.toLowerCase().includes(q) ||
        n.subtext.toLowerCase().includes(q)
      )
    }
    return list
  }, [search, activeTab])

  const selected = NOTIFICATIONS.find(n => n.id === selectedId) ?? null

  // Group filtered by "Today" / "Yesterday"
  const groups = useMemo(() => {
    const map = new Map<string, NotifItem[]>()
    for (const n of filtered) {
      const list = map.get(n.group) ?? []
      list.push(n)
      map.set(n.group, list)
    }
    return map
  }, [filtered])

  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: "All",    label: "All",    count: counts.all    },
    { key: "Unread", label: "Unread", count: counts.unread },
    { key: "Read",   label: "Read",   count: counts.read   },
  ]

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
          <div className="flex shrink-0">
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
            <button className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors shrink-0">
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </button>
          </div>

          {/* Grouped list */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-0.5">
            {groups.size === 0 ? (
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
                      key={notif.id}
                      notif={notif}
                      selected={selectedId === notif.id}
                      onClick={() => setSelectedId(notif.id)}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selected ? (
          <NotifDetail notif={selected} onBack={() => setSelectedId(null)} />
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 gap-3">
            <Bell className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">Select a notification to view details</p>
          </div>
        )}
      </div>
    </div>
  )
}
