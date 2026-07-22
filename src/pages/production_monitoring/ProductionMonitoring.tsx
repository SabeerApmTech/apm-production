import { useEffect, useReducer, useState } from "react"
import { Navigate } from "react-router-dom"
import { ChevronLeft } from "lucide-react"
import { getAuthUser } from "@/utils/auth"
import { getApiErrorMessage } from "@/utils/apiError"
import {
  useLazyGetOperatorSchedulesQuery,
  useLazyGetOperatorOperationsQuery,
  useLazyGetOperatorLogReportQuery,
  useOperatorActionMutation,
} from "@/store/services/productionMonitoringApi"
import {
  useLazyGetOperatorReworkSchedulesQuery,
  useLazyGetOperatorReworkOperationsQuery,
  useLazyGetOperatorReworkLogReportQuery,
  useOperatorReworkActionMutation,
} from "@/store/services/reworkMonitoringApi"
import type { OperatorActionRequest } from "@/types/productionMonitoring"
import type { Operation, Schedule, ScheduleType } from "./types"
import { flowReducer, initialFlowState } from "./reducer"
import { ScheduleTypeSelect }  from "./ScheduleTypeSelect"
import { ScheduleList }        from "./ScheduleList"
import { OperationCards }      from "./OperationCards"
import { WorkingView }         from "./WorkingView"
import { StopDialog }          from "./StopDialog"
import { PauseDialog }         from "./PauseDialog"

export const ProductionMonitoring = () => {
  const operatorUser = getAuthUser()
  const employeeId = operatorUser?.employeeId ?? ""

  const [state, dispatch] = useReducer(flowReducer, initialFlowState)
  const {
    view, scheduleType, productionSchedules, reworkSchedules, selectedSchedule,
    operations, selectedOperation, logs, activeHours, idleHours, cameFromAutoRoute,
  } = state

  const [stopOpen,  setStopOpen]  = useState(false)
  const [pauseOpen, setPauseOpen] = useState(false)

  const [fetchProductionSchedules]  = useLazyGetOperatorSchedulesQuery()
  const [fetchProductionOperations] = useLazyGetOperatorOperationsQuery()
  const [fetchProductionLogReport]  = useLazyGetOperatorLogReportQuery()
  const [productionAction]          = useOperatorActionMutation()

  const [fetchReworkSchedules]  = useLazyGetOperatorReworkSchedulesQuery()
  const [fetchReworkOperations] = useLazyGetOperatorReworkOperationsQuery()
  const [fetchReworkLogReport]  = useLazyGetOperatorReworkLogReportQuery()
  const [reworkAction]          = useOperatorReworkActionMutation()

  // The two schedule types now live behind entirely separate API sets. This keys into the right
  // one wherever the flow's current step (or an auto-routed step) needs to fetch or act.
  const apiFor = (type: ScheduleType) =>
    type === "production"
      ? { fetchOperations: fetchProductionOperations, fetchLogReport: fetchProductionLogReport, action: productionAction }
      : { fetchOperations: fetchReworkOperations, fetchLogReport: fetchReworkLogReport, action: reworkAction }

  const loadLogReport = async (type: ScheduleType, scheduleId: string, sequenceNo: number) => {
    const report = await apiFor(type).fetchLogReport({ employeeId, scheduleId, sequenceNo }, false).unwrap()
    dispatch({
      type: "LOG_REPORT_LOADED",
      logs: report.logs ?? [],
      activeHours: report.activeHours ?? "0.00",
      idleHours: report.idleHours ?? "0.00",
    })
  }

  // Runs exactly once per mount, and every step explicitly awaits the network response instead
  // of trusting a reactive query's cache — this is live work state and must always reflect what
  // the server says right now, never a stale snapshot from a previous login. Production and rework
  // schedules come from separate endpoints, but an operator can only be mid-session on one of them
  // at a time, so both are fetched up front to find out which (if either).
  useEffect(() => {
    if (!operatorUser) return
    let cancelled = false

    ;(async () => {
      try {
        const [productionData, reworkData] = await Promise.all([
          fetchProductionSchedules(employeeId, false).unwrap(),
          fetchReworkSchedules(employeeId, false).unwrap(),
        ])
        if (cancelled) return

        const activeProduction = productionData.find(s => s.isWorking)
        const activeRework = reworkData.find(s => s.isWorking)
        const active = activeProduction ?? activeRework
        const activeType: ScheduleType | undefined = activeProduction ? "production" : activeRework ? "rework" : undefined

        dispatch({
          type: "SCHEDULES_LOADED",
          productionSchedules: productionData,
          reworkSchedules: reworkData,
          active,
          activeType,
        })
        if (!active || !activeType) return

        const ops = await apiFor(activeType).fetchOperations({ employeeId, scheduleId: active.scheduleId }, false).unwrap()
        if (cancelled) return
        dispatch({ type: "AUTO_ROUTE_OPERATIONS_LOADED", operations: ops })

        const match = ops.find(o => o.sequenceNo === active.sequenceNo)
        if (!match) return
        dispatch({ type: "AUTO_ROUTE_OPERATION_MATCHED", operation: match })
        await loadLogReport(activeType, active.scheduleId, match.sequenceNo)
      } catch {
        // Toast middleware already surfaced the error.
      }
    })()

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!operatorUser) return <Navigate to="/login" replace />

  const filteredSchedules = scheduleType === "rework" ? reworkSchedules : productionSchedules
  const availableTypes: ScheduleType[] = [
    ...(productionSchedules.length > 0 ? (["production"] as const) : []),
    ...(reworkSchedules.length > 0 ? (["rework"] as const) : []),
  ]

  const selectSchedule = async (schedule: Schedule) => {
    if (!scheduleType) return
    dispatch({ type: "SELECT_SCHEDULE_START", schedule })
    try {
      const ops = await apiFor(scheduleType).fetchOperations({ employeeId, scheduleId: schedule.scheduleId }, false).unwrap()
      dispatch({ type: "SELECT_SCHEDULE_SUCCESS", operations: ops })
    } catch {
      dispatch({ type: "SELECT_SCHEDULE_FAILED" })
      // Toast middleware already surfaced the error; stay on this view so the user can retry.
    }
  }

  const selectOperation = async (schedule: Schedule, operation: Operation) => {
    if (!scheduleType) return
    dispatch({ type: "SELECT_OPERATION_START", operation })
    try {
      await loadLogReport(scheduleType, schedule.scheduleId, operation.sequenceNo)
      dispatch({ type: "SELECT_OPERATION_SUCCESS" })
    } catch {
      dispatch({ type: "SELECT_OPERATION_FAILED" })
      // Toast middleware already surfaced the error; stay on this view so the user can retry.
    }
  }

  const goBack = () => dispatch({ type: "GO_BACK" })
  const showBack = view === "list" || view === "operations" || (view === "working" && !cameFromAutoRoute)

  const currentEvent = logs.length ? logs[logs.length - 1].logEvent : null

  const buildActionBase = () => ({
    employeeId,
    scheduleId: selectedSchedule?.scheduleId ?? "",
    sequenceNo: selectedOperation?.sequenceNo ?? 0,
    operationName: selectedOperation?.operationName ?? "",
  })

  const runAction = async (payload: OperatorActionRequest) => {
    if (!scheduleType) return
    try {
      await apiFor(scheduleType).action(payload).unwrap()
      if (selectedSchedule && selectedOperation) {
        await loadLogReport(scheduleType, selectedSchedule.scheduleId, selectedOperation.sequenceNo)
      }
    } catch {
      // Toast middleware already surfaced the error; stay on this view so the user can retry.
    }
  }

  const handleStart = () => {
    runAction({
      ...buildActionBase(),
      action: currentEvent === "PAUSE" ? "RESUME" : "start",
      successfulQty: 0, rejectedQty: 0, reason: "", remarks: "",
    })
  }

  const handlePauseSubmit = ({ reason, remarks }: { reason: string; remarks: string }) => {
    runAction({ ...buildActionBase(), action: "PAUSE", successfulQty: 0, rejectedQty: 0, reason, remarks })
    setPauseOpen(false)
  }

  // Stop is the only action that changes produced/pending quantities, so it's the only one that
  // needs the operations table refreshed afterwards.
  const refreshScheduleOperations = async () => {
    if (!selectedSchedule || !scheduleType) return
    try {
      const ops = await apiFor(scheduleType).fetchOperations({ employeeId, scheduleId: selectedSchedule.scheduleId }, false).unwrap()
      dispatch({ type: "OPERATIONS_REFRESHED", operations: ops })
    } catch {
      // Toast middleware already surfaced the error.
    }
  }

  const handleStopSave = async ({ successQty, rejectedQty, remarks, reason }: { successQty: string; rejectedQty: string; remarks: string; reason: string }) => {
    if (!scheduleType) return
    try {
      await apiFor(scheduleType).action({
        ...buildActionBase(),
        action: "STOP",
        successfulQty: successQty ? Number(successQty) : 0,
        rejectedQty: rejectedQty ? Number(rejectedQty) : 0,
        reason, remarks,
      }).unwrap()
    } catch (err) {
      // Re-thrown so StopDialog can show it inline and keep the dialog open for the user to correct.
      throw new Error(getApiErrorMessage(err, "Failed to stop. Please try again."), { cause: err })
    }

    if (selectedSchedule && selectedOperation) {
      await loadLogReport(scheduleType, selectedSchedule.scheduleId, selectedOperation.sequenceNo)
    }
    await refreshScheduleOperations()
    setStopOpen(false)
  }

  return (
    <div className="max-w-5xl flex-1 flex min-h-0 flex-col">

      {showBack && (
        <button
          onClick={goBack}
          className="shrink-0 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </button>
      )}

      {/* flex-1 min-h-0 so whichever view is active (esp. "working", which fills and scrolls
          internally) is bounded by the remaining height instead of overflowing the page.
          Also a flex column itself — WorkingView sizes into it via flex-1, not height:100%,
          since percentage heights are too easy to silently break by an ancestor's CSS. */}
      <div className="flex flex-1 min-h-0 flex-col">
        {view === "loading" && (
          <p className="text-sm text-gray-400">Loading your work data…</p>
        )}

        {view === "empty" && (
          <p className="text-sm text-gray-400">No schedules allotted</p>
        )}

        {view === "type" && (
          <ScheduleTypeSelect
            availableTypes={availableTypes}
            onSelect={type => dispatch({ type: "SELECT_TYPE", scheduleType: type })}
          />
        )}

        {view === "list" && scheduleType && (
          <ScheduleList
            title={`View ${scheduleType === "production" ? "Production" : "Rework"} Schedules`}
            schedules={filteredSchedules}
            onSelect={selectSchedule}
          />
        )}

        {view === "operations" && selectedSchedule && (
          <OperationCards
            schedule={selectedSchedule}
            operations={operations}
            onSelect={op => selectOperation(selectedSchedule, op)}
          />
        )}

        {view === "working" && selectedSchedule && !selectedOperation && (
          <p className="text-sm text-gray-400">Loading your work data…</p>
        )}

        {view === "working" && selectedSchedule && selectedOperation && (
          <WorkingView
            schedule={selectedSchedule}
            operation={selectedOperation}
            logs={logs}
            activeHours={activeHours}
            idleHours={idleHours}
            onStart={handleStart}
            onPause={() => setPauseOpen(true)}
            onStop={() => setStopOpen(true)}
          />
        )}
      </div>

      <StopDialog
        open={stopOpen}
        onOpenChange={setStopOpen}
        operation={selectedOperation}
        targetReached={selectedSchedule?.isTargetReached}
        onSave={handleStopSave}
      />
      <PauseDialog open={pauseOpen} onOpenChange={setPauseOpen} onSubmit={handlePauseSubmit} />
    </div>
  )
}
