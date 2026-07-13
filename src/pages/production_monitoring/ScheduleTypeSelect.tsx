import productionSchedulesImg from "@/assets/production_schedules.png"
// import reworkSchedulesImg from "@/assets/rework_schedules.png"
import type { ScheduleType } from "./types"

const TYPES: { type: ScheduleType; label: string; img: string }[] = [
  { type: "production", label: "Production Schedules", img: productionSchedulesImg },
  // { type: "rework",     label: "Rework Schedules",     img: reworkSchedulesImg     },
]

interface Props {
  onSelect: (type: ScheduleType) => void
}

export function ScheduleTypeSelect({ onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 max-w-xs">
      {TYPES.map(({ type, label, img }) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className="flex flex-col items-center gap-3 p-5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-colors text-center group"
        >
          <img src={img} alt={label} className="h-14 w-auto object-contain" />
          <span className="text-xs font-semibold text-[#1e3a5f] group-hover:text-blue-700 transition-colors">
            {label}
          </span>
        </button>
      ))}
    </div>
  )
}
