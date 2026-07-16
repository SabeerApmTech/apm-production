import type { LogReportEntry, OperatorSchedule } from "@/types/productionMonitoring"
import type { Operation, Schedule, ScheduleType, ViewStep } from "./types"

export interface FlowState {
  view: ViewStep
  scheduleType: ScheduleType | null
  schedules: OperatorSchedule[]
  selectedSchedule: Schedule | null
  operations: Operation[]
  selectedOperation: Operation | null
  logs: LogReportEntry[]
  activeHours: string
  idleHours: string
  // True when we jumped straight to "working" because operator-schedules said this operator is
  // already mid-session — there's no operations list to go "back" to in that case.
  cameFromAutoRoute: boolean
}

export const initialFlowState: FlowState = {
  view: "loading",
  scheduleType: null,
  schedules: [],
  selectedSchedule: null,
  operations: [],
  selectedOperation: null,
  logs: [],
  activeHours: "0.00",
  idleHours: "0.00",
  cameFromAutoRoute: false,
}

export type FlowAction =
  | { type: "SCHEDULES_LOADED"; schedules: OperatorSchedule[]; active?: Schedule }
  | { type: "AUTO_ROUTE_OPERATIONS_LOADED"; operations: Operation[] }
  | { type: "AUTO_ROUTE_OPERATION_MATCHED"; operation: Operation }
  | { type: "SELECT_TYPE"; scheduleType: ScheduleType }
  | { type: "SELECT_SCHEDULE_START"; schedule: Schedule }
  | { type: "SELECT_SCHEDULE_SUCCESS"; operations: Operation[] }
  | { type: "SELECT_SCHEDULE_FAILED" }
  | { type: "SELECT_OPERATION_START"; operation: Operation }
  | { type: "SELECT_OPERATION_SUCCESS" }
  | { type: "SELECT_OPERATION_FAILED" }
  | { type: "LOG_REPORT_LOADED"; logs: LogReportEntry[]; activeHours: string; idleHours: string }
  | { type: "OPERATIONS_REFRESHED"; operations: Operation[] }
  | { type: "GO_BACK" }

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case "SCHEDULES_LOADED": {
      if (action.active) {
        return {
          ...state,
          schedules: action.schedules,
          selectedSchedule: action.active,
          cameFromAutoRoute: true,
          view: "working",
        }
      }
      return { ...state, schedules: action.schedules, view: action.schedules.length === 0 ? "empty" : "type" }
    }

    case "AUTO_ROUTE_OPERATIONS_LOADED":
      return { ...state, operations: action.operations }

    case "AUTO_ROUTE_OPERATION_MATCHED":
      return { ...state, selectedOperation: action.operation }

    case "SELECT_TYPE":
      return { ...state, scheduleType: action.scheduleType, view: "list" }

    case "SELECT_SCHEDULE_START":
      return { ...state, selectedSchedule: action.schedule }

    case "SELECT_SCHEDULE_SUCCESS":
      return { ...state, operations: action.operations, view: "operations" }

    case "SELECT_SCHEDULE_FAILED":
      return { ...state, selectedSchedule: null }

    case "SELECT_OPERATION_START":
      return { ...state, selectedOperation: action.operation }

    case "SELECT_OPERATION_SUCCESS":
      return { ...state, view: "working" }

    case "SELECT_OPERATION_FAILED":
      return { ...state, selectedOperation: null }

    case "LOG_REPORT_LOADED":
      return { ...state, logs: action.logs, activeHours: action.activeHours, idleHours: action.idleHours }

    case "OPERATIONS_REFRESHED": {
      const matched = state.selectedOperation
        ? action.operations.find(o => o.sequenceNo === state.selectedOperation!.sequenceNo)
        : undefined
      return { ...state, operations: action.operations, selectedOperation: matched ?? state.selectedOperation }
    }

    case "GO_BACK": {
      if (state.view === "list") return { ...state, view: "type", scheduleType: null }
      if (state.view === "operations") return { ...state, view: "list", selectedSchedule: null, operations: [] }
      if (state.view === "working" && !state.cameFromAutoRoute) {
        return { ...state, view: "operations", selectedOperation: null, logs: [] }
      }
      return state
    }

    default:
      return state
  }
}
