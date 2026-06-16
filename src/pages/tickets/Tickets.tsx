import { useState, useMemo } from "react"
import {
  Search, SlidersHorizontal, Ticket as TicketIcon,
  ArrowLeft, MoreVertical, Download, Paperclip,
  CheckCircle2, UserPlus, X, FolderOpen, Clock, CheckCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Types ─────────────────────────────────────────────────────── */
type TicketStatus   = "Open" | "In Progress" | "Resolved"
type TicketPriority = "High" | "Medium" | "Low"
type FilterTab      = "All" | TicketStatus

interface Attachment { name: string; size: string }

interface TicketItem {
  id: string
  issueType: string
  department: string
  reportedBy: string
  priority: TicketPriority
  status: TicketStatus
  assignedTo: string
  createdOn: string
  lastUpdated: string
  description: string
  attachments: Attachment[]
  timeAgo: string
}

/* ── Mock Data ──────────────────────────────────────────────────── */
const TICKETS: TicketItem[] = [
  {
    id: "TK-1001", issueType: "Login Issue", department: "Production",
    reportedBy: "Surya", priority: "High", status: "In Progress",
    assignedTo: "Support Team",
    createdOn: "03-Jan-2026 10:45 AM", lastUpdated: "03-Jan-2026 10:45 AM",
    description: "Unable to login into the Production Management System.\nUser receives an authentication error while signing in.",
    attachments: [{ name: "Screenshot_001.png", size: "254 KB" }],
    timeAgo: "10 mins ago",
  },
  {
    id: "TK-1002", issueType: "Login Issue", department: "Admin",
    reportedBy: "Ashwin", priority: "Medium", status: "Open",
    assignedTo: "IT Support",
    createdOn: "03-Jan-2026 10:15 AM", lastUpdated: "03-Jan-2026 10:15 AM",
    description: "User unable to access admin dashboard after password reset.\nAccount appears locked after multiple failed attempts.",
    attachments: [],
    timeAgo: "30 mins ago",
  },
  {
    id: "TK-1003", issueType: "Login Issue", department: "Production",
    reportedBy: "Divya", priority: "Low", status: "Open",
    assignedTo: "Unassigned",
    createdOn: "03-Jan-2026 09:45 AM", lastUpdated: "03-Jan-2026 09:45 AM",
    description: "Intermittent login failures reported during peak hours.\nIssue appears related to session timeout settings.",
    attachments: [],
    timeAgo: "1 hour ago",
  },
  {
    id: "TK-1004", issueType: "Data Export Failure", department: "Finance",
    reportedBy: "Priya", priority: "High", status: "Open",
    assignedTo: "Dev Team",
    createdOn: "03-Jan-2026 09:00 AM", lastUpdated: "03-Jan-2026 09:30 AM",
    description: "Excel export fails for reports with more than 10,000 rows.\nTimeout error occurs after 30 seconds of processing.",
    attachments: [
      { name: "error_log.txt", size: "12 KB" },
      { name: "report_sample.xlsx", size: "1.2 MB" },
    ],
    timeAgo: "2 hours ago",
  },
  {
    id: "TK-1005", issueType: "UI Bug", department: "QA",
    reportedBy: "Kiran", priority: "Medium", status: "In Progress",
    assignedTo: "Frontend Team",
    createdOn: "02-Jan-2026 04:30 PM", lastUpdated: "03-Jan-2026 08:00 AM",
    description: "Dropdown menu overlaps table headers on screens below 768px.\nReproducible on all mobile devices tested.",
    attachments: [{ name: "mobile_screenshot.png", size: "89 KB" }],
    timeAgo: "Yesterday",
  },
  {
    id: "TK-1006", issueType: "Performance Issue", department: "Production",
    reportedBy: "Ravi", priority: "Low", status: "Resolved",
    assignedTo: "Backend Team",
    createdOn: "01-Jan-2026 02:00 PM", lastUpdated: "02-Jan-2026 11:00 AM",
    description: "Dashboard loading exceeded 8 seconds during peak hours.\nCaching improvements and query optimisation resolved the issue.",
    attachments: [],
    timeAgo: "2 days ago",
  },
]

/* ── Style configs ──────────────────────────────────────────────── */
const STATUS_STYLE: Record<TicketStatus, string> = {
  "Open":        "bg-rose-50 text-rose-600 border border-rose-200",
  "In Progress": "bg-blue-50 text-blue-600 border border-blue-200",
  "Resolved":    "bg-green-50 text-green-600 border border-green-200",
}

const PRIORITY_STYLE: Record<TicketPriority, string> = {
  High:   "bg-rose-100 text-rose-700",
  Medium: "bg-amber-100 text-amber-700",
  Low:    "bg-green-100 text-green-700",
}

const AVATAR_CFG: Record<TicketPriority, { bg: string; icon: string }> = {
  High:   { bg: "bg-rose-100",  icon: "text-rose-500"  },
  Medium: { bg: "bg-amber-100", icon: "text-amber-500" },
  Low:    { bg: "bg-green-100", icon: "text-green-500" },
}

/* ── Stat Card ──────────────────────────────────────────────────── */
function StatCard({
  label, count, icon, iconBg, borderColor, onClick,
}: {
  label: string; count: number; icon: React.ReactNode
  iconBg: string; borderColor: string; onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl border-2 bg-white p-4 text-left transition-all hover:shadow-md active:scale-[0.98]",
        borderColor
      )}
    >
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconBg)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 leading-tight">{label}</p>
        <p className="text-2xl font-bold text-gray-800 leading-tight">{count}</p>
      </div>
    </button>
  )
}

/* ── Ticket Card (list item) ────────────────────────────────────── */
function TicketCard({
  ticket, selected, onClick,
}: { ticket: TicketItem; selected: boolean; onClick: () => void }) {
  const av = AVATAR_CFG[ticket.priority]
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border p-3.5 transition-all",
        selected
          ? "border-blue-300 bg-blue-50 shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
      )}
    >
      <div className="flex gap-3">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", av.bg)}>
          <TicketIcon className={cn("h-5 w-5", av.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1.5 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="text-sm font-bold text-gray-800 shrink-0">{ticket.id}</span>
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0", PRIORITY_STYLE[ticket.priority])}>
                {ticket.priority}
              </span>
            </div>
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap", STATUS_STYLE[ticket.status])}>
              {ticket.status}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-700 mt-0.5 truncate">{ticket.issueType}</p>
          <div className="flex items-center justify-between mt-1 gap-2">
            <span className="text-xs text-gray-400 truncate">
              {ticket.reportedBy} · {ticket.department}
            </span>
            <span className="text-xs text-gray-400 shrink-0">{ticket.timeAgo}</span>
          </div>
        </div>
      </div>
    </button>
  )
}

/* ── Ticket Detail panel ────────────────────────────────────────── */
function TicketDetail({ ticket, onBack }: { ticket: TicketItem; onBack: () => void }) {
  const av = AVATAR_CFG[ticket.priority]

  const infoRows: Array<[string, React.ReactNode]> = [
    ["Ticket ID",    ticket.id],
    ["Issue Type",   ticket.issueType],
    ["Department",   ticket.department],
    ["Assigned To",  ticket.assignedTo],
    ["Status",       <span className={cn("inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full", STATUS_STYLE[ticket.status])}>{ticket.status}</span>],
    ["Created On",   ticket.createdOn],
    ["Last Updated", ticket.lastUpdated],
  ]

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
        <button
          onClick={onBack}
          className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", av.bg)}>
          <TicketIcon className={cn("h-4 w-4", av.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 leading-none">{ticket.id}</p>
          <span className={cn("inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1", PRIORITY_STYLE[ticket.priority])}>
            {ticket.priority} Priority
          </span>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg border border-blue-300 px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors shrink-0">
          <CheckCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Mark as Resolved</span>
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* Info table */}
        <div className="px-4 pt-3 pb-1">
          <table className="w-full text-sm border-collapse">
            <tbody>
              {infoRows.map(([label, value]) => (
                <tr key={label as string} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide w-28 align-middle whitespace-nowrap">
                    {label}
                  </td>
                  <td className="py-2.5 text-sm text-gray-800 align-middle">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Description */}
        <div className="px-4 py-3 border-t border-gray-50">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Description</h4>
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{ticket.description}</p>
        </div>

        {/* Attachments */}
        {ticket.attachments.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-50">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Attachments</h4>
            <div className="flex flex-col gap-2">
              {ticket.attachments.map((att) => (
                <div key={att.name} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-700 truncate">{att.name}</span>
                    <span className="text-xs text-gray-400 shrink-0">{att.size}</span>
                  </div>
                  <button className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-200 transition-colors">
                    <Download className="h-3.5 w-3.5 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="shrink-0 flex gap-2 p-3 border-t border-gray-100 bg-gray-50/60">
        <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-500 px-3 py-2 text-xs font-semibold text-white hover:bg-green-600 transition-colors">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Resolve Ticket
        </button>
        <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50 transition-colors">
          <UserPlus className="h-3.5 w-3.5" />
          Assign Ticket
        </button>
        <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors">
          <X className="h-3.5 w-3.5" />
          Close Ticket
        </button>
      </div>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────────── */
export function Tickets() {
  const [search,     setSearch]     = useState("")
  const [activeTab,  setActiveTab]  = useState<FilterTab>("All")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const counts = useMemo(() => ({
    all:        TICKETS.length,
    open:       TICKETS.filter(t => t.status === "Open").length,
    inProgress: TICKETS.filter(t => t.status === "In Progress").length,
    resolved:   TICKETS.filter(t => t.status === "Resolved").length,
  }), [])

  const filtered = useMemo(() => {
    let list = TICKETS
    if (activeTab !== "All") list = list.filter(t => t.status === activeTab)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.id.toLowerCase().includes(q) ||
        t.issueType.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q) ||
        t.reportedBy.toLowerCase().includes(q)
      )
    }
    return list
  }, [search, activeTab])

  const selected = TICKETS.find(t => t.id === selectedId) ?? null

  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: "All",         label: "All",        count: counts.all        },
    { key: "Open",        label: "Open",       count: counts.open       },
    { key: "In Progress", label: "In Progress",count: counts.inProgress },
    { key: "Resolved",    label: "Resolved",   count: counts.resolved   },
  ]

  return (
    <div className="flex flex-1 flex-col gap-4 min-h-0">
      {/* Stat cards — hidden on mobile when detail is open */}
      <div className={cn(
        "grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0",
        selectedId && "max-md:hidden"
      )}>
        <StatCard
          label="Total Tickets" count={counts.all}
          icon={<TicketIcon className="h-5 w-5 text-blue-500" />}
          iconBg="bg-blue-100" borderColor="border-blue-200"
          onClick={() => { setActiveTab("All"); setSelectedId(null) }}
        />
        <StatCard
          label="Open Tickets" count={counts.open}
          icon={<FolderOpen className="h-5 w-5 text-rose-500" />}
          iconBg="bg-rose-100" borderColor="border-rose-200"
          onClick={() => { setActiveTab("Open"); setSelectedId(null) }}
        />
        <StatCard
          label="In Progress" count={counts.inProgress}
          icon={<Clock className="h-5 w-5 text-amber-500" />}
          iconBg="bg-amber-100" borderColor="border-amber-200"
          onClick={() => { setActiveTab("In Progress"); setSelectedId(null) }}
        />
        <StatCard
          label="Resolved Tickets" count={counts.resolved}
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          iconBg="bg-green-100" borderColor="border-green-200"
          onClick={() => { setActiveTab("Resolved"); setSelectedId(null) }}
        />
      </div>

      {/* Main content */}
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
                    ? "text-blue-600 border-b-2 border-blue-500 -mb-px"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {label}
                <span className={cn("ml-1 text-xs", activeTab === key ? "text-blue-400" : "text-gray-400")}>
                  ({count})
                </span>
              </button>
            ))}
          </div>

          {/* Search + Filter */}
          <div className="flex gap-2 shrink-0">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search ID, type, department…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <button className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shrink-0">
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </button>
          </div>

          {/* Ticket list */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-0.5">
            {filtered.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
                <TicketIcon className="h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-400">No tickets found</p>
              </div>
            ) : (
              filtered.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  selected={selectedId === ticket.id}
                  onClick={() => setSelectedId(ticket.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selected ? (
          <TicketDetail ticket={selected} onBack={() => setSelectedId(null)} />
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/60 gap-3">
            <TicketIcon className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-400 font-medium">Select a ticket to view details</p>
          </div>
        )}
      </div>
    </div>
  )
}
