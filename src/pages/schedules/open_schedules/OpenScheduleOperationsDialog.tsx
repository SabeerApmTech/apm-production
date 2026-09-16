import { useState } from "react"
import { ArrowLeft, Check, Loader2, Pencil, Search, UserRound, Users, UsersRound, X } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { fromIsoDate } from "@/utils/date"
import { getAuthUser } from "@/utils/auth"
import { LoadingRow } from "@/shared/LoadingRow"
import { useGetOperatorsQuery } from "@/store/services/userManagementApi"
import {
  useGetAllocatedStaffQuery,
  useLazyGetLastAssignedTeamQuery,
  useAllocateStaffMutation,
} from "@/store/services/staffAllocationApi"
import {
  useGetOpenScheduleOperationsQuery,
  useConsumeScheduleStockMutation,
  useUpdateScheduleToProduceMutation,
} from "@/store/services/openScheduleApi"
import type { AllocatedStaffMember, LastTeamMember } from "@/types/staffAllocation"
import type { OpenScheduleOperation } from "@/types/openSchedule"

const UNSET = Symbol("unset")

/* ── Manage Team view (rendered inside the same dialog, not a separate one) ────────────
   Reuses the existing generic staff-allocation endpoints (keyed by scheduleOperationId,
   the same underlying operation entity id whether it came from a pending or an open
   schedule) — no new staff-allocation API needed for this. */
interface ManageTeamViewProps {
  openScheduleId: number
  step: { operationId: number; sequenceNo: number; operationName: string }
  onBack: () => void
}

function ManageTeamView({ openScheduleId, step, onBack }: ManageTeamViewProps) {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { data: operators } = useGetOperatorsQuery()
  const { data: allocatedStaff } = useGetAllocatedStaffQuery(step.operationId)
  const [fetchLastTeam, { isFetching: isFetchingLastTeam }] = useLazyGetLastAssignedTeamQuery()
  const [allocateStaff, { isLoading: isSaving }] = useAllocateStaffMutation()

  // Pre-select whoever is already allocated to this operation when the view opens, without an
  // effect — adjusting state during render avoids the extra post-mount render pass a useEffect
  // would cost here. "Fetch Last Assigned Team" below fully replaces this selection with its own result.
  const [prevAllocatedStaff, setPrevAllocatedStaff] = useState<AllocatedStaffMember[] | undefined | typeof UNSET>(UNSET)
  if (allocatedStaff !== prevAllocatedStaff) {
    setPrevAllocatedStaff(allocatedStaff)
    if (allocatedStaff) {
      setSelected(new Set(allocatedStaff.map((m) => m.employeeId)))
    }
  }

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
    setSelected(new Set(result.data.map((m: LastTeamMember) => m.employeeId)))
  }

  async function handleConfirm() {
    const user = getAuthUser()
    if (!user) return
    try {
      await allocateStaff({
        scheduleOperationId: step.operationId,
        employeeIds: [...selected],
        allocatedByEmpId: user.employeeId,
        pendingScheduleId: openScheduleId,
      }).unwrap()
      onBack()
    } catch {
      // Toast middleware already surfaced the error; stay on this view so the user can retry.
    }
  }

  return (
    <>
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

      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex flex-col gap-3 px-5 pt-3 shrink-0">
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
        </div>

        <div className="grid grid-cols-3 gap-2.5 px-5 pt-3 pb-4 overflow-y-auto flex-1 min-h-0">
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
                  <p className="wrap-break-word text-sm font-semibold">{emp.employeeName}</p>
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

/* ── One operation step: planned/available/produced read-outs, each editable value (Stock Used,
   To Produce) sitting behind its own pencil icon rather than always showing an open input ── */
function OperationStepRow({ op, openScheduleId, onManageTeam }: {
  op: OpenScheduleOperation
  openScheduleId: number
  onManageTeam: () => void
}) {
  const [editingField, setEditingField] = useState<"stock" | "produce" | null>(null)
  const [consumeQty, setConsumeQty] = useState("")
  const [toProduce, setToProduce] = useState(String(op.toProduce))
  const [consumeStock, { isLoading: consuming }] = useConsumeScheduleStockMutation()
  const [updateToProduce, { isLoading: savingToProduce }] = useUpdateScheduleToProduceMutation()

  // Keeps the field in sync when the row's own server value changes (a refetch after another
  // edit), without clobbering what the user is mid-typing — adjusting state during render only
  // resets it when `op.toProduce` itself actually changes, not on every render.
  const [prevServerToProduce, setPrevServerToProduce] = useState(op.toProduce)
  if (op.toProduce !== prevServerToProduce) {
    setPrevServerToProduce(op.toProduce)
    setToProduce(String(op.toProduce))
  }

  function openStockEditor() {
    setConsumeQty(String(op.stockUsed))
    setEditingField("stock")
  }

  function openProduceEditor() {
    setToProduce(String(op.toProduce))
    setEditingField("produce")
  }

  async function handleConsume() {
    const qty = Number(consumeQty)
    if (!qty || qty <= 0) return
    const user = getAuthUser()
    if (!user) return
    try {
      await consumeStock({
        scheduleOperationId: op.operationId,
        consumeStockQty: qty,
        updatedByEmpId: user.employeeId,
        openScheduleId,
      }).unwrap()
      setConsumeQty("")
      setEditingField(null)
    } catch {
      // Toast middleware already surfaced the error; keep the editor open so the user can retry.
    }
  }

  async function handleSaveToProduce() {
    const qty = Number(toProduce)
    if (!qty || qty === op.toProduce) { setEditingField(null); return }
    const user = getAuthUser()
    if (!user) return
    try {
      await updateToProduce({
        scheduleOperationId: op.operationId,
        toProduceQty: qty,
        updatedByEmpId: user.employeeId,
        openScheduleId,
      }).unwrap()
      setEditingField(null)
    } catch {
      // Toast middleware already surfaced the error; keep the editor open so the user can retry.
    }
  }

  // "Planned = whatever's allocated from stock + whatever still needs producing" — the allocated
  // half is just the complement of To Produce, not read from Available/Used Stock directly, since
  // those track the stock ledger itself rather than how much of *this* plan they cover.
  const allocatedFromStock = Math.max(op.plannedQty - op.toProduce, 0)

  return (
    <div className={cn(
      "flex flex-col gap-3 rounded-2xl border p-4",
      op.noOfOperators === 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
    )}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900">
            <div className="h-3.5 w-3.5 rounded-full border-[3px] border-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Step {op.sequenceNo}</p>
            <p className="wrap-break-word text-sm font-semibold text-gray-900">{op.operationName}</p>
            <div className="mt-1 flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs text-gray-500">{op.noOfOperators} operators</span>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-gray-400">Planned Qty</span>
            <span className="text-sm font-semibold text-blue-600">{op.plannedQty}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="w-24 shrink-0 text-[11px] font-medium text-gray-400">Available Stock</span>
              <span className="text-sm font-semibold text-green-600">{op.availableStock}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-24 shrink-0 text-[11px] font-medium text-gray-400">Stock Used</span>
              {editingField === "stock" ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="number" min={0} max={op.availableStock}
                    value={consumeQty}
                    onChange={(e) => setConsumeQty(e.target.value)}
                    disabled={consuming || op.availableStock === 0}
                    autoFocus
                    className="h-8 w-24 text-sm"
                  />
                  <Button type="button" size="sm" className="h-8 px-2.5" disabled={consuming || !consumeQty} onClick={handleConsume}>
                    {consuming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Go"}
                  </Button>
                  <button
                    type="button" onClick={() => setEditingField(null)} disabled={consuming}
                    aria-label="Cancel" className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-sm font-semibold text-amber-600">{op.stockUsed}</span>
                  <button
                    type="button" onClick={openStockEditor} aria-label="Edit stock used"
                    className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-gray-400">To Produce</span>
            {editingField === "produce" ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number" min={0}
                  value={toProduce}
                  onChange={(e) => setToProduce(e.target.value)}
                  disabled={savingToProduce}
                  autoFocus
                  className="h-8 w-24 text-sm font-semibold text-violet-600"
                />
                <Button type="button" size="sm" className="h-8 px-2.5" disabled={savingToProduce} onClick={handleSaveToProduce}>
                  {savingToProduce ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
                </Button>
                <button
                  type="button" onClick={() => setEditingField(null)} disabled={savingToProduce}
                  aria-label="Cancel" className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-violet-600">{op.toProduce}</span>
                <button
                  type="button" onClick={openProduceEditor} aria-label="Edit to produce"
                  className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onManageTeam}
          className="shrink-0 rounded-full bg-amber-400 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-amber-500"
        >
          Manage Team
        </button>
      </div>

      <p className="rounded-lg bg-green-100 px-3 py-2 text-xs font-medium text-green-700">
        {allocatedFromStock} Units will be allocated from existing stock. Only {op.toProduce} Units need to be produced.
      </p>
    </div>
  )
}

/* ── Operations Dialog ───────────────────────────────────── */
interface OpenScheduleOperationsDialogProps {
  open: boolean
  onClose: () => void
  openScheduleId?: number | null
}

export function OpenScheduleOperationsDialog({ open, onClose, openScheduleId }: OpenScheduleOperationsDialogProps) {
  const [manageStep, setManageStep] = useState<OpenScheduleOperation | null>(null)

  const { data: operations, isLoading } = useGetOpenScheduleOperationsQuery(openScheduleId ?? 0, {
    skip: openScheduleId == null,
  })

  const handleClose = () => {
    setManageStep(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="max-w-2xl w-full p-0 gap-0 flex flex-col max-h-[85vh] overflow-hidden">
        {manageStep && openScheduleId != null ? (
          <ManageTeamView
            openScheduleId={openScheduleId}
            step={manageStep}
            onBack={() => setManageStep(null)}
          />
        ) : (
          <>
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
              <DialogTitle className="text-lg font-semibold">Operations</DialogTitle>
            </div>

            <div className="flex flex-col gap-3 px-6 py-4 overflow-y-auto flex-1 min-h-0">
              {isLoading && (
                <LoadingRow label="Loading operations…" className="justify-center py-8 text-gray-400" />
              )}
              {!isLoading && openScheduleId != null && (operations ?? []).map((op) => (
                <OperationStepRow
                  key={op.operationId}
                  op={op}
                  openScheduleId={openScheduleId}
                  onManageTeam={() => setManageStep(op)}
                />
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
