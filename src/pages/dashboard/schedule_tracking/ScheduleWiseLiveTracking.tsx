import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Box, Building2, BarChart2, Factory, Clock, TrendingUp, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { fromIsoDate } from "@/utils/date"
import { useGetPendingSchedulesQuery } from "@/store/services/pendingScheduleApi"
import { useGetScheduleLiveTrackingQuery } from "@/store/services/dashboardApi"

const POLL_INTERVAL_MS = 15000

const STEP_COLORS = [
  { bar: "#22c55e", rowBg: "bg-white" },
  { bar: "#ef4444", rowBg: "bg-blue-50" },
  { bar: "#a855f7", rowBg: "bg-red-50" },
  { bar: "#f97316", rowBg: "bg-amber-50" },
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
    <div className={cn("flex shrink-0 min-w-32 items-center gap-2 rounded-xl border-2 bg-white px-2.5 py-2.5 shadow-sm sm:flex-1 sm:min-w-0", borderColor)}>
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", iconBg)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="whitespace-nowrap text-[11px] font-medium text-gray-500">{label}</p>
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
  const [searchParams] = useSearchParams()
  const [selectedScheduleId, setSelectedScheduleId] = useState(() => searchParams.get("scheduleId") ?? "")

  const { data: schedules } = useGetPendingSchedulesQuery()
  const scheduleOptions = schedules ?? []
  const effectiveScheduleId = selectedScheduleId || scheduleOptions[0]?.scheduleId || ""

  const { data: tracking, isLoading } = useGetScheduleLiveTrackingQuery(effectiveScheduleId, {
    skip: !effectiveScheduleId,
    pollingInterval: POLL_INTERVAL_MS,
  })

  const header = tracking?.header
  const operations = tracking?.operations ?? []

  return (
    <div className="flex flex-1 flex-col min-h-0">

      {/* Fixed top section */}
      <div className="shrink-0 flex flex-col gap-4 pb-4">
        {/* Schedule selector + date strip */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Select Schedule</label>
            <select
              value={effectiveScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
              className="h-10 rounded-xl border-2 border-gray-200 bg-white px-3 pr-8 text-sm font-semibold text-gray-800 shadow-sm outline-none focus:border-blue-400 transition-colors"
            >
              {scheduleOptions.map((s) => (
                <option key={s.scheduleId} value={s.scheduleId}>
                  {s.scheduleId} - {s.productName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-1 items-stretch gap-0 overflow-hidden rounded-xl border-2 border-blue-200 bg-blue-50 sm:ml-3">
            <DateChip label="Schedule Date" value={header ? fromIsoDate(header.scheduleDate) : "-"} />
            <div className="w-px bg-blue-200" />
            <DateChip label="Target Date" value={header ? fromIsoDate(header.targetDate) : "-"} />
            <div className="w-px bg-blue-200" />
            <DateChip
              label="Projected Date"
              value={header?.projectedDate ? fromIsoDate(header.projectedDate) : "TBD"}
              highlight
            />
          </div>
        </div>

        {/* Stat mini cards — horizontal scroll on mobile */}
        <div className="flex gap-3 overflow-x-auto pb-1 sm:overflow-visible">
          <StatMiniCard label="Product" value={header?.productName ?? "-"}
            icon={<Box className="h-4.5 w-4.5 text-blue-600" />}
            iconBg="bg-blue-100" borderColor="border-blue-200" textColor="text-blue-700" />
          <StatMiniCard label="Company" value={header?.companyName ?? "-"}
            icon={<Building2 className="h-4.5 w-4.5 text-purple-600" />}
            iconBg="bg-purple-100" borderColor="border-purple-200" textColor="text-purple-700" />
          <StatMiniCard label="Target Qty" value={(header?.targetQty ?? 0).toLocaleString()}
            icon={<BarChart2 className="h-4.5 w-4.5 text-green-600" />}
            iconBg="bg-green-100" borderColor="border-green-200" textColor="text-green-700" />
          <StatMiniCard label="Produced" value={(header?.producedQty ?? 0).toLocaleString()}
            icon={<Factory className="h-4.5 w-4.5 text-amber-600" />}
            iconBg="bg-amber-100" borderColor="border-amber-200" textColor="text-amber-700" />
          <StatMiniCard label="Pending" value={(header?.pendingQty ?? 0).toLocaleString()}
            icon={<Clock className="h-4.5 w-4.5 text-red-600" />}
            iconBg="bg-red-100" borderColor="border-red-200" textColor="text-red-700" />
          <StatMiniCard label="Avg Output/Day" value={(header?.averageOutputPerDay ?? 0).toLocaleString()}
            icon={<TrendingUp className="h-4.5 w-4.5 text-indigo-600" />}
            iconBg="bg-indigo-100" borderColor="border-indigo-200" textColor="text-indigo-700" />
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
            {operations.map((row, i) => {
              const { bar, rowBg } = STEP_COLORS[i % STEP_COLORS.length]
              return (
                <div
                  key={row.sequenceNo}
                  className={cn(
                    "grid grid-cols-[80px_1fr_100px_110px_100px_1fr] items-center gap-3 px-4 py-3.5 text-sm",
                    rowBg,
                    i < operations.length - 1 && "border-b border-gray-100",
                  )}
                >
                  <span
                    className="w-fit rounded-full px-2.5 py-1 text-xs font-bold text-white"
                    style={{ backgroundColor: bar }}
                  >
                    Step {row.sequenceNo}
                  </span>
                  <span className="font-medium text-gray-800">{row.operationName}</span>
                  <span className="text-center font-semibold text-gray-700">{row.staffAssigned}</span>
                  <span className="text-center font-semibold text-gray-700">{row.successfulQty.toLocaleString()}</span>
                  <span className="text-center font-semibold text-gray-700">{row.rejectedQty.toLocaleString()}</span>
                  <ProgressBar value={row.progressPercentage} color={bar} />
                </div>
              )
            })}
            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading operations…
              </div>
            )}
            {!isLoading && operations.length === 0 && (
              <p className="py-12 text-center text-sm text-gray-400">No operations found for this schedule</p>
            )}
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
