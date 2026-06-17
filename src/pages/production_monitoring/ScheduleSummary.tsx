import type { Schedule } from "./types"

export function ScheduleSummary({ schedule }: { schedule: Schedule }) {
  const cols: [string, string | number][] = [
    ["Priority No",   schedule.priorityNo],
    ["Schedule ID",   schedule.id],
    ["Schedule Date", schedule.scheduleDate],
    ["Company",       schedule.company],
    ["Product",       schedule.product],
    ["Target Date",   schedule.targetDate],
    ["Target Qty",    schedule.targetQty],
  ]

  return (
    <div className="rounded-xl border border-gray-200 overflow-x-auto mb-5">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {cols.map(([k]) => (
              <th key={k} className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap">{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {cols.map(([k, v]) => (
              <td key={k} className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{v}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
