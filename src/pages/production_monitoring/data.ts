import type { Employee, Operation, Schedule } from "./types"

export const EMPLOYEES: Employee[] = [
  { id: "1735", name: "Ashwin" },
  { id: "1836", name: "Kumar" },
  { id: "1942", name: "Priya" },
  { id: "2001", name: "Ravi" },
  { id: "2156", name: "Deepa" },
]

export const PRODUCTION_SCHEDULES: Schedule[] = [
  { id: "SCH-002", priorityNo: 1, scheduleDate: "May 26, 2026", company: "Lakshika", product: "AIS 140", targetDate: "May 31, 2026", targetQty: 2000 },
  { id: "SCH-004", priorityNo: 4, scheduleDate: "May 26, 2026", company: "Lakshika", product: "AIS 140", targetDate: "May 31, 2026", targetQty: 2000 },
]

export const REWORK_SCHEDULES: Schedule[] = [
  { id: "RWK-001", priorityNo: 2, scheduleDate: "May 27, 2026", company: "Lakshika", product: "AIS 140", targetDate: "Jun 02, 2026", targetQty: 500 },
]

export const SCHEDULE_OPERATIONS: Operation[] = [
  { step: 1, name: "Preprocessing",     targetQty: 2000, producedQty: 1000, pendingQty: 1000, rejectQty: 15 },
  { step: 2, name: "Assembly",          targetQty: 2000, producedQty: 800,  pendingQty: 1200, rejectQty: 5  },
  { step: 3, name: "Testing",           targetQty: 2000, producedQty: 600,  pendingQty: 1400, rejectQty: 10 },
  { step: 4, name: "Quality Check",     targetQty: 2000, producedQty: 400,  pendingQty: 1600, rejectQty: 0  },
  { step: 5, name: "Firmware Flashing", targetQty: 2000, producedQty: 0,    pendingQty: 2000, rejectQty: 0  },
]

export const PAUSE_REASONS = [
  "Machine Breakdown", "Material Shortage", "Power Cut",
  "Tea Break", "Lunch Break", "Maintenance", "Other",
]

export const pad2 = (n: number) => String(n).padStart(2, "0")

export function formatNow(): string {
  const d = new Date()
  const date = `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  return `${date} - ${time}`
}
