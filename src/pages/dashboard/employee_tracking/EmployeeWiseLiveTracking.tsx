import { Users, XCircle, PlayCircle, PauseCircle, StopCircle, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

type EmployeeStatus = "Running" | "Paused" | "Stopped" | "Not Started"

interface EmployeeRecord {
  id: string
  name: string
  employeeId: string
  scheduleId: string
  company: string
  product: string
  step: string
  targetQty: number
  producedQty: number
  status: EmployeeStatus
}

const STATUS_CFG: Record<EmployeeStatus, { dot: string; text: string; badge: string }> = {
  Running:       { dot: "bg-green-500",  text: "text-green-700",  badge: "bg-green-50 border-green-200"  },
  Paused:        { dot: "bg-amber-500",  text: "text-amber-700",  badge: "bg-amber-50 border-amber-200"  },
  Stopped:       { dot: "bg-red-500",    text: "text-red-700",    badge: "bg-red-50 border-red-200"      },
  "Not Started": { dot: "bg-gray-400",   text: "text-gray-600",   badge: "bg-gray-50 border-gray-200"   },
}

const MOCK_EMPLOYEES: EmployeeRecord[] = [
  { id: "1", name: "Ashwin",   employeeId: "1736", scheduleId: "AMP0023", company: "Lakshika",  product: "CCTV",    step: "Preprocessing",    targetQty: 1000, producedQty: 650,  status: "Running"     },
  { id: "2", name: "Naveen",   employeeId: "0987", scheduleId: "AMP0024", company: "Kingstrack",product: "AIS 140", step: "Firmware Flashing", targetQty: 2000, producedQty: 1480, status: "Running"     },
  { id: "3", name: "Ravi",     employeeId: "1045", scheduleId: "AMP0023", company: "Lakshika",  product: "CCTV",    step: "Battery Fixing",    targetQty: 1000, producedQty: 0,    status: "Not Started" },
  { id: "4", name: "Suresh",   employeeId: "1102", scheduleId: "AMP0025", company: "ABC Corp",  product: "Dashcam", step: "Final QC",          targetQty: 1500, producedQty: 900,  status: "Paused"      },
  { id: "5", name: "Priya",    employeeId: "1203", scheduleId: "AMP0024", company: "Kingstrack",product: "AIS 140", step: "Preprocessing",     targetQty: 2000, producedQty: 1200, status: "Running"     },
  { id: "6", name: "Divya",    employeeId: "1305", scheduleId: "AMP0025", company: "ABC Corp",  product: "Dashcam", step: "Battery Fixing",    targetQty: 1500, producedQty: 420,  status: "Stopped"     },
  { id: "7", name: "Karthik",  employeeId: "1412", scheduleId: "AMP0026", company: "Lakshika",  product: "GPS Unit",step: "PCB Fix",           targetQty: 800,  producedQty: 610,  status: "Running"     },
  { id: "8", name: "Meena",    employeeId: "1519", scheduleId: "AMP0026", company: "Lakshika",  product: "GPS Unit",step: "Final QC",          targetQty: 800,  producedQty: 580,  status: "Running"     },
  { id: "9", name: "Arjun",    employeeId: "1623", scheduleId: "AMP0027", company: "ABC Corp",  product: "Tracker", step: "Preprocessing",    targetQty: 500,  producedQty: 320,  status: "Paused"      },
]

interface StatCardProps {
  label: string
  count: number
  icon: React.ReactNode
  iconBg: string
  borderColor: string
  textColor: string
}

function StatCard({ label, count, icon, iconBg, borderColor, textColor }: StatCardProps) {
  return (
    <div className={cn("flex min-w-36 shrink-0 items-center gap-3 rounded-xl border-2 bg-white p-4 shadow-sm sm:min-w-0 sm:shrink", borderColor)}>
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconBg)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={cn("text-2xl font-bold leading-none", textColor)}>{count}</p>
        <p className="mt-1 text-xs font-medium text-gray-500 leading-tight">{label}</p>
      </div>
    </div>
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

function EmployeeCard({ emp }: { emp: EmployeeRecord }) {
  const cfg = STATUS_CFG[emp.status]
  return (
    <div className="flex flex-col gap-0 overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/60 px-4 py-3">
        <div>
          <p className="text-sm font-bold text-gray-900">{emp.name}</p>
          <p className="text-xs text-gray-500">ID: {emp.employeeId}</p>
        </div>
        <span className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", cfg.badge, cfg.text)}>
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", cfg.dot)} />
          {emp.status}
        </span>
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-2 px-4 py-3">
        <Row label="Schedule ID" value={emp.scheduleId} />
        <Row label="Company"     value={emp.company} />
        <Row label="Product"     value={emp.product} />
        <Row label="Step">
          <span className="text-xs font-semibold text-blue-600">{emp.step}</span>
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
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-600 active:bg-red-700">
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
  const counts = {
    total:      MOCK_EMPLOYEES.length,
    notStarted: MOCK_EMPLOYEES.filter(e => e.status === "Not Started").length,
    running:    MOCK_EMPLOYEES.filter(e => e.status === "Running").length,
    paused:     MOCK_EMPLOYEES.filter(e => e.status === "Paused").length,
    stopped:    MOCK_EMPLOYEES.filter(e => e.status === "Stopped").length,
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Stat cards — sticky, never scrolls; horizontal scroll on mobile */}
      <div className="shrink-0 pb-4">
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

      {/* Live History heading — fixed */}
      <h2 className="shrink-0 pb-3 text-sm font-bold text-gray-800">Live History</h2>

      {/* Cards — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {MOCK_EMPLOYEES.map(emp => (
            <EmployeeCard key={emp.id} emp={emp} />
          ))}
        </div>
      </div>
    </div>
  )
}
