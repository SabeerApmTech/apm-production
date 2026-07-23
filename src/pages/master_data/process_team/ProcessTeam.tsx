import { useState, useCallback, useMemo } from "react"
import type { ColDef, ICellRendererParams } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { Switch } from "@/components/ui/switch"
import { ProcessTeamDialog } from "./ProcessTeamDialog"
import { useDialogState } from "@/hooks/useDialogState"
import { EditActionCell } from "@/shared/renderers"
import type { ProcessTeamRecord } from "@/types/processTeam"
import {
  useGetProcessTeamsQuery,
  useCreateProcessTeamMutation,
  useUpdateProcessTeamMutation,
  useDeleteProcessTeamsMutation,
} from "@/store/services/processTeamApi"

/* ── Active toggle cell ─────────────────────────────────── */
interface ActiveCellParams extends ICellRendererParams<ProcessTeamRecord> {
  onToggle?: (row: ProcessTeamRecord, next: boolean) => void
  pendingId?: number | null
}

function ActiveCell({ data, onToggle, pendingId }: ActiveCellParams) {
  if (!data) return null
  const pending = pendingId === data.processTeamId
  return (
    <Switch
      checked={data.isActive}
      disabled={pending || !onToggle}
      onCheckedChange={(next) => onToggle?.(data, next)}
    />
  )
}

/* ── Page ───────────────────────────────────────────────── */
export function ProcessTeam() {
  const { data, isLoading, isFetching, refetch } = useGetProcessTeamsQuery()
  const processTeams = data ?? []

  const [createProcessTeam] = useCreateProcessTeamMutation()
  const [updateProcessTeam] = useUpdateProcessTeamMutation()
  const [deleteProcessTeams] = useDeleteProcessTeamsMutation()

  const dialog = useDialogState<ProcessTeamRecord>()
  const [deleteRows, setDeleteRows] = useState<ProcessTeamRecord[] | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const closeDelete = useCallback(() => setDeleteRows(null), [])

  const handleDelete = useCallback(async () => {
    if (!deleteRows?.length) return
    try {
      await deleteProcessTeams(deleteRows.map((r) => r.processTeamId)).unwrap()
    } catch {
      // Toast middleware already surfaced the error; the list reflects the server's actual state on refetch.
    }
  }, [deleteRows, deleteProcessTeams])

  const handleAdd = useCallback(async (processTeamName: string) => {
    await createProcessTeam({ processTeamName }).unwrap()
  }, [createProcessTeam])

  const handleEdit = useCallback(async (processTeamId: number, processTeamName: string) => {
    await updateProcessTeam({
      processTeamId,
      body: { processTeamName, isActive: dialog.editing?.isActive ?? true },
    }).unwrap()
  }, [updateProcessTeam, dialog])

  const handleToggle = useCallback(async (row: ProcessTeamRecord, next: boolean) => {
    setTogglingId(row.processTeamId)
    try {
      await updateProcessTeam({
        processTeamId: row.processTeamId,
        body: { processTeamName: row.processTeamName, isActive: next },
      }).unwrap()
    } finally {
      setTogglingId(null)
    }
  }, [updateProcessTeam])

  const columnDefs = useMemo<ColDef<ProcessTeamRecord>[]>(
    () => [
      { field: "processTeamName", headerName: "Process Team Name", cellStyle: { color: "#3b82f6", fontWeight: 500 } },
      {
        field: "isActive",
        headerName: "Active",
        cellRenderer: ActiveCell,
        cellRendererParams: { onToggle: handleToggle, pendingId: togglingId },
        sortable: false,
      },
      {
        headerName: "Action",
        cellRenderer: EditActionCell,
        cellRendererParams: { onEdit: dialog.openEdit },
        sortable: false,
        maxWidth: 80,
      },
    ],
    [dialog, handleToggle, togglingId]
  )

  return (
    <>
      <DataTable<ProcessTeamRecord>
        title="Process Team"
        rowData={processTeams}
        columnDefs={columnDefs}
        loading={isLoading}
        onRefresh={refetch}
        refreshing={isFetching}
        onAdd={dialog.openAdd}
        onDelete={setDeleteRows}
        checkbox
      />

      <ProcessTeamDialog
        key={dialog.editing?.processTeamId ?? "new"}
        open={dialog.isOpen}
        onClose={dialog.close}
        processTeam={dialog.editing}
        onAdd={handleAdd}
        onEdit={handleEdit}
      />

      <DeleteDialog
        open={!!deleteRows}
        onClose={closeDelete}
        onConfirm={handleDelete}
        title="Delete Process Team"
        description={`Are you sure you want to delete the selected process team${deleteRows && deleteRows.length > 1 ? "s" : ""}? This action cannot be undone.`}
      />
    </>
  )
}
