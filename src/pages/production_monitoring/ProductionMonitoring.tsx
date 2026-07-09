import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { ChevronLeft } from "lucide-react"
import { getOperatorUser } from "@/utils/auth"
import {
  useLazyGetOperatorSchedulesQuery,
  useLazyGetOperatorOperationsQuery,
  useLazyGetOperatorLogReportQuery,
  useOperatorActionMutation,
} from "@/store/services/productionMonitoringApi"
import type { LogReportEntry, OperatorActionRequest, OperatorSchedule } from "@/types/productionMonitoring"
import type { Operation, Schedule, ScheduleType, ViewStep } from "./types"
import { ScheduleTypeSelect }  from "./ScheduleTypeSelect"
import { ScheduleList }        from "./ScheduleList"
import { OperationCards }      from "./OperationCards"
import { WorkingView }         from "./WorkingView"
import { StopDialog }          from "./StopDialog"
import { PauseDialog }         from "./PauseDialog"

export const ProductionMonitoring = () => {
  const operatorUser = getOperatorUser()
  const employeeId = operatorUser?.employeeId ?? ""

  const [view,               setView]               = useState<ViewStep>("loading")
  const [scheduleType,       setScheduleType]       = useState<ScheduleType | null>(null)
  const [schedules,          setSchedules]          = useState<OperatorSchedule[]>([])
  const [selectedSchedule,   setSelectedSchedule]   = useState<Schedule | null>(null)
  const [operations,         setOperations]         = useState<Operation[]>([])
  const [selectedOperation,  setSelectedOperation]  = useState<Operation | null>(null)
  const [logs,               setLogs]               = useState<LogReportEntry[]>([])
  const [activeHours,        setActiveHours]        = useState("0.00")
  const [idleHours,          setIdleHours]           = useState("0.00")
  // True when we jumped straight to "working" because operator-schedules said this operator
  // is already mid-session — there's no operations list to go "back" to in that case.
  const [cameFromAutoRoute,  setCameFromAutoRoute]  = useState(false)
  const [stopOpen,           setStopOpen]           = useState(false)
  const [pauseOpen,          setPauseOpen]          = useState(false)

  const [fetchSchedules]  = useLazyGetOperatorSchedulesQuery()
  const [fetchOperations] = useLazyGetOperatorOperationsQuery()
  const [fetchLogReport]  = useLazyGetOperatorLogReportQuery()
  const [operatorAction]  = useOperatorActionMutation()

  const loadLogReport = async (scheduleId: string, sequenceNo: number) => {
    const report = await fetchLogReport({ employeeId, scheduleId, sequenceNo }, false).unwrap()
    setLogs(report.logs)
    setActiveHours(report.activeHours)
    setIdleHours(report.idleHours)
  }

  // Runs exactly once per mount, and every step explicitly awaits the network response instead
  // of trusting a reactive query's cache — this is live work state and must always reflect what
  // the server says right now, never a stale snapshot from a previous login.
  useEffect(() => {
    if (!operatorUser) return
    let cancelled = false

    ;(async () => {
      try {
        const data = await fetchSchedules(employeeId, false).unwrap()
        if (cancelled) return
        setSchedules(data)

        const active = data.find(s => s.isWorking)
        if (active) {
          setSelectedSchedule(active)
          setCameFromAutoRoute(true)
          setView("working")

          const ops = await fetchOperations({ employeeId, scheduleId: active.scheduleId }, false).unwrap()
          if (cancelled) return
          setOperations(ops)

          const match = ops.find(o => o.sequenceNo === active.sequenceNo)
          if (!match) return
          setSelectedOperation(match)
          await loadLogReport(active.scheduleId, match.sequenceNo)
        } else if (data.length === 0) {
          setView("empty")
        } else {
          setView("type")
        }
      } catch {
        // Toast middleware already surfaced the error.
      }
    })()

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!operatorUser) return <Navigate to="/operator-login" replace />

  const filteredSchedules = schedules.filter(s => {
    const type = s.scheduleType ?? "PRODUCTION"
    return scheduleType === "production" ? type === "PRODUCTION" : type === "REWORK"
  })

  const selectSchedule = async (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    try {
      const ops = await fetchOperations({ employeeId, scheduleId: schedule.scheduleId }, false).unwrap()
      setOperations(ops)
      setView("operations")
    } catch {
      setSelectedSchedule(null)
      // Toast middleware already surfaced the error; stay on this view so the user can retry.
    }
  }

  const selectOperation = async (schedule: Schedule, operation: Operation) => {
    setSelectedOperation(operation)
    try {
      await loadLogReport(schedule.scheduleId, operation.sequenceNo)
      setView("working")
    } catch {
      setSelectedOperation(null)
      // Toast middleware already surfaced the error; stay on this view so the user can retry.
    }
  }

  const goBack = () => {
    if (view === "list") { setView("type"); setScheduleType(null) }
    else if (view === "operations") { setView("list"); setSelectedSchedule(null); setOperations([]) }
    else if (view === "working" && !cameFromAutoRoute) {
      setView("operations")
      setSelectedOperation(null)
      setLogs([])
    }
  }
  const showBack = view === "list" || view === "operations" || (view === "working" && !cameFromAutoRoute)

  const currentEvent = logs.length ? logs[logs.length - 1].logEvent : null

  const buildActionBase = () => ({
    employeeId,
    scheduleId: selectedSchedule?.scheduleId ?? "",
    sequenceNo: selectedOperation?.sequenceNo ?? 0,
    operationName: selectedOperation?.operationName ?? "",
  })

  const runAction = async (payload: OperatorActionRequest) => {
    try {
      await operatorAction(payload).unwrap()
      if (selectedSchedule && selectedOperation) {
        await loadLogReport(selectedSchedule.scheduleId, selectedOperation.sequenceNo)
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

  const handleStopSave = ({ successQty, rejectedQty, remarks }: { successQty: string; rejectedQty: string; remarks: string }) => {
    runAction({
      ...buildActionBase(),
      action: "STOP",
      successfulQty: successQty ? Number(successQty) : 0,
      rejectedQty: rejectedQty ? Number(rejectedQty) : 0,
      reason: "", remarks,
    })
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

      <p className="shrink-0 text-xs font-semibold text-red-500 mb-4">
        {operatorUser.employeeName} - {operatorUser.employeeId}
      </p>

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
          <ScheduleTypeSelect onSelect={type => { setScheduleType(type); setView("list") }} />
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

      <StopDialog open={stopOpen} onOpenChange={setStopOpen} operation={selectedOperation} onSave={handleStopSave} />
      <PauseDialog open={pauseOpen} onOpenChange={setPauseOpen} onSubmit={handlePauseSubmit} />
    </div>
  )
}
