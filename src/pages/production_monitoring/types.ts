import type { OperationRecord, OperatorSchedule } from "@/types/productionMonitoring"

export type ViewStep     = "loading" | "empty" | "type" | "list" | "operations" | "working"
export type ScheduleType = "production" | "rework"

export type Schedule  = OperatorSchedule
export type Operation = OperationRecord
