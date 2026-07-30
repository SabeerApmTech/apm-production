import type { Schedule } from "./types"

export function ScheduleSummary({ schedule }: { schedule: Schedule }) {
  const cols: [string, string | number][] = [
    ["Priority No",   schedule.priorityNo],
    ["Schedule ID",   schedule.scheduleId],
    ["Schedule Date", schedule.scheduleDate],
    ["Company",       `${schedule.companyName} - ${schedule.companyLocation}`],
    ["Delivery Location", schedule.deliveryLocation],
    ["Product",       schedule.productName],
    ["Target Date",   schedule.targetDate],
    ["Target Qty",    schedule.targetQty],
  ]

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {cols.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{k}</dt>
            <dd className="wrap-break-word text-sm font-semibold text-gray-800">{v}</dd>
          </div>
        ))}
      </div>
    </div>
  )
}
