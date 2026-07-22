import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ChevronLeft } from "lucide-react"
import {
  useGetOperatorSchedulesQuery,
  useGetOperatorOperationsQuery,
  useGetOperatorLogReportQuery,
  useOperatorActionMutation,
} from "@/store/services/productionMonitoringApi"
import {
  useGetOperatorReworkSchedulesQuery,
  useGetOperatorReworkOperationsQuery,
  useGetOperatorReworkLogReportQuery,
  useOperatorReworkActionMutation,
} from "@/store/services/reworkMonitoringApi"
import { WorkingView } from "@/pages/production_monitoring/WorkingView"
import { StopDialog } from "@/pages/production_monitoring/StopDialog"
import { PauseDialog } from "@/pages/production_monitoring/PauseDialog"
import { LoadingRow } from "@/shared/LoadingRow"
import { getCurrentEmployeeId } from "@/utils/auth"
import { getApiErrorMessage } from "@/utils/apiError"
import type { OperatorActionRequest } from "@/types/productionMonitoring"

const POLL_INTERVAL_MS = 3000

/**
 * "Log Report" for an operator's work, reached either from the "View Detail" button on Live
 * Tracking (another operator, identified by `operationName` — always read-only) or from a
 * schedule allocation notification (the viewer's own work, identified by `sequenceNo` — the step
 * number the notification's `navigationId` carries). Reuses the same WorkingView layout
 * Production Monitoring shows an operator for their own job; Start/Pause/Stop are wired up only
 * when the `employeeId` in the URL matches the signed-in operator, i.e. this is their own work.
 * Production and rework schedules live behind separate endpoints, so both are queried and
 * whichever one actually contains the requested scheduleId is used for the operations/log-report
 * follow-up calls.
 */
export function OperatorLogReport() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const employeeId = searchParams.get("employeeId") ?? ""
  const employeeName = searchParams.get("employeeName") ?? ""
  const scheduleId = searchParams.get("scheduleId") ?? ""
  const operationName = searchParams.get("operationName") ?? ""
  const sequenceNoParam = searchParams.get("sequenceNo")
  const sequenceNo = sequenceNoParam ? Number(sequenceNoParam) : null
  const isOwnWork = !!employeeId && employeeId === getCurrentEmployeeId()

  const [stopOpen, setStopOpen] = useState(false)
  const [pauseOpen, setPauseOpen] = useState(false)

  const { data: productionSchedules, isLoading: isProductionSchedulesLoading } = useGetOperatorSchedulesQuery(employeeId, {
    skip: !employeeId,
  })
  const { data: reworkSchedules, isLoading: isReworkSchedulesLoading } = useGetOperatorReworkSchedulesQuery(employeeId, {
    skip: !employeeId,
  })
  const isSchedulesLoading = isProductionSchedulesLoading || isReworkSchedulesLoading

  const isRework = !isSchedulesLoading && !productionSchedules?.some((s) => s.scheduleId === scheduleId)
    && !!reworkSchedules?.some((s) => s.scheduleId === scheduleId)
  const schedule = isRework
    ? reworkSchedules?.find((s) => s.scheduleId === scheduleId)
    : productionSchedules?.find((s) => s.scheduleId === scheduleId)

  const {
    data: productionOperations, isLoading: isProductionOperationsLoading, refetch: refetchProductionOperations,
  } = useGetOperatorOperationsQuery(
    { employeeId, scheduleId },
    { skip: isSchedulesLoading || isRework || !employeeId || !scheduleId }
  )
  const {
    data: reworkOperations, isLoading: isReworkOperationsLoading, refetch: refetchReworkOperations,
  } = useGetOperatorReworkOperationsQuery(
    { employeeId, scheduleId },
    { skip: isSchedulesLoading || !isRework || !employeeId || !scheduleId }
  )
  const operations = isRework ? reworkOperations : productionOperations
  const isOperationsLoading = isRework ? isReworkOperationsLoading : isProductionOperationsLoading
  const operation = (sequenceNo != null ? operations?.find((o) => o.sequenceNo === sequenceNo) : undefined)
    ?? operations?.find((o) => o.operationName === operationName)
    ?? operations?.[0]

  const { data: productionReport, isLoading: isProductionReportLoading } = useGetOperatorLogReportQuery(
    { employeeId, scheduleId, sequenceNo: operation?.sequenceNo ?? 0 },
    { skip: isRework || !employeeId || !scheduleId || !operation, pollingInterval: POLL_INTERVAL_MS }
  )
  const { data: reworkReport, isLoading: isReworkReportLoading } = useGetOperatorReworkLogReportQuery(
    { employeeId, scheduleId, sequenceNo: operation?.sequenceNo ?? 0 },
    { skip: !isRework || !employeeId || !scheduleId || !operation, pollingInterval: POLL_INTERVAL_MS }
  )
  const report = isRework ? reworkReport : productionReport
  const isReportLoading = isRework ? isReworkReportLoading : isProductionReportLoading

  const isLoading = isSchedulesLoading || isOperationsLoading || isReportLoading
  const logs = report?.logs ?? []
  const currentEvent = logs.length ? logs[logs.length - 1].logEvent : null

  const [productionAction] = useOperatorActionMutation()
  const [reworkAction] = useOperatorReworkActionMutation()
  const action = isRework ? reworkAction : productionAction
  const refetchOperations = isRework ? refetchReworkOperations : refetchProductionOperations

  const buildActionBase = () => ({
    employeeId,
    scheduleId,
    sequenceNo: operation?.sequenceNo ?? 0,
    operationName: operation?.operationName ?? "",
  })

  const runAction = async (payload: OperatorActionRequest) => {
    try {
      await action(payload).unwrap()
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
  // needs the operations table refetched afterwards — the log report refreshes on its own via
  // both the mutation's tag invalidation and its own polling.
  const handleStopSave = async ({ successQty, rejectedQty, remarks, reason }: { successQty: string; rejectedQty: string; remarks: string; reason: string }) => {
    try {
      await action({
        ...buildActionBase(),
        action: "STOP",
        successfulQty: successQty ? Number(successQty) : 0,
        rejectedQty: rejectedQty ? Number(rejectedQty) : 0,
        reason, remarks,
      }).unwrap()
    } catch (err) {
      // Re-thrown so StopDialog keeps itself open for the user to correct and retry.
      throw new Error(getApiErrorMessage(err, "Failed to stop. Please try again."), { cause: err })
    }
    await refetchOperations()
    setStopOpen(false)
  }

  return (
    <div className="max-w-5xl flex-1 flex min-h-0 flex-col">
      <button
        onClick={() => navigate(-1)}
        className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Back
      </button>

      <p className="shrink-0 text-xs font-semibold text-red-500 mb-4">
        {employeeName} - {employeeId}
      </p>

      <div className="flex flex-1 min-h-0 flex-col">
        {isLoading && <LoadingRow />}

        {!isLoading && (!schedule || !operation) && (
          <p className="text-sm text-muted-foreground">No active work found for this operator.</p>
        )}

        {!isLoading && schedule && operation && (
          <WorkingView
            schedule={schedule}
            operation={operation}
            logs={logs}
            activeHours={report?.activeHours ?? "0.00"}
            idleHours={report?.idleHours ?? "0.00"}
            readOnly={!isOwnWork}
            onStart={handleStart}
            onPause={() => setPauseOpen(true)}
            onStop={() => setStopOpen(true)}
          />
        )}
      </div>

      <StopDialog
        open={stopOpen}
        onOpenChange={setStopOpen}
        operation={operation ?? null}
        targetReached={schedule?.isTargetReached}
        onSave={handleStopSave}
      />
      <PauseDialog open={pauseOpen} onOpenChange={setPauseOpen} onSubmit={handlePauseSubmit} />
    </div>
  )
}
