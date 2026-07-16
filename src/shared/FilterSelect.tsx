import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

/** Sentinel value meaning "no filter" — shared so pages don't each redeclare their own "all". */
export const ALL_FILTER_VALUE = "all"

interface FilterSelectOption {
  value: string
  label: string
}

interface FilterSelectProps {
  label: string
  value: string
  onValueChange: (value: string) => void
  /** e.g. "All Companies" — used as both the placeholder and the reset option's label. */
  allLabel: string
  options: FilterSelectOption[]
  disabled?: boolean
  className?: string
}

// The labeled "<field> — All <field>s + options" dropdown repeated across the transaction log
// and report filter toolbars.
export function FilterSelect({ label, value, onValueChange, allLabel, options, disabled, className }: FilterSelectProps) {
  return (
    <div className={cn("flex flex-col gap-1 w-48", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger><SelectValue placeholder={allLabel} /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_FILTER_VALUE}>{allLabel}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
