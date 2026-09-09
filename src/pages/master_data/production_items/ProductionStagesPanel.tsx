import { useState, type FormEvent } from "react"
import { Pencil, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { DangerIconButton } from "@/shared/DangerIconButton"
import { LoadingRow } from "@/shared/LoadingRow"
import { useGetProcessTeamsQuery } from "@/store/services/processTeamApi"
import {
  useGetProductionItemOperationsQuery, useAddProductionItemOperationMutation,
  useEditProductionItemOperationMutation, useDeleteProductionItemOperationsMutation,
} from "@/store/services/productionItemApi"
import type { ProductionOperationRequest } from "@/types/productionItem"

function OperationForm({ initial, saving, onSave, onCancel }: {
  initial?: ProductionOperationRequest
  saving: boolean
  onSave: (body: ProductionOperationRequest) => Promise<void>
  onCancel: () => void
}) {
  const [code, setCode] = useState(initial?.operationCode ?? "")
  const [name, setName] = useState(initial?.operationName ?? "")
  const [team, setTeam] = useState(initial?.processTeamName ?? "")
  const [qr, setQr] = useState(initial?.isQrApplicable ?? false)
  const { data: teams = [], isLoading, isError } = useGetProcessTeamsQuery()
  const options = teams.filter((t) => t.isActive || t.processTeamName === initial?.processTeamName)
  const canSave = !saving && !!code.trim() && !!name.trim() && !!team

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (canSave) void onSave({ operationCode: code.trim(), operationName: name.trim(), processTeamName: team, isQrApplicable: qr })
  }

  return (
    <form onSubmit={submit} className="space-y-3 border-b bg-blue-50/40 p-4">
      <div className="flex gap-2">
        <Input aria-label="Operation Code" placeholder="Operation code" className="w-28" value={code} onChange={(e) => setCode(e.target.value)} disabled={saving} required autoFocus />
        <Input aria-label="Operation Name" placeholder="Enter operation" className="min-w-0 flex-1" value={name} onChange={(e) => setName(e.target.value)} disabled={saving} required />
      </div>
      <Select value={team} onValueChange={setTeam} disabled={saving || isLoading}>
        <SelectTrigger aria-label="Process Team"><SelectValue placeholder={isLoading ? "Loading teams..." : "Select process team"} /></SelectTrigger>
        <SelectContent>
          {initial?.processTeamName && !options.some((t) => t.processTeamName === initial.processTeamName) && <SelectItem value={initial.processTeamName}>{initial.processTeamName}</SelectItem>}
          {options.map((t) => <SelectItem key={t.processTeamId} value={t.processTeamName}>{t.processTeamName}</SelectItem>)}
        </SelectContent>
      </Select>
      {isError && <p role="alert" className="text-sm text-red-600">Unable to load process teams. Reopen this form to retry.</p>}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={qr} onChange={(e) => setQr(e.target.checked)} disabled={saving} className="accent-blue-500" /> QR Applicable
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button type="submit" disabled={!canSave}>{saving ? "Saving..." : "Save"}</Button>
      </div>
    </form>
  )
}

export function ProductionStagesPanel({ productionItemId, className, onClose }: {
  productionItemId: number
  className?: string
  onClose?: () => void
}) {
  const [activeTab, setActiveTab] = useState<"production" | "rework">("production")
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [editingId, setEditingId] = useState<number | "new" | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { data: operations = [], isLoading, isError, refetch } = useGetProductionItemOperationsQuery(productionItemId, { skip: activeTab !== "production" })
  const [add, { isLoading: adding }] = useAddProductionItemOperationMutation()
  const [edit, { isLoading: editing }] = useEditProductionItemOperationMutation()
  const [remove, { isLoading: deleting }] = useDeleteProductionItemOperationsMutation()
  const busy = adding || editing || deleting
  const selected = operations.filter((op) => selectedIds.has(op.productionOperationId)).map((op) => op.productionOperationId)

  async function save(body: ProductionOperationRequest) {
    try {
      if (editingId === "new") await add({ productionItemId, body }).unwrap()
      else if (editingId !== null) await edit({ productionItemId, operationId: editingId, body }).unwrap()
      setEditingId(null)
    } catch {
      // The API middleware shows the error; retain the form for retry.
    }
  }

  async function deleteSelected() {
    if (busy || !selected.length) return
    try {
      await remove({ productionItemId, productionOperationIds: selected }).unwrap()
      setSelectedIds(new Set())
      if (typeof editingId === "number" && selected.includes(editingId)) setEditingId(null)
    } catch {
      // Keep the selection so the failed deletion can be retried.
    }
  }

  return (
    <div className={cn("flex w-105 shrink-0 self-start max-h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm", className)}>
      <div className="flex items-center border-b">
        <div role="tablist" aria-label="Operation stages" className="flex flex-1">
          {(["production", "rework"] as const).map((tab) => (
            <button key={tab} type="button" role="tab" id={`stage-tab-${tab}`} aria-controls="stage-panel" aria-selected={activeTab === tab} disabled={busy}
              onClick={() => { setActiveTab(tab); setSelectedIds(new Set()); setEditingId(null) }}
              className={cn("flex-1 py-3 text-sm font-medium", activeTab === tab ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500")}>
              {tab === "production" ? "Production Stage" : "Rework Stage"}
            </button>
          ))}
        </div>
        {onClose && <Button type="button" variant="ghost" size="icon" aria-label="Close operations" onClick={onClose} disabled={busy}><X className="h-4 w-4" /></Button>}
      </div>
      <div id="stage-panel" role="tabpanel" aria-labelledby={`stage-tab-${activeTab}`} className="min-h-0 overflow-y-auto">
        {activeTab === "rework" ? (
          <p className="p-10 text-center text-sm text-gray-500">Rework stages will be available soon.</p>
        ) : (
          <>
            <div className="flex items-center gap-2 border-b px-4 py-2">
              <DangerIconButton title="Delete selected operations" count={busy ? 0 : selected.length} onClick={() => setConfirmDelete(true)} size="sm" />
              <span className="flex-1" />
              <Button type="button" disabled={busy} onClick={() => setEditingId("new")}>Add</Button>
            </div>
            <div className="flex items-center gap-3 border-b bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500">
              <input type="checkbox" aria-label="Select all operations" checked={operations.length > 0 && selected.length === operations.length} disabled={busy}
                onChange={(e) => setSelectedIds(e.target.checked ? new Set(operations.map((op) => op.productionOperationId)) : new Set())} />
              <span className="w-20">Operation Code</span><span className="flex-1">Operation</span>
            </div>
            {isLoading && <LoadingRow label="Loading operations..." className="justify-center py-12" />}
            {isError && <div role="alert" className="p-4 text-sm text-red-600">Unable to load operations. <button type="button" className="underline" onClick={() => void refetch()}>Retry</button></div>}
            {operations.map((op) => editingId === op.productionOperationId ? (
              <OperationForm key={op.productionOperationId} initial={op} saving={busy} onSave={save} onCancel={() => setEditingId(null)} />
            ) : (
              <div key={op.productionOperationId} className="flex items-center gap-3 border-b px-4 py-3 text-sm">
                <input type="checkbox" aria-label={`Select operation ${op.operationCode}`} checked={selectedIds.has(op.productionOperationId)} disabled={busy}
                  onChange={() => setSelectedIds((prev) => { const next = new Set(prev); if (next.has(op.productionOperationId)) next.delete(op.productionOperationId); else next.add(op.productionOperationId); return next })} />
                <span className="w-20 shrink-0 break-words">{op.operationCode}</span>
                <div className="min-w-0 flex-1"><p className="break-words">{op.operationName}</p><p className="text-xs text-gray-500">Process Team: {op.processTeamName}</p></div>
                {op.isQrApplicable && <span className="text-xs text-blue-500">QR</span>}
                <button type="button" aria-label={`Edit operation ${op.operationCode}`} disabled={busy} onClick={() => setEditingId(op.productionOperationId)}><Pencil className="h-4 w-4" /></button>
              </div>
            ))}
            {editingId === "new" && <OperationForm saving={busy} onSave={save} onCancel={() => setEditingId(null)} />}
            {!isLoading && !isError && !operations.length && editingId !== "new" && <p className="p-10 text-center text-sm text-gray-500">No operations yet. Click Add to create one.</p>}
          </>
        )}
      </div>
      <DeleteDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={deleteSelected} title="Delete Operations"
        description={`Delete ${selected.length} selected operation${selected.length === 1 ? "" : "s"}? This action cannot be undone.`} />
    </div>
  )
}
