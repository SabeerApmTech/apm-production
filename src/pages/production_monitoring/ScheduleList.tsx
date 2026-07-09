import { Button } from "@/components/ui/button"
import { pad2 } from "./data"
import type { Schedule } from "./types"

interface Props {
  title: string
  schedules: Schedule[]
  onSelect: (schedule: Schedule) => void
}

export function ScheduleList({ title, schedules, onSelect }: Props) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <span className="text-xs font-semibold text-blue-500">
          Total Allotted Schedule : {pad2(schedules.length)}
        </span>
      </div>

      {schedules.length === 0 && (
        <p className="text-sm text-gray-400">No schedules found.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {schedules.map(s => (
          <div key={s.pendingScheduleId} className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-blue-200">
              <span className="text-xs font-medium text-gray-500">Priority No</span>
              <span className="text-xs font-bold text-gray-800">{pad2(s.priorityNo)}</span>
            </div>
            <dl className="space-y-1.5">
              {([
                ["Schedule ID",   s.scheduleId],
                ["Schedule Date", s.scheduleDate],
                ["Company",       s.companyName],
                ["Product",       s.productName],
                ["Target Date",   s.targetDate],
                ["Target Qty",    s.targetQty],
              ] as [string, string | number][]).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 text-xs">
                  <dt className="w-28 shrink-0 text-gray-500">{k}</dt>
                  <span className="text-gray-400">:</span>
                  <dd className="font-medium text-gray-700">{v}</dd>
                </div>
              ))}
            </dl>
            <Button
              onClick={() => onSelect(s)}
              className="mt-4 w-full h-8 text-xs bg-blue-500 hover:bg-blue-600 text-white"
            >
              View Allotted Operations
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
