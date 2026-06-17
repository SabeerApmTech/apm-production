import { Eye } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { EmployeeRecord, EmployeeStatus } from "./types"

const STATUS_CFG: Record<EmployeeStatus, { dot: string; text: string }> = {
  Running:       { dot: "bg-green-500", text: "text-green-600" },
  Paused:        { dot: "bg-amber-500", text: "text-amber-600" },
  Stopped:       { dot: "bg-red-500",   text: "text-red-500"   },
  "Not Started": { dot: "bg-gray-400",  text: "text-gray-500"  },
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct >= 90 ? "bg-green-500" : pct >= 50 ? "bg-blue-500" : pct > 0 ? "bg-amber-500" : "bg-gray-300"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 text-[10px] font-semibold text-gray-500">{pct}%</span>
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 shrink-0 text-gray-500">{label}</span>
      <span className="text-gray-400">-</span>
      {children}
    </div>
  )
}

interface Props {
  emp: EmployeeRecord
  onViewDetail: (emp: EmployeeRecord) => void
}

export function EmployeeCard({ emp, onViewDetail }: Props) {
  const cfg = STATUS_CFG[emp.status]

  return (
    <div className="flex flex-col rounded-2xl border border-amber-200 bg-amber-50/40 shadow-sm overflow-hidden">
      <div className="flex flex-col gap-1.5 p-4">
        <Row label="Employee Name">
          <span className="font-semibold text-gray-800">{emp.name}</span>
        </Row>
        <Row label="Employee ID">
          <span className="font-medium text-gray-700">{emp.employeeId}</span>
        </Row>
        <Row label="Schedule ID">
          <span className="font-medium text-gray-700">{emp.scheduleId}</span>
        </Row>
        <Row label="Company">
          <span className="font-semibold text-gray-800">{emp.company}</span>
        </Row>
        <Row label="Product">
          <span className="font-semibold text-gray-800">{emp.product}</span>
        </Row>
        <Row label="Step">
          <span className="font-semibold text-gray-800">{emp.step}</span>
        </Row>
        <Row label="Target Qty">
          <span className="font-medium text-gray-700">{emp.targetQty.toLocaleString()}</span>
        </Row>
        <Row label="Progress">
          <div className="flex-1">
            <ProgressBar value={emp.producedQty} max={emp.targetQty} />
          </div>
        </Row>
        <Row label="Status">
          <span className={cn("flex items-center gap-1.5 font-semibold", cfg.text)}>
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
            {emp.status}
          </span>
        </Row>
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={() => onViewDetail(emp)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 py-2 text-xs font-semibold text-white transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          View Detail
        </button>
      </div>
    </div>
  )
}
