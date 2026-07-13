import * as React from "react"
import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { dateToIso, getTodayIso, getYesterdayIso, getWeekStartIso, getMonthStartIso, getMonthEndIso, getYearStartIso } from "@/utils/date"

type PresetKey = "today" | "yesterday" | "weekly" | "monthly" | "yearly"

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

function parseIso(value: string): Date | undefined {
  if (!value) return undefined
  const d = new Date(value + "T00:00:00")
  return isNaN(d.getTime()) ? undefined : d
}

function formatDisplay(value: string): string {
  const date = parseIso(value)
  if (!date) return "—"
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
}

/** Sunday-to-Saturday span containing `date`. */
function weekRange(date: Date): [Date, Date] {
  const start = new Date(date)
  start.setDate(date.getDate() - date.getDay())
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return [start, end]
}

const TabButton = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button"> & { active?: boolean }>(
  ({ active, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
        active ? "bg-card text-blue-600 dark:text-blue-400 shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground",
        className
      )}
      {...props}
    />
  )
)
TabButton.displayName = "TabButton"

/** Day-grid calendar for the Weekly preset — hovering/picking a date highlights its whole Sun–Sat week. */
function WeekPicker({ onPick }: { onPick: (start: Date, end: Date) => void }) {
  const [displayMonth, setDisplayMonth] = useState(() => new Date())
  const [hovered, setHovered] = useState<Date | undefined>(undefined)

  const highlighted = hovered ? weekRange(hovered) : undefined

  return (
    <div className="w-80">
      <Calendar
        mode="single"
        month={displayMonth}
        onMonthChange={setDisplayMonth}
        onSelect={(d) => {
          if (!d) return
          const [start, end] = weekRange(d)
          onPick(start, end)
        }}
        onDayMouseEnter={(d) => setHovered(d)}
        onDayMouseLeave={() => setHovered(undefined)}
        showWeekNumber
        modifiers={highlighted ? { weekHighlight: { from: highlighted[0], to: highlighted[1] } } : undefined}
        modifiersClassNames={{ weekHighlight: "bg-blue-600 text-white rounded-md hover:bg-blue-600 hover:text-white" }}
      />
    </div>
  )
}

/** Month grid with a year header for the Monthly preset. */
function MonthPicker({ onPick }: { onPick: (start: Date, end: Date) => void }) {
  const [year, setYear] = useState(() => new Date().getFullYear())

  return (
    <div className="w-64 p-3">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setYear((y) => y - 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-foreground">{year}</span>
        <button
          type="button"
          onClick={() => setYear((y) => y + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-accent transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MONTH_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => onPick(new Date(year, i, 1), new Date(year, i + 1, 0))}
            className="rounded-lg py-2 text-sm font-medium transition-colors text-foreground hover:bg-accent"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Decade-grid year picker for the Yearly preset. */
function YearPicker({ onPick }: { onPick: (start: Date, end: Date) => void }) {
  const [decadeStart, setDecadeStart] = useState(() => {
    const y = new Date().getFullYear()
    return y - (y % 10) - 1
  })
  const years = Array.from({ length: 12 }, (_, i) => decadeStart + i)

  return (
    <div className="w-64 p-3">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setDecadeStart((d) => d - 10)}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-foreground">{decadeStart + 1} – {decadeStart + 10}</span>
        <button
          type="button"
          onClick={() => setDecadeStart((d) => d + 10)}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-accent transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => onPick(new Date(y, 0, 1), new Date(y, 11, 31))}
            className="rounded-lg py-2 text-sm font-medium transition-colors text-foreground hover:bg-accent"
          >
            {y}
          </button>
        ))}
      </div>
    </div>
  )
}

function detectPreset(fromDate: string, toDate: string): PresetKey | null {
  const today = getTodayIso()
  if (fromDate === today && toDate === today) return "today"
  if (fromDate === getYesterdayIso() && toDate === getYesterdayIso()) return "yesterday"
  if (fromDate === getMonthStartIso() && toDate === getMonthEndIso()) return "monthly"
  if (fromDate === getYearStartIso() && toDate === today) return "yearly"
  if (fromDate === getWeekStartIso() && toDate === today) return "weekly"
  return null
}

export interface DateRangeFilterProps {
  fromDate: string
  toDate: string
  onChange: (from: string, to: string) => void
}

export function DateRangeFilter({ fromDate, toDate, onChange }: DateRangeFilterProps) {
  const [activePreset, setActivePreset] = useState<PresetKey | null>(() => detectPreset(fromDate, toDate))
  const [openPreset, setOpenPreset] = useState<PresetKey | null>(null)

  const selectToday = () => { setActivePreset("today"); onChange(getTodayIso(), getTodayIso()) }
  const selectYesterday = () => { setActivePreset("yesterday"); onChange(getYesterdayIso(), getYesterdayIso()) }

  const pick = (key: PresetKey) => (start: Date, end: Date) => {
    setActivePreset(key)
    onChange(dateToIso(start), dateToIso(end))
    setOpenPreset(null)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex shrink-0 gap-0.5 rounded-lg bg-muted p-0.5 w-fit">
        <TabButton active={activePreset === "today"} onClick={selectToday}>Today</TabButton>
        <TabButton active={activePreset === "yesterday"} onClick={selectYesterday}>Yesterday</TabButton>

        <Popover open={openPreset === "weekly"} onOpenChange={(o) => setOpenPreset(o ? "weekly" : null)}>
          <PopoverTrigger asChild>
            <TabButton active={activePreset === "weekly"}>Weekly</TabButton>
          </PopoverTrigger>
          <PopoverContent align="start">
            <WeekPicker onPick={pick("weekly")} />
          </PopoverContent>
        </Popover>

        <Popover open={openPreset === "monthly"} onOpenChange={(o) => setOpenPreset(o ? "monthly" : null)}>
          <PopoverTrigger asChild>
            <TabButton active={activePreset === "monthly"}>Monthly</TabButton>
          </PopoverTrigger>
          <PopoverContent align="start">
            <MonthPicker onPick={pick("monthly")} />
          </PopoverContent>
        </Popover>

        <Popover open={openPreset === "yearly"} onOpenChange={(o) => setOpenPreset(o ? "yearly" : null)}>
          <PopoverTrigger asChild>
            <TabButton active={activePreset === "yearly"}>Yearly</TabButton>
          </PopoverTrigger>
          <PopoverContent align="start">
            <YearPicker onPick={pick("yearly")} />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col gap-0.5 text-xs leading-tight">
        <span><span className="font-semibold text-foreground">From:</span> <span className="text-muted-foreground">{formatDisplay(fromDate)}</span></span>
        <span><span className="font-semibold text-foreground">To:</span> <span className="text-muted-foreground">{formatDisplay(toDate)}</span></span>
      </div>
    </div>
  )
}
