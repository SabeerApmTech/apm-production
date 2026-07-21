import { useNavigate, useSearchParams } from "react-router-dom"
import { ChevronLeft } from "lucide-react"
import {
  useGetOperatorSchedulesQuery,
  useGetOperatorOperationsQuery,
  useGetOperatorLogReportQuery,
} from "@/store/services/productionMonitoringApi"
import {
  useGetOperatorReworkSchedulesQuery,
  useGetOperatorReworkOperationsQuery,
  useGetOperatorReworkLogReportQuery,
} from "@/store/services/reworkMonitoringApi"
import { WorkingView } from "@/pages/production_monitoring/WorkingView"
import { LoadingRow } from "@/shared/LoadingRow"

const POLL_INTERVAL_MS = 3000

/**
 * Read-only "Log Report" for another operator's current work — reached from the "View Detail"
 * button on Live Tracking, reusing the same WorkingView layout Production Monitoring shows an
 * operator for their own job, minus the Start/Pause/Stop controls. Production and rework schedules
 * live behind separate endpoints, so both are queried and whichever one actually contains the
 * requested scheduleId is used for the operations/log-report follow-up calls.
 */
export function OperatorLogReport() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const employeeId = searchParams.get("employeeId") ?? ""
  const employeeName = searchParams.get("employeeName") ?? ""
  const scheduleId = searchParams.get("scheduleId") ?? ""
  const operationName = searchParams.get("operationName") ?? ""

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

  const { data: productionOperations, isLoading: isProductionOperationsLoading } = useGetOperatorOperationsQuery(
    { employeeId, scheduleId },
    { skip: isSchedulesLoading || isRework || !employeeId || !scheduleId }
  )
  const { data: reworkOperations, isLoading: isReworkOperationsLoading } = useGetOperatorReworkOperationsQuery(
    { employeeId, scheduleId },
    { skip: isSchedulesLoading || !isRework || !employeeId || !scheduleId }
  )
  const operations = isRework ? reworkOperations : productionOperations
  const isOperationsLoading = isRework ? isReworkOperationsLoading : isProductionOperationsLoading
  const operation = operations?.find((o) => o.operationName === operationName) ?? operations?.[0]

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
            logs={report?.logs ?? []}
            activeHours={report?.activeHours ?? "0.00"}
            idleHours={report?.idleHours ?? "0.00"}
            readOnly
          />
        )}
      </div>
    </div>
  )
}
