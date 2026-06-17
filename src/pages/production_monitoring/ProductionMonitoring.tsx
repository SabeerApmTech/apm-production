import { useState } from "react"
import { ChevronLeft } from "lucide-react"
import { formatNow } from "./data"
import type { Employee, LogEntry, Operation, Schedule, ScheduleType, StepStatus, ViewStep } from "./types"
import { EmployeeSelect }      from "./EmployeeSelect"
import { ScheduleTypeSelect }  from "./ScheduleTypeSelect"
import { ScheduleList }        from "./ScheduleList"
import { OperationCards }      from "./OperationCards"
import { WorkingView }         from "./WorkingView"
import { StopDialog }          from "./StopDialog"
import { PauseDialog }         from "./PauseDialog"

export const ProductionMonitoring = () => {
  const [view,              setView]              = useState<ViewStep>("employee")
  const [employee,          setEmployee]          = useState<Employee | null>(null)
  const [scheduleType,      setScheduleType]      = useState<ScheduleType | null>(null)
  const [selectedSchedule,  setSelectedSchedule]  = useState<Schedule | null>(null)
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null)
  const [stepStatus,        setStepStatus]        = useState<StepStatus>("idle")
  const [logEntries,        setLogEntries]        = useState<LogEntry[]>([])
  const [stopOpen,          setStopOpen]          = useState(false)
  const [pauseOpen,         setPauseOpen]         = useState(false)

  // ── Navigation ──────────────────────────────────────────────────────────────
  const goBack = () => {
    if      (view === "type")       { setView("employee");  setEmployee(null) }
    else if (view === "schedules")  { setView("type");      setScheduleType(null) }
    else if (view === "operations") { setView("schedules"); setSelectedSchedule(null) }
    else if (view === "working")    {
      setView("operations")
      setSelectedOperation(null)
      setStepStatus("idle")
      setLogEntries([])
    }
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleStart = () => {
    const isResume = stepStatus === "paused"
    setStepStatus("running")
    setLogEntries(prev => [...prev, {
      dateTime: formatNow(), status: isResume ? "Resumed" : "Started",
      successQty: null, rejectedQty: null, reason: null, remarks: null,
    }])
  }

  const handleStopSave = ({ successQty, rejectedQty, remarks }: { successQty: string; rejectedQty: string; remarks: string }) => {
    setStepStatus("stopped")
    setLogEntries(prev => [...prev, {
      dateTime: formatNow(), status: "Stopped",
      successQty:  successQty  ? Number(successQty)  : null,
      rejectedQty: rejectedQty ? Number(rejectedQty) : null,
      reason: null, remarks: remarks || null,
    }])
    setStopOpen(false)
  }

  const handlePauseSubmit = ({ reason, remarks }: { reason: string; remarks: string }) => {
    setStepStatus("paused")
    setLogEntries(prev => [...prev, {
      dateTime: formatNow(), status: "Paused",
      successQty: null, rejectedQty: null,
      reason, remarks: remarks || null,
    }])
    setPauseOpen(false)
  }

  const selectOperation = (op: Operation) => {
    setSelectedOperation(op)
    setStepStatus("idle")
    setLogEntries([])
    setView("working")
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl">

      {view !== "employee" && (
        <button
          onClick={goBack}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </button>
      )}

      {view !== "employee" && employee && (
        <p className="text-xs font-semibold text-red-500 mb-4">
          {employee.name} - {employee.id}
        </p>
      )}

      {view === "employee" && (
        <EmployeeSelect onSubmit={emp => { setEmployee(emp); setView("type") }} />
      )}

      {view === "type" && (
        <ScheduleTypeSelect onSelect={type => { setScheduleType(type); setView("schedules") }} />
      )}

      {view === "schedules" && scheduleType && (
        <ScheduleList
          scheduleType={scheduleType}
          onSelect={s => { setSelectedSchedule(s); setView("operations") }}
        />
      )}

      {view === "operations" && selectedSchedule && (
        <OperationCards schedule={selectedSchedule} onSelect={selectOperation} />
      )}

      {view === "working" && selectedSchedule && selectedOperation && (
        <WorkingView
          schedule={selectedSchedule}
          operation={selectedOperation}
          stepStatus={stepStatus}
          logEntries={logEntries}
          onStart={handleStart}
          onPause={() => setPauseOpen(true)}
          onStop={() => setStopOpen(true)}
        />
      )}

      <StopDialog
        open={stopOpen}
        onOpenChange={setStopOpen}
        operation={selectedOperation}
        onSave={handleStopSave}
      />

      <PauseDialog
        open={pauseOpen}
        onOpenChange={setPauseOpen}
        onSubmit={handlePauseSubmit}
      />

    </div>
  )
}
