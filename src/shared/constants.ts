export type PriorityLevel = "High" | "Medium" | "Low"

export const PRIORITY_LEVELS: PriorityLevel[] = ["High", "Medium", "Low"]

export const PRIORITY_STYLES: Record<PriorityLevel, string> = {
  High:   "bg-red-500 text-white",
  Medium: "bg-yellow-400 text-white",
  Low:    "bg-green-500 text-white",
}

export const PRIORITY_TEXT_STYLES: Record<PriorityLevel, string> = {
  High:   "text-red-600",
  Medium: "text-yellow-600",
  Low:    "text-green-600",
}

export const COMPANIES = ["Lakshika", "Kingstrack", "ABC"]
export const PRODUCTS  = ["AIS 140 Standard", "Dashcam", "CCTV"]
