import { useState, useCallback, useMemo } from "react"
import type { ColDef, ICellRendererParams } from "ag-grid-community"
import { Pencil } from "lucide-react"
import { toast } from "sonner"
import { DataTable } from "@/shared/DataTable"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { Switch } from "@/components/ui/switch"
import { StoreDialog } from "./StoreDialog"
import { getAuthUser } from "@/utils/auth"
import type { StoreRecord } from "@/types/store"
import {
  useGetStoresQuery,
  useCreateStoreMutation,
  useUpdateStoreMutation,
  useDeleteStoresMutation,
} from "@/store/services/storeApi"

/* ── Action cell ────────────────────────────────────────── */
interface ActionCellParams extends ICellRendererParams<StoreRecord> {
  onEdit?: (id: number) => void
}

function ActionCell({ data, onEdit }: ActionCellParams) {
  return (
    <div className="flex h-full items-center">
      <button
        onClick={(e) => { e.stopPropagation(); if (data) onEdit?.(data.storeId) }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  )
}

/* ── Active toggle cell ─────────────────────────────────── */
interface ActiveCellParams extends ICellRendererParams<StoreRecord> {
  onToggle?: (row: StoreRecord, next: boolean) => void
  pendingId?: number | null
}

function ActiveCell({ data, onToggle, pendingId }: ActiveCellParams) {
  if (!data) return null
  const pending = pendingId === data.storeId
  return (
    <Switch
      checked={data.isActive}
      disabled={pending || !onToggle}
      onCheckedChange={(next) => onToggle?.(data, next)}
    />
  )
}

/* ── Page ───────────────────────────────────────────────── */
export function Store() {
  const { data, isLoading, isFetching, refetch } = useGetStoresQuery()
  const stores = useMemo(() => data ?? [], [data])

  // Add/edit/toggle-active/delete are Supervisor-only.
  const canManage = getAuthUser()?.employeeRole === "SUPERVISOR"

  const [createStore] = useCreateStoreMutation()
  const [updateStore] = useUpdateStoreMutation()
  const [deleteStores] = useDeleteStoresMutation()

  const [dialogOpen, setDialogOpen]   = useState(false)
  const [editStore, setEditStore]     = useState<StoreRecord | undefined>()
  const [deleteRows, setDeleteRows]   = useState<StoreRecord[] | null>(null)
  const [togglingId, setTogglingId]   = useState<number | null>(null)

  const openEditDialog = useCallback((id: number) => {
    setEditStore(stores.find((s) => s.storeId === id))
  }, [stores])

  const closeDelete = useCallback(() => setDeleteRows(null), [])

  const requestDelete = useCallback((rows: StoreRecord[]) => {
    const activeStores = rows.filter((r) => r.isActive)
    if (activeStores.length) {
      const names = activeStores.map((s) => `"${s.storeName}"`).join(", ")
      toast.error(
        activeStores.length > 1
          ? `${names} are active and cannot be deleted.`
          : `${names} is active and cannot be deleted.`
      )
      return
    }
    setDeleteRows(rows)
  }, [])

  const handleDelete = useCallback(async () => {
    if (!deleteRows?.length) return
    try {
      await deleteStores(deleteRows).unwrap()
    } catch {
      // Toast middleware already surfaced the error; the list reflects the server's actual state on refetch.
    }
  }, [deleteRows, deleteStores])

  const handleAdd = useCallback(async (storeName: string) => {
    const employeeId = getAuthUser()?.employeeId ?? ""
    await createStore({ storeName, employeeId }).unwrap()
  }, [createStore])

  const handleEdit = useCallback(async (storeId: number, storeName: string) => {
    const current = stores.find((s) => s.storeId === storeId)
    const employeeId = getAuthUser()?.employeeId ?? ""
    await updateStore({ storeId, body: { storeName, isActive: current?.isActive ?? true, employeeId } }).unwrap()
  }, [stores, updateStore])

  const handleToggle = useCallback(async (row: StoreRecord, next: boolean) => {
    const employeeId = getAuthUser()?.employeeId ?? ""
    setTogglingId(row.storeId)
    try {
      await updateStore({ storeId: row.storeId, body: { storeName: row.storeName, isActive: next, employeeId } }).unwrap()
    } finally {
      setTogglingId(null)
    }
  }, [updateStore])

  const columnDefs = useMemo<ColDef<StoreRecord>[]>(
    () => [
      { field: "storeName", headerName: "Store Name", cellStyle: { color: "#3b82f6", fontWeight: 500 } },
      {
        field: "isActive",
        headerName: "Active",
        cellRenderer: ActiveCell,
        cellRendererParams: { onToggle: canManage ? handleToggle : undefined, pendingId: togglingId },
        sortable: false,
      },
      ...(canManage
        ? [
            {
              headerName: "Action",
              cellRenderer: ActionCell,
              cellRendererParams: { onEdit: openEditDialog },
              sortable: false,
              maxWidth: 80,
            } satisfies ColDef<StoreRecord>,
          ]
        : []),
    ],
    [openEditDialog, handleToggle, togglingId, canManage]
  )

  return (
    <>
      <DataTable<StoreRecord>
        title="Store"
        rowData={stores}
        columnDefs={columnDefs}
        loading={isLoading}
        onRefresh={refetch}
        refreshing={isFetching}
        onAdd={canManage ? () => setDialogOpen(true) : undefined}
        onDelete={canManage ? requestDelete : undefined}
        checkbox={canManage}
      />

      <StoreDialog
        key={editStore?.storeId ?? "new"}
        open={dialogOpen || editStore !== undefined}
        onClose={() => { setDialogOpen(false); setEditStore(undefined) }}
        store={editStore}
        onAdd={handleAdd}
        onEdit={handleEdit}
      />

      <DeleteDialog
        open={!!deleteRows}
        onClose={closeDelete}
        onConfirm={handleDelete}
        title="Delete Store"
        description={`Are you sure you want to delete the selected store${deleteRows && deleteRows.length > 1 ? "s" : ""}? This action cannot be undone.`}
      />
    </>
  )
}
