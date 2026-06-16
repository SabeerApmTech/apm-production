import { useState } from "react"
import { Box, Building2, BarChart2, Factory, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScheduleOption {
  id: string
  label: string
  scheduleDate: string
  targetDate: string
  projectedDate: string
  product: string
  company: string
  targetQty: number
  produced: number
  pending: number
  steps: StepRow[]
}

interface StepRow {
  step: string
  operation: string
  staffAssigned: number
  successfulQty: number
  rejectedQty: number
  progress: number
  barColor: string
  rowBg: string
}

const SCHEDULES: ScheduleOption[] = [
  {
    id: "S001",
    label: "S001 - AIS 140",
    scheduleDate:   "26/05/2026",
    targetDate:     "15/06/2026",
    projectedDate:  "20/06/2026",
    product:  "AIS 140",
    company:  "Lakshika",
    targetQty: 2000,
    produced:  1000,
    pending:   1000,
    steps: [
      { step: "Step 01", operation: "Preprocess",        staffAssigned: 4, successfulQty: 1000, rejectedQty:   10, progress: 50, barColor: "#22c55e", rowBg: "bg-white"      },
      { step: "Step 02", operation: "Firmware Flashing", staffAssigned: 8, successfulQty:  800, rejectedQty:    5, progress: 74, barColor: "#ef4444", rowBg: "bg-blue-50"    },
      { step: "Step 03", operation: "PCB Fix",           staffAssigned: 5, successfulQty: 1000, rejectedQty: 1000, progress: 55, barColor: "#a855f7", rowBg: "bg-red-50"     },
      { step: "Step 04", operation: "Master Box Packing",staffAssigned: 5, successfulQty: 1000, rejectedQty:  100, progress: 90, barColor: "#f97316", rowBg: "bg-amber-50"   },
    ],
  },
  {
    id: "S002",
    label: "S002 - CCTV Camera",
    scheduleDate:   "01/06/2026",
    targetDate:     "20/06/2026",
    projectedDate:  "22/06/2026",
    product:  "CCTV Camera",
    company:  "ABC Corp",
    targetQty: 1500,
    produced:   800,
    pending:    700,
    steps: [
      { step: "Step 01", operation: "Assembly",         staffAssigned: 6,  successfulQty: 800, rejectedQty: 20, progress: 53, barColor: "#22c55e", rowBg: "bg-white"    },
      { step: "Step 02", operation: "Lens Fitting",     staffAssigned: 4,  successfulQty: 600, rejectedQty:  8, progress: 40, barColor: "#ef4444", rowBg: "bg-blue-50"  },
      { step: "Step 03", operation: "Final QC",         staffAssigned: 3,  successfulQty: 400, rejectedQty: 30, progress: 27, barColor: "#a855f7", rowBg: "bg-red-50"   },
    ],
  },
]

interface StatMiniCard {
  label: string
  value: string | number
  icon: React.ReactNode
  iconBg: string
  borderColor: string
  textColor: string
}

function StatMiniCard({ label, value, icon, iconBg, borderColor, textColor }: StatMiniCard) {
  return (
    <div className={cn("flex shrink-0 min-w-32 items-center gap-3 rounded-xl border-2 bg-white px-4 py-3 shadow-sm sm:flex-1 sm:min-w-0", borderColor)}>
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", iconBg)}>
        {icon}
      </div>
      <div className="min-w-0 truncate">
        <p className="text-[11px] font-medium text-gray-500">{label}</p>
        <p className={cn("truncate text-sm font-bold", textColor)}>{value}</p>
      </div>
    </div>
  )
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-xs font-bold text-gray-700">{value}%</span>
    </div>
  )
}

export function ScheduleWiseLiveTracking() {
  const [selectedId, setSelectedId] = useState<string>(SCHEDULES[0].id)
  const schedule = SCHEDULES.find(s => s.id === selectedId) ?? SCHEDULES[0]

  return (
    <div className="flex flex-1 flex-col min-h-0">

      {/* Fixed top section */}
      <div className="shrink-0 flex flex-col gap-4 pb-4">
        {/* Schedule selector + date strip */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Select Schedule</label>
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="h-10 rounded-xl border-2 border-gray-200 bg-white px-3 pr-8 text-sm font-semibold text-gray-800 shadow-sm outline-none focus:border-blue-400 transition-colors"
            >
              {SCHEDULES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-1 items-stretch gap-0 overflow-hidden rounded-xl border-2 border-blue-200 bg-blue-50 sm:ml-3">
            <DateChip label="Schedule Date" value={schedule.scheduleDate} />
            <div className="w-px bg-blue-200" />
            <DateChip label="Target Date" value={schedule.targetDate} />
            <div className="w-px bg-blue-200" />
            <DateChip label="Projected Date" value={schedule.projectedDate} highlight />
          </div>
        </div>

        {/* Stat mini cards — horizontal scroll on mobile */}
        <div className="flex gap-3 overflow-x-auto pb-1 sm:overflow-visible">
          <StatMiniCard label="Product" value={schedule.product}
            icon={<Box className="h-4.5 w-4.5 text-blue-600" />}
            iconBg="bg-blue-100" borderColor="border-blue-200" textColor="text-blue-700" />
          <StatMiniCard label="Company" value={schedule.company}
            icon={<Building2 className="h-4.5 w-4.5 text-purple-600" />}
            iconBg="bg-purple-100" borderColor="border-purple-200" textColor="text-purple-700" />
          <StatMiniCard label="Target Qty" value={schedule.targetQty.toLocaleString()}
            icon={<BarChart2 className="h-4.5 w-4.5 text-green-600" />}
            iconBg="bg-green-100" borderColor="border-green-200" textColor="text-green-700" />
          <StatMiniCard label="Produced" value={schedule.produced.toLocaleString()}
            icon={<Factory className="h-4.5 w-4.5 text-amber-600" />}
            iconBg="bg-amber-100" borderColor="border-amber-200" textColor="text-amber-700" />
          <StatMiniCard label="Pending" value={schedule.pending.toLocaleString()}
            icon={<Clock className="h-4.5 w-4.5 text-red-600" />}
            iconBg="bg-red-100" borderColor="border-red-200" textColor="text-red-700" />
        </div>
      </div>

      {/* Step table — scrolls both axes */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
          <div className="min-w-150">
            {/* Header */}
            <div className="grid grid-cols-[80px_1fr_100px_110px_100px_1fr] items-center gap-3 border-b border-gray-200 bg-[#27375D] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white">
              <span>Step</span>
              <span>Operation</span>
              <span className="text-center">Staff Assigned</span>
              <span className="text-center">Successful Qty</span>
              <span className="text-center">Rejected Qty</span>
              <span>Progress Bar</span>
            </div>
            {schedule.steps.map((row, i) => (
              <div
                key={i}
                className={cn(
                  "grid grid-cols-[80px_1fr_100px_110px_100px_1fr] items-center gap-3 px-4 py-3.5 text-sm",
                  row.rowBg,
                  i < schedule.steps.length - 1 && "border-b border-gray-100",
                )}
              >
                <span
                  className="w-fit rounded-full px-2.5 py-1 text-xs font-bold text-white"
                  style={{ backgroundColor: row.barColor }}
                >
                  {row.step}
                </span>
                <span className="font-medium text-gray-800">{row.operation}</span>
                <span className="text-center font-semibold text-gray-700">{row.staffAssigned}</span>
                <span className="text-center font-semibold text-gray-700">{row.successfulQty.toLocaleString()}</span>
                <span className="text-center font-semibold text-gray-700">{row.rejectedQty.toLocaleString()}</span>
                <ProgressBar value={row.progress} color={row.barColor} />
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}

function DateChip({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("flex flex-1 flex-col items-center justify-center py-2.5 px-3", highlight && "bg-blue-100")}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500">{label}</p>
      <p className={cn("text-sm font-bold", highlight ? "text-blue-700" : "text-blue-800")}>{value}</p>
    </div>
  )
}
