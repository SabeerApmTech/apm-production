import { Button } from "@/components/ui/button"
import { SCHEDULE_OPERATIONS } from "./data"
import { ScheduleSummary } from "./ScheduleSummary"
import type { Operation, Schedule } from "./types"

interface Props {
  schedule: Schedule
  onSelect: (operation: Operation) => void
}

export function OperationCards({ schedule, onSelect }: Props) {
  return (
    <div>
      <ScheduleSummary schedule={schedule} />
      <div className="overflow-y-auto max-h-[calc(100vh-18rem)] pr-0.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SCHEDULE_OPERATIONS.map(op => (
            <div key={op.step} className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-blue-200">
                <span className="text-xs font-medium text-gray-500">Step {op.step}</span>
                <span className="text-xs font-semibold text-[#1e3a5f]">{op.name}</span>
              </div>
              <dl className="space-y-1.5">
                {([
                  ["Target Qty",   op.targetQty],
                  ["Produced Qty", op.producedQty],
                  ["Pending Qty",  op.pendingQty],
                  ["Reject Qty",   op.rejectQty],
                ] as [string, number][]).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 text-xs">
                    <dt className="w-24 shrink-0 text-gray-500">{k}</dt>
                    <span className="text-gray-400">:</span>
                    <dd className="font-medium text-gray-700">{v}</dd>
                  </div>
                ))}
              </dl>
              <Button
                onClick={() => onSelect(op)}
                className="mt-4 w-full h-8 text-xs bg-amber-400 hover:bg-amber-500 text-white"
              >
                Select
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
