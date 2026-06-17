import type { EmployeeRecord, LogEntry, ScheduleDetail, StageDetail } from "./types"

export const MOCK_EMPLOYEES: EmployeeRecord[] = [
  { id: "1", name: "Ashwin",  employeeId: "1735", scheduleId: "AMP0023", company: "Lakshika",   product: "CCTV",    step: "Preprocessing",    targetQty: 1000, producedQty: 650,  status: "Running"     },
  { id: "2", name: "Naveen",  employeeId: "0987", scheduleId: "AMP0024", company: "Kingstrack", product: "AIS 140", step: "Firmware Flashing", targetQty: 2000, producedQty: 1480, status: "Running"     },
  { id: "3", name: "Ravi",    employeeId: "1045", scheduleId: "AMP0023", company: "Lakshika",   product: "CCTV",    step: "Battery Fixing",    targetQty: 1000, producedQty: 0,    status: "Not Started" },
  { id: "4", name: "Suresh",  employeeId: "1102", scheduleId: "AMP0025", company: "ABC Corp",   product: "Dashcam", step: "Final QC",          targetQty: 1500, producedQty: 900,  status: "Paused"      },
  { id: "5", name: "Priya",   employeeId: "1203", scheduleId: "AMP0024", company: "Kingstrack", product: "AIS 140", step: "Preprocessing",     targetQty: 2000, producedQty: 1200, status: "Running"     },
  { id: "6", name: "Divya",   employeeId: "1305", scheduleId: "AMP0025", company: "ABC Corp",   product: "Dashcam", step: "Battery Fixing",    targetQty: 1500, producedQty: 420,  status: "Stopped"     },
  { id: "7", name: "Karthik", employeeId: "1412", scheduleId: "AMP0026", company: "Lakshika",   product: "GPS Unit",step: "PCB Fix",           targetQty: 800,  producedQty: 610,  status: "Running"     },
  { id: "8", name: "Meena",   employeeId: "1519", scheduleId: "AMP0026", company: "Lakshika",   product: "GPS Unit",step: "Final QC",          targetQty: 800,  producedQty: 580,  status: "Running"     },
  { id: "9", name: "Arjun",   employeeId: "1623", scheduleId: "AMP0027", company: "ABC Corp",   product: "Tracker", step: "Preprocessing",    targetQty: 500,  producedQty: 320,  status: "Paused"      },
]

export const MOCK_SCHEDULE_DETAIL: ScheduleDetail = {
  priorityNo:   1,
  scheduleId:   "SCH-002",
  scheduleDate: "May 26, 2026",
  company:      "Lakshika",
  product:      "AIS 140",
  targetDate:   "May 31, 2026",
  targetQty:    2000,
}

export const MOCK_STAGE_DETAIL: StageDetail = {
  stage:       1,
  operation:   "Preprocessing",
  targetQty:   2000,
  producedQty: 1000,
  pendingQty:  1000,
  status:      "Running",
}

export const MOCK_LOG_ENTRIES: LogEntry[] = [
  { dateTime: "29/05/2026 - 11:00 AM", status: "Started", successQty: null, rejectedQty: null, reason: null,                        remarks: null               },
  { dateTime: "29/05/2026 - 11:00 AM", status: "Stopped", successQty: 100,  rejectedQty: 10,   reason: null,                        remarks: "Component Failure" },
  { dateTime: "29/05/2026 - 11:00 AM", status: "Started", successQty: null, rejectedQty: null, reason: null,                        remarks: null               },
  { dateTime: "29/05/2026 - 11:00 AM", status: "Paused",  successQty: null, rejectedQty: null, reason: "Ticket Raised - Power Failure", remarks: null            },
  { dateTime: "29/05/2026 - 11:00 AM", status: "Started", successQty: null, rejectedQty: null, reason: null,                        remarks: null               },
  { dateTime: "29/05/2026 - 11:00 AM", status: "Stopped", successQty: null, rejectedQty: null, reason: null,                        remarks: null               },
]
