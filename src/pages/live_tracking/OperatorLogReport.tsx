import { useNavigate, useSearchParams } from "react-router-dom"
import { ChevronLeft, Loader2 } from "lucide-react"
import {
  useGetOperatorSchedulesQuery,
  useGetOperatorOperationsQuery,
  useGetOperatorLogReportQuery,
} from "@/store/services/productionMonitoringApi"
import { WorkingView } from "@/pages/production_monitoring/WorkingView"

const POLL_INTERVAL_MS = 3000

/**
 * Read-only "Log Report" for another operator's current work — reached from the "View Detail"
 * button on Live Tracking, reusing the same WorkingView layout Production Monitoring shows an
 * operator for their own job, minus the Start/Pause/Stop controls.
 */
export function OperatorLogReport() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const employeeId = searchParams.get("employeeId") ?? ""
  const employeeName = searchParams.get("employeeName") ?? ""
  const scheduleId = searchParams.get("scheduleId") ?? ""
  const operationName = searchParams.get("operationName") ?? ""

  const { data: schedules, isLoading: isSchedulesLoading } = useGetOperatorSchedulesQuery(employeeId, {
    skip: !employeeId,
  })
  const schedule = schedules?.find((s) => s.scheduleId === scheduleId)

  const { data: operations, isLoading: isOperationsLoading } = useGetOperatorOperationsQuery(
    { employeeId, scheduleId },
    { skip: !employeeId || !scheduleId }
  )
  const operation = operations?.find((o) => o.operationName === operationName) ?? operations?.[0]

  const { data: report, isLoading: isReportLoading } = useGetOperatorLogReportQuery(
    { employeeId, scheduleId, sequenceNo: operation?.sequenceNo ?? 0 },
    { skip: !employeeId || !scheduleId || !operation, pollingInterval: POLL_INTERVAL_MS }
  )

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
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        )}

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
