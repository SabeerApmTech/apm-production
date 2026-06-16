import { useState, useMemo } from "react"
import { Search, Users, UserRound, Check, UsersRound, ArrowLeft } from "lucide-react"
import {
  Dialog, DialogContent, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/* ── Types ─────────────────────────────────────────────── */
interface OperationStep {
  id: string
  step: number
  name: string
  operatorCount: number
}

interface OperatorEmployee {
  id: string
  name: string
  dob: string
  employeeId: string
}

/* ── Mock data ──────────────────────────────────────────── */
const DEFAULT_OPERATIONS: OperationStep[] = [
  { id: "op-1", step: 1, name: "Preprocessing",    operatorCount: 9 },
  { id: "op-2", step: 2, name: "Firmware Flashing", operatorCount: 0 },
  { id: "op-3", step: 3, name: "Battery Fixing",    operatorCount: 3 },
]

const MOCK_EMPLOYEES: OperatorEmployee[] = [
  { id: "e1", name: "Nithish",  dob: "16/11/1996", employeeId: "APM001" },
  { id: "e2", name: "Rugan",    dob: "16/11/1996", employeeId: "APM004" },
  { id: "e3", name: "Aravinth", dob: "16/11/1996", employeeId: "APM001" },
  { id: "e4", name: "Nithish",  dob: "16/11/1996", employeeId: "APM005" },
  { id: "e5", name: "Rishan",   dob: "16/11/1996", employeeId: "APM006" },
  { id: "e6", name: "Nithish",  dob: "16/11/1996", employeeId: "APM007" },
]

/* ── Staff Allocation Dialog ────────────────────────────── */
interface StaffAllocationDialogProps {
  open: boolean
  onClose: () => void
  step: OperationStep
  initialSelected?: string[]
  onConfirm: (stepId: string, selectedIds: string[]) => void
}

function StaffAllocationDialog({
  open,
  onClose,
  step,
  initialSelected = [],
  onConfirm,
}: StaffAllocationDialogProps) {
  const [search, setSearch]     = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected))

  const filtered = useMemo(
    () =>
      MOCK_EMPLOYEES.filter(
        (e) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.employeeId.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  )

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function fetchLastTeam() {
    setSelected(new Set(["e2", "e3", "e5"]))
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg w-full p-0 gap-0 flex flex-col max-h-[88vh] overflow-hidden">

        {/* Header — custom to include back arrow */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to operations"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <DialogTitle className="text-base font-semibold leading-tight">Staff Allocation</DialogTitle>
            <p className="text-xs text-gray-400 mt-0.5">Step {step.step} — {step.name}</p>
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
              onClick={fetchLastTeam}
              className="flex items-center gap-2 rounded-lg bg-red-400 hover:bg-red-500 px-3 py-1.5 text-sm font-medium text-white transition-colors"
            >
              <UsersRound className="h-4 w-4" />
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
              const isSelected = selected.has(emp.id)
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => toggle(emp.id)}
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
                    <p className="truncate text-sm font-semibold">{emp.name}</p>
                    <p className={cn("text-xs mt-0.5", isSelected ? "text-gray-400" : "text-gray-500")}>
                      DOB : {emp.dob}
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
            onClick={() => { onConfirm(step.id, [...selected]); onClose() }}
            className="w-full rounded-full bg-green-500 hover:bg-green-600 text-white font-semibold h-11"
          >
            Confirm Selection
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  )
}

/* ── Allocation Dialog (Operations) ─────────────────────── */
interface AllocationDialogProps {
  open: boolean
  onClose: () => void
  scheduleId?: number | null
  operations?: OperationStep[]
  onSubmit?: (assignments: Record<string, string[]>) => void
}

export function AllocationDialog({
  open,
  onClose,
  operations = DEFAULT_OPERATIONS,
  onSubmit,
}: AllocationDialogProps) {
  const [ops, setOps]                 = useState<OperationStep[]>(operations)
  const [manageStep, setManageStep]   = useState<OperationStep | null>(null)
  const [assignments, setAssignments] = useState<Record<string, string[]>>({})

  function handleTeamConfirm(stepId: string, ids: string[]) {
    setAssignments((prev) => ({ ...prev, [stepId]: ids }))
    setOps((prev) =>
      prev.map((op) => (op.id === stepId ? { ...op, operatorCount: ids.length } : op))
    )
    setManageStep(null)
  }

  function handleSubmit() {
    onSubmit?.(assignments)
    onClose()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
        <DialogContent className="max-w-md w-full p-0 gap-0 flex flex-col max-h-[85vh] overflow-hidden">

          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
            <DialogTitle className="text-lg font-semibold">Operations</DialogTitle>
          </div>

          {/* Steps — scrollable */}
          <div className="flex flex-col gap-3 px-6 py-4 overflow-y-auto flex-1 min-h-0">
            {ops.map((op) => (
              <div
                key={op.id}
                className="flex items-center justify-between rounded-2xl bg-gray-100 px-4 py-3.5 gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900">
                    <div className="h-[14px] w-[14px] rounded-full border-[3px] border-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                      Step {op.step}
                    </p>
                    <p className="truncate text-sm font-semibold text-gray-900">{op.name}</p>
                    <div className="mt-0.5 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs text-gray-500">{op.operatorCount} operators</span>
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
          </div>

          {/* Footer */}
          <DialogFooter className="mt-0 px-6 py-4 border-t border-gray-100 gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            >
              Submit
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>

      {manageStep && (
        <StaffAllocationDialog
          open={Boolean(manageStep)}
          onClose={() => setManageStep(null)}
          step={manageStep}
          initialSelected={assignments[manageStep.id] ?? []}
          onConfirm={handleTeamConfirm}
        />
      )}
    </>
  )
}
