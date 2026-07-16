import { useState } from "react"
import { getMonthEndIso, getMonthStartIso } from "@/utils/date"

export interface DateRange {
  from: string
  to: string
}

function defaultRange(): DateRange {
  return { from: getMonthStartIso(), to: getMonthEndIso() }
}

// Defaults every report/log page's date filter to the current month, matching DataTable's own
// `defaultFromDate`/`defaultToDate` — `setRange` takes (from, to) directly so it drops straight
// into `onDateFilter`/`DateRangeFilter`'s `onChange` without a wrapper arrow function.
export function useDateRange() {
  const [range, setRange] = useState<DateRange>(defaultRange)

  return {
    from: range.from,
    to: range.to,
    setRange: (from: string, to: string) => setRange({ from, to }),
  }
}
