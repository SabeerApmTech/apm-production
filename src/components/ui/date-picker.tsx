import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

function formatDisplay(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function parseIso(value: string): Date | undefined {
  if (!value) return undefined
  const d = new Date(value + "T00:00:00")
  return isNaN(d.getTime()) ? undefined : d
}

function toIso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

interface DatePickerProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  /** Dates after this are shown greyed-out and cannot be selected. */
  maxDate?: Date
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  maxDate,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const selected = parseIso(value ?? "")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-transparent px-4 py-2 text-sm transition-[color,box-shadow] outline-none",
            "focus-visible:border-blue-500 focus-visible:ring-[3px] focus-visible:ring-blue-200 dark:focus-visible:ring-blue-900/40",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !selected && "text-muted-foreground",
            className
          )}
        >
          {selected ? formatDisplay(selected) : placeholder}
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-auto" align="end">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(day) => {
            onChange(day ? toIso(day) : "")
            setOpen(false)
          }}
          disabled={maxDate ? { after: maxDate } : undefined}
          captionLayout="dropdown-buttons"
          fromYear={1950}
          toYear={(maxDate ?? new Date()).getFullYear() + (maxDate ? 0 : 10)}
          classNames={{ caption_label: "hidden" }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
