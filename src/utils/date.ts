/** "26/05/2026" → true if that date is before today */
export function isDatePast(dateStr: string): boolean {
  if (!dateStr) return false
  const parts = dateStr.split("/")
  if (parts.length !== 3) return false
  const [d, m, y] = parts
  return new Date(Number(y), Number(m) - 1, Number(d)) < new Date()
}

/** Today's date as an ISO "YYYY-MM-DD" string, for date-picker/query-param defaults. */
export function getTodayIso(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** First day of the current month as an ISO "YYYY-MM-DD" string, for date-picker/query-param defaults. */
export function getMonthStartIso(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}-01`
}

/** Last day of the current month as an ISO "YYYY-MM-DD" string, for date-picker/query-param defaults. */
export function getMonthEndIso(): string {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return dateToIso(lastDay)
}

/** Converts a Date to an ISO "YYYY-MM-DD" string (local time, not UTC). */
export function dateToIso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Yesterday's date as an ISO "YYYY-MM-DD" string. */
export function getYesterdayIso(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return dateToIso(d)
}

/** Sunday of the current week as an ISO "YYYY-MM-DD" string. */
export function getWeekStartIso(): string {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay())
  return dateToIso(d)
}

/** January 1st of the current year as an ISO "YYYY-MM-DD" string. */
export function getYearStartIso(): string {
  return `${new Date().getFullYear()}-01-01`
}

/** Today at midnight local time — for DatePicker's minDate, so "before" comparisons don't exclude today. */
export function startOfToday(): Date {
  return new Date(new Date().toDateString())
}

/** ISO "2026-05-26" → display "26/05/2026" */
export function fromIsoDate(isoStr: string): string {
  const parts = isoStr.split("-")
  if (parts.length !== 3) return isoStr
  const [y, m, d] = parts
  return `${d}/${m}/${y}`
}

/** Display "26/05/2026" → ISO "2026-05-26" (for date input values) */
export function toIsoDate(dateStr: string): string {
  const parts = dateStr.split("/")
  if (parts.length !== 3) return ""
  const [d, m, y] = parts
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
}

/** ISO datetime "2026-07-06T16:31:44.823" → two-line display "06/07/2026\n04:31 PM" */
export function formatLogDateTime(isoDateTime: string): string {
  const date = new Date(isoDateTime)
  if (isNaN(date.getTime())) return isoDateTime
  const datePart = fromIsoDate(isoDateTime.slice(0, 10))
  const timePart = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
  return `${datePart}\n${timePart}`
}
