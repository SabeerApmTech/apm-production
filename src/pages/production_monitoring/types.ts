import type { OperationRecord, OperatorSchedule } from "@/types/productionMonitoring"

export type ViewStep = "loading" | "empty" | "list" | "operations" | "working"

export type Schedule  = OperatorSchedule
export type Operation = OperationRecord
