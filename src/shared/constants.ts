// Shared poll interval for the live-tracking dashboards (Employee Wise, Schedule Wise) — kept
// in one place so their refresh cadences stay in sync if this ever needs to change.
export const LIVE_TRACKING_POLL_INTERVAL_MS = 3000

export type PriorityLevel = "High" | "Medium" | "Low"

export const PRIORITY_LEVELS: PriorityLevel[] = ["High", "Medium", "Low"]

export const PRIORITY_STYLES: Record<PriorityLevel, string> = {
  High:   "bg-red-500 text-white",
  Medium: "bg-yellow-400 text-white",
  Low:    "bg-green-500 text-white",
}

export const PRIORITY_TEXT_STYLES: Record<PriorityLevel, string> = {
  High:   "text-red-600 dark:text-red-400",
  Medium: "text-yellow-600 dark:text-yellow-400",
  Low:    "text-green-600 dark:text-green-400",
}

// The state field is either the fixed "Common" option or a specific Indian state.
export const LOCATION_TYPES = ["Common", "State"] as const
export type LocationType = (typeof LOCATION_TYPES)[number]

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
] as const

export type StaffAllocationStatus = "FullyAlloted" | "PartiallyAlloted" | "NoneAlloted"

export const STAFF_ALLOCATION_BUTTON_STYLES: Record<StaffAllocationStatus, string> = {
  FullyAlloted:     "bg-green-500 hover:bg-green-600",
  PartiallyAlloted: "bg-yellow-500 hover:bg-yellow-600",
  NoneAlloted:      "bg-red-500 hover:bg-red-600",
}
