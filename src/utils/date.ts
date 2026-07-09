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

/** Short DOB "10-Apr-94" → ISO "1994-04-10" (for HTML date inputs) */
export function toInputDate(dob: string): string {
  const months: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04",
    May: "05", Jun: "06", Jul: "07", Aug: "08",
    Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  }
  const [d, m, y] = dob.split("-")
  if (!d || !m || !y || !months[m]) return ""
  const yr = parseInt(y) > 30 ? `19${y}` : `20${y}`
  return `${yr}-${months[m]}-${d.padStart(2, "0")}`
}
