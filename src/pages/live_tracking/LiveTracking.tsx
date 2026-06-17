import { useState } from "react"
import { Users, XCircle, PlayCircle, PauseCircle, StopCircle } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { MOCK_EMPLOYEES } from "./data"
import { EmployeeCard } from "./EmployeeCard"
import { DetailView } from "./DetailView"
import type { EmployeeRecord } from "./types"

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  count: number
  icon: ReactNode
  iconBg: string
  borderColor: string
  textColor: string
}

function StatCard({ label, count, icon, iconBg, borderColor, textColor }: StatCardProps) {
  return (
    <div className={cn("flex min-w-36 shrink-0 items-center gap-3 rounded-xl border-2 bg-white p-3.5 shadow-sm sm:min-w-0 sm:shrink", borderColor)}>
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", iconBg)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={cn("text-xl font-bold leading-none", textColor)}>{count}</p>
        <p className="mt-1 text-[11px] font-medium text-gray-500 leading-tight">{label}</p>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export const LiveTracking = () => {
  const [selected, setSelected] = useState<EmployeeRecord | null>(null)

  const counts = {
    total:      MOCK_EMPLOYEES.length,
    notStarted: MOCK_EMPLOYEES.filter(e => e.status === "Not Started").length,
    running:    MOCK_EMPLOYEES.filter(e => e.status === "Running").length,
    paused:     MOCK_EMPLOYEES.filter(e => e.status === "Paused").length,
    stopped:    MOCK_EMPLOYEES.filter(e => e.status === "Stopped").length,
  }

  if (selected) {
    return <DetailView employee={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div>
      {/* Stat cards */}
      <div className="mb-4">
        <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-5">
          <StatCard
            label="Total Employees" count={counts.total}
            icon={<Users className="h-5 w-5 text-blue-600" />}
            iconBg="bg-blue-100" borderColor="border-blue-200" textColor="text-blue-700"
          />
          <StatCard
            label="Not Started" count={counts.notStarted}
            icon={<XCircle className="h-5 w-5 text-purple-600" />}
            iconBg="bg-purple-100" borderColor="border-purple-200" textColor="text-purple-700"
          />
          <StatCard
            label="Running" count={counts.running}
            icon={<PlayCircle className="h-5 w-5 text-green-600" />}
            iconBg="bg-green-100" borderColor="border-green-200" textColor="text-green-700"
          />
          <StatCard
            label="Paused" count={counts.paused}
            icon={<PauseCircle className="h-5 w-5 text-amber-600" />}
            iconBg="bg-amber-100" borderColor="border-amber-200" textColor="text-amber-700"
          />
          <StatCard
            label="Stopped" count={counts.stopped}
            icon={<StopCircle className="h-5 w-5 text-red-600" />}
            iconBg="bg-red-100" borderColor="border-red-200" textColor="text-red-700"
          />
        </div>
      </div>

      {/* Heading */}
      <h2 className="mb-3 text-sm font-bold text-gray-800">Live Tracking</h2>

      {/* Employee cards — scrollable */}
      <div className="overflow-y-auto max-h-[calc(100vh-17rem)] pr-0.5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {MOCK_EMPLOYEES.map(emp => (
            <EmployeeCard key={emp.id} emp={emp} onViewDetail={setSelected} />
          ))}
        </div>
      </div>
    </div>
  )
}
