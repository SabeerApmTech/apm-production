import { useEffect, useState } from "react"
import { ArrowLeft, Check, Loader2, Search, UserRound, Users, UsersRound } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { fromIsoDate } from "@/utils/date"
import { getAuthUser } from "@/utils/auth"
import { LoadingRow } from "@/shared/LoadingRow"
import { useGetOperatorsQuery } from "@/store/services/userManagementApi"
import {
  useGetOperationsByScheduleQuery,
  useGetAllocatedStaffQuery,
  useLazyGetLastAssignedTeamQuery,
  useAllocateStaffMutation,
} from "@/store/services/staffAllocationApi"
import type { OperationStepRecord } from "@/types/staffAllocation"

/* ── Manage Team view (rendered inside the same dialog, not a separate one) ── */
interface ManageTeamViewProps {
  pendingScheduleId: number
  step: OperationStepRecord
  onBack: () => void
}

function ManageTeamView({ pendingScheduleId, step, onBack }: ManageTeamViewProps) {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { data: operators } = useGetOperatorsQuery()
  const { data: allocatedStaff } = useGetAllocatedStaffQuery(step.operationId)
  const [fetchLastTeam, { isFetching: isFetchingLastTeam }] = useLazyGetLastAssignedTeamQuery()
  const [allocateStaff, { isLoading: isSaving }] = useAllocateStaffMutation()

  // Pre-select whoever is already allocated to this operation when the view opens.
  // "Fetch Last Assigned Team" below fully replaces this selection with its own result.
  useEffect(() => {
    if (allocatedStaff) {
      setSelected(new Set(allocatedStaff.map((m) => m.employeeId)))
    }
  }, [allocatedStaff])

  const activeOperators = (operators ?? []).filter((o) => o.isActive)
  const filtered = activeOperators.filter(
    (e) =>
      e.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(search.toLowerCase())
  )

  function toggle(employeeId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(employeeId)) { next.delete(employeeId) } else { next.add(employeeId) }
      return next
    })
  }

  async function handleFetchLastTeam() {
    const result = await fetchLastTeam(step.operationId).unwrap()
    if (result.data.length === 0) {
      toast.info(result.message)
      return
    }
    setSelected(new Set(result.data.map((m) => m.employeeId)))
  }

  async function handleConfirm() {
    const user = getAuthUser()
    if (!user) return
    try {
      await allocateStaff({
        scheduleOperationId: step.operationId,
        employeeIds: [...selected],
        allocatedByEmpId: user.employeeId,
        pendingScheduleId,
      }).unwrap()
      onBack()
    } catch {
      // Toast middleware already surfaced the error; stay on this view so the user can retry.
    }
  }

  return (
    <>
      {/* Header — includes back arrow to return to the steps list, not close the dialog */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to operations"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <DialogTitle className="text-base font-semibold leading-tight">Staff Allocation</DialogTitle>
          <p className="text-xs text-gray-400 mt-0.5">Step {step.sequenceNo} — {step.operationName}</p>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex flex-col gap-3 px-5 pt-3 pb-0 overflow-y-auto flex-1 min-h-0">

        {/* Selection count + fetch */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm font-semibold text-gray-700">
            Selection Count :{" "}
            <span className="text-blue-600">{selected.size}</span>
          </span>
          <button
            onClick={handleFetchLastTeam}
            disabled={isFetchingLastTeam}
            className="flex items-center gap-2 rounded-lg bg-red-400 hover:bg-red-500 px-3 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
          >
            {isFetchingLastTeam ? <Loader2 className="h-4 w-4 animate-spin" /> : <UsersRound className="h-4 w-4" />}
            Fetch Last Assigned Team
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or employee ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Employee grid */}
        <div className="grid grid-cols-2 gap-2.5 pb-4">
          {filtered.length === 0 && (
            <p className="col-span-2 py-8 text-center text-sm text-gray-400">No employees found</p>
          )}
          {filtered.map((emp) => {
            const isSelected = selected.has(emp.employeeId)
            return (
              <button
                key={emp.usersId}
                type="button"
                onClick={() => toggle(emp.employeeId)}
                className={cn(
                  "flex items-center gap-3 rounded-xl p-3 text-left transition-all duration-150 border",
                  isSelected
                    ? "bg-gray-900 border-gray-700 text-white"
                    : "bg-gray-100 border-transparent text-gray-900 hover:bg-gray-200"
                )}
              >
                <div className="relative shrink-0">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    isSelected ? "bg-gray-700" : "bg-gray-300"
                  )}>
                    <UserRound className={cn("h-5 w-5", isSelected ? "text-gray-300" : "text-gray-500")} />
                  </div>
                  {isSelected && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 ring-2 ring-gray-900">
                      <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{emp.employeeName}</p>
                  <p className={cn("text-xs mt-0.5", isSelected ? "text-gray-400" : "text-gray-500")}>
                    DOB : {fromIsoDate(emp.dateOfBirth)}
                  </p>
                  <p className={cn("text-xs", isSelected ? "text-gray-400" : "text-gray-500")}>
                    Employee Id : {emp.employeeId}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Sticky footer */}
      <div className="px-5 py-4 border-t border-gray-100 shrink-0">
        <Button
          onClick={handleConfirm}
          disabled={isSaving}
          className="w-full rounded-full bg-green-500 hover:bg-green-600 text-white font-semibold h-11"
        >
          {isSaving ? "Saving..." : "Confirm Selection"}
        </Button>
      </div>
    </>
  )
}

/* ── Allocation Dialog (Operations) ─────────────────────── */
interface AllocationDialogProps {
  open: boolean
  onClose: () => void
  scheduleId?: number | null
}

export function AllocationDialog({ open, onClose, scheduleId }: AllocationDialogProps) {
  const [manageStep, setManageStep] = useState<OperationStepRecord | null>(null)

  const { data: operations, isLoading } = useGetOperationsByScheduleQuery(scheduleId ?? 0, {
    skip: scheduleId == null,
  })

  const handleClose = () => {
    setManageStep(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="max-w-md w-full p-0 gap-0 flex flex-col max-h-[85vh] overflow-hidden">
        {manageStep && scheduleId != null ? (
          <ManageTeamView
            pendingScheduleId={scheduleId}
            step={manageStep}
            onBack={() => setManageStep(null)}
          />
        ) : (
          <>
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
              <DialogTitle className="text-lg font-semibold">Operations</DialogTitle>
            </div>

            {/* Steps — scrollable */}
            <div className="flex flex-col gap-3 px-6 py-4 overflow-y-auto flex-1 min-h-0">
              {isLoading && (
                <LoadingRow label="Loading operations…" className="justify-center py-8 text-gray-400" />
              )}
              {!isLoading && (operations ?? []).map((op) => (
                <div
                  key={op.operationId}
                  className="flex items-start justify-between rounded-2xl bg-gray-100 px-4 py-3.5 gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900">
                      <div className="h-3.5 w-3.5 rounded-full border-[3px] border-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                        Step {op.sequenceNo}
                      </p>
                      <p className="wrap-break-word text-sm font-semibold text-gray-900">{op.operationName}</p>
                      <div className="mt-0.5 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500">{op.allocatedOperatorCount} operators</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setManageStep(op)}
                    className="shrink-0 rounded-full bg-amber-400 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-amber-500"
                  >
                    Manage Team
                  </button>
                </div>
              ))}
              {!isLoading && (operations ?? []).length === 0 && (
                <p className="py-8 text-center text-sm text-gray-400">No operations found for this schedule</p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
