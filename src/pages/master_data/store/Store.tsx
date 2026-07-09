import { useState, useCallback, useMemo } from "react"
import type { ColDef, ICellRendererParams } from "ag-grid-community"
import { Pencil } from "lucide-react"
import { DataTable } from "@/shared/DataTable"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { StoreDialog } from "./StoreDialog"
import { MOCK_STORES } from "./data"
import type { StoreRecord } from "@/types/store"

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

/* ── Page ───────────────────────────────────────────────── */
export function Store() {
  const [stores, setStores] = useState<StoreRecord[]>(MOCK_STORES)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editStore, setEditStore]   = useState<StoreRecord | undefined>()
  const [deleteRows, setDeleteRows] = useState<StoreRecord[] | null>(null)

  const openEditDialog = useCallback((id: number) => {
    setEditStore(stores.find((s) => s.storeId === id))
  }, [stores])

  const closeDelete = useCallback(() => setDeleteRows(null), [])

  const handleDelete = useCallback(() => {
    if (!deleteRows?.length) return
    const ids = new Set(deleteRows.map((r) => r.storeId))
    setStores((prev) => prev.filter((s) => !ids.has(s.storeId)))
  }, [deleteRows])

  const handleAdd = useCallback(async (storeName: string) => {
    setStores((prev) => [...prev, { storeId: Math.max(0, ...prev.map((s) => s.storeId)) + 1, storeName }])
  }, [])

  const handleEdit = useCallback(async (storeId: number, storeName: string) => {
    setStores((prev) => prev.map((s) => (s.storeId === storeId ? { ...s, storeName } : s)))
  }, [])

  const columnDefs = useMemo<ColDef<StoreRecord>[]>(
    () => [
      { field: "storeName", headerName: "Store Name", cellStyle: { color: "#3b82f6", fontWeight: 500 } },
      { headerName: "Action", cellRenderer: ActionCell, cellRendererParams: { onEdit: openEditDialog }, sortable: false, maxWidth: 80 },
    ],
    [openEditDialog]
  )

  return (
    <>
      <DataTable<StoreRecord>
        title="Store"
        rowData={stores}
        columnDefs={columnDefs}
        onAdd={() => setDialogOpen(true)}
        onDelete={setDeleteRows}
        checkbox
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
