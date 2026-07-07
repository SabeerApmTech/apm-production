import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Users, XCircle, PlayCircle, PauseCircle, StopCircle, Eye, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EmployeeTrackingRow, EmployeeTrackingStatus } from "@/types/dashboard"
import {
  useGetEmployeeLiveTrackingQuery,
  useGetEmployeeLiveTrackingByStatusQuery,
} from "@/store/services/dashboardApi"

const POLL_INTERVAL_MS = 15000

const STATUS_CFG: Record<string, { label: string; dot: string; text: string; badge: string }> = {
  RUNNING:    { label: "Running",     dot: "bg-green-500", text: "text-green-700", badge: "bg-green-50 border-green-200" },
  PAUSED:     { label: "Paused",      dot: "bg-amber-500", text: "text-amber-700", badge: "bg-amber-50 border-amber-200" },
  STOPPED:    { label: "Stopped",     dot: "bg-red-500",   text: "text-red-700",   badge: "bg-red-50 border-red-200"     },
  NOTSTARTED: { label: "Not Started", dot: "bg-gray-400",  text: "text-gray-600",  badge: "bg-gray-50 border-gray-200"   },
}

interface StatCardProps {
  label: string
  count: number
  icon: React.ReactNode
  iconBg: string
  borderColor: string
  textColor: string
  active?: boolean
  onClick?: () => void
}

function StatCard({ label, count, icon, iconBg, borderColor, textColor, active, onClick }: StatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-36 shrink-0 items-center gap-3 rounded-xl border-2 bg-white p-4 text-left shadow-sm transition-all sm:min-w-0 sm:shrink",
        borderColor,
        active && "ring-2 ring-offset-1 ring-blue-400"
      )}
    >
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconBg)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={cn("text-2xl font-bold leading-none", textColor)}>{count}</p>
        <p className="mt-1 text-xs font-medium text-gray-500 leading-tight">{label}</p>
      </div>
    </button>
  )
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct >= 90 ? "bg-green-500" : pct >= 50 ? "bg-blue-500" : pct > 0 ? "bg-amber-500" : "bg-gray-300",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-xs font-semibold text-gray-600">{pct}%</span>
    </div>
  )
}

function EmployeeCard({ emp, onViewDetail }: { emp: EmployeeTrackingRow; onViewDetail: () => void }) {
  const cfg = STATUS_CFG[emp.status] ?? STATUS_CFG.NOTSTARTED
  return (
    <div className="flex flex-col gap-0 overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/60 px-4 py-3">
        <div>
          <p className="text-sm font-bold text-gray-900">{emp.employeeName}</p>
          <p className="text-xs text-gray-500">ID: {emp.employeeId}</p>
        </div>
        <span className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", cfg.badge, cfg.text)}>
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", cfg.dot)} />
          {cfg.label}
        </span>
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-2 px-4 py-3">
        <Row label="Schedule ID" value={emp.scheduleId} />
        <Row label="Company"     value={emp.companyName} />
        <Row label="Product"     value={emp.productName} />
        <Row label="Step">
          <span className="text-xs font-semibold text-blue-600">{emp.operationName}</span>
        </Row>
        <Row label="Target Qty"  value={emp.targetQty.toLocaleString()} />
        <Row label="Produced Qty">
          <div className="w-36">
            <ProgressBar value={emp.producedQty} max={emp.targetQty} />
            <p className="mt-0.5 text-right text-[10px] text-gray-500">
              {emp.producedQty.toLocaleString()} / {emp.targetQty.toLocaleString()}
            </p>
          </div>
        </Row>
      </div>

      {/* View Detail */}
      <div className="px-4 pb-4">
        <button
          onClick={onViewDetail}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-600 active:bg-red-700"
        >
          <Eye className="h-3.5 w-3.5" />
          View Detail
        </button>
      </div>
    </div>
  )
}

function Row({ label, value, children }: { label: string; value?: string | number; children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-24 shrink-0 text-xs text-gray-500">{label}</span>
      <span className="text-xs font-medium text-gray-400">-</span>
      {children ?? <span className="flex-1 text-xs font-semibold text-gray-800">{value}</span>}
    </div>
  )
}

export function EmployeeWiseLiveTracking() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<EmployeeTrackingStatus | null>(null)

  const { data: overview, isLoading: isOverviewLoading } = useGetEmployeeLiveTrackingQuery(undefined, {
    pollingInterval: POLL_INTERVAL_MS,
  })
  const { data: filteredEmployees, isLoading: isFilteredLoading } = useGetEmployeeLiveTrackingByStatusQuery(
    statusFilter as EmployeeTrackingStatus,
    { skip: !statusFilter, pollingInterval: POLL_INTERVAL_MS }
  )

  const summary = overview?.summary
  const employees = statusFilter ? (filteredEmployees ?? []) : (overview?.employees ?? [])
  const isLoading = statusFilter ? isFilteredLoading : isOverviewLoading

  const toggleFilter = (status: EmployeeTrackingStatus) => {
    setStatusFilter((prev) => (prev === status ? null : status))
  }

  const viewDetail = (scheduleId: string) => {
    navigate(`/dashboard/schedule-wise-tracking?scheduleId=${encodeURIComponent(scheduleId)}`)
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Stat cards — sticky, never scrolls; horizontal scroll on mobile */}
      <div className="shrink-0 pb-4">
        <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-5">
          <StatCard
            label="Total Employees" count={summary?.totalEmployees ?? 0}
            icon={<Users className="h-5 w-5 text-blue-600" />}
            iconBg="bg-blue-100" borderColor="border-blue-200" textColor="text-blue-700"
            active={statusFilter === null}
            onClick={() => setStatusFilter(null)}
          />
          <StatCard
            label="Not Started" count={summary?.notStarted ?? 0}
            icon={<XCircle className="h-5 w-5 text-purple-600" />}
            iconBg="bg-purple-100" borderColor="border-purple-200" textColor="text-purple-700"
            active={statusFilter === "NOTSTARTED"}
            onClick={() => toggleFilter("NOTSTARTED")}
          />
          <StatCard
            label="Running" count={summary?.running ?? 0}
            icon={<PlayCircle className="h-5 w-5 text-green-600" />}
            iconBg="bg-green-100" borderColor="border-green-200" textColor="text-green-700"
            active={statusFilter === "RUNNING"}
            onClick={() => toggleFilter("RUNNING")}
          />
          <StatCard
            label="Paused" count={summary?.paused ?? 0}
            icon={<PauseCircle className="h-5 w-5 text-amber-600" />}
            iconBg="bg-amber-100" borderColor="border-amber-200" textColor="text-amber-700"
            active={statusFilter === "PAUSED"}
            onClick={() => toggleFilter("PAUSED")}
          />
          <StatCard
            label="Stopped" count={summary?.stopped ?? 0}
            icon={<StopCircle className="h-5 w-5 text-red-600" />}
            iconBg="bg-red-100" borderColor="border-red-200" textColor="text-red-700"
            active={statusFilter === "STOPPED"}
            onClick={() => toggleFilter("STOPPED")}
          />
        </div>
      </div>

      {/* Live History heading — fixed */}
      <h2 className="shrink-0 pb-3 text-sm font-bold text-gray-800">Live History</h2>

      {/* Cards — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading employees…
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {employees.map((emp) => (
              <EmployeeCard key={emp.employeeId} emp={emp} onViewDetail={() => viewDetail(emp.scheduleId)} />
            ))}
            {employees.length === 0 && (
              <p className="col-span-full py-12 text-center text-sm text-gray-400">No employees found</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
