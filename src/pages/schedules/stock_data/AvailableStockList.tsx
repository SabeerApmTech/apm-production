import { useCallback, useMemo, useState } from "react"
import type { ColDef, ICellRendererParams } from "ag-grid-community"
import { Pencil, PackagePlus, PackageMinus } from "lucide-react"
import { DataTable } from "@/shared/DataTable"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { StockFormDialog } from "./StockFormDialog"
import { AdjustStockDialog } from "./AdjustStockDialog"
import { useDialogState } from "@/hooks/useDialogState"
import { getAuthUser } from "@/utils/auth"
import type { StockRecord, StockRequest } from "@/types/stock"
import {
  useGetStocksQuery,
  useCreateStockMutation,
  useUpdateStockMutation,
  useBulkDeleteStockMutation,
  useAddStockMutation,
  useConsumeStockMutation,
} from "@/store/services/stockApi"

function StockActionsCell({ data, onEdit, onAdd, onConsume }: ICellRendererParams<StockRecord> & {
  onEdit: (row: StockRecord) => void
  onAdd: (row: StockRecord) => void
  onConsume: (row: StockRecord) => void
}) {
  if (!data) return null
  return (
    <div className="flex h-full items-center gap-0.5">
      <button
        onClick={(e) => { e.stopPropagation(); onAdd(data) }}
        title="Add stock"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600 transition-colors"
      >
        <PackagePlus className="h-4 w-4" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onConsume(data) }}
        title="Consume stock"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
        disabled={data.availableStockQty === 0}
      >
        <PackageMinus className="h-4 w-4" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(data) }}
        title="Edit stock"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  )
}

export function AvailableStockList() {
  const { data, isLoading, isFetching, refetch } = useGetStocksQuery()
  const stocks = data ?? []

  const [createStock] = useCreateStockMutation()
  const [updateStock] = useUpdateStockMutation()
  const [bulkDeleteStock] = useBulkDeleteStockMutation()
  const [addStock] = useAddStockMutation()
  const [consumeStock] = useConsumeStockMutation()

  const dialog = useDialogState<StockRecord>()
  const [deleteRows, setDeleteRows] = useState<StockRecord[] | null>(null)
  const [adjusting, setAdjusting] = useState<{ mode: "add" | "consume"; stock: StockRecord } | null>(null)

  const closeDelete = useCallback(() => setDeleteRows(null), [])

  const handleDelete = useCallback(async () => {
    if (!deleteRows?.length) return
    const user = getAuthUser()
    if (!user) return
    try {
      await bulkDeleteStock({ stockIds: deleteRows.map((r) => r.stockId), deletedByEmpId: user.employeeId }).unwrap()
    } catch {
      // Toast middleware already surfaced the error; the list reflects the server's actual state on refetch.
    }
  }, [deleteRows, bulkDeleteStock])

  const handleAdd = useCallback(async (body: StockRequest) => {
    const user = getAuthUser()
    if (!user) return
    await createStock({ createdByEmpId: user.employeeId, body }).unwrap()
  }, [createStock])

  const handleEdit = useCallback(async (stockId: number, body: StockRequest) => {
    const user = getAuthUser()
    if (!user) return
    await updateStock({ stockId, updatedByEmpId: user.employeeId, body }).unwrap()
  }, [updateStock])

  const handleAdjust = useCallback(async (stockId: number, updatedByEmpId: string, body: StockRequest) => {
    if (adjusting?.mode === "add") await addStock({ stockId, updatedByEmpId, body }).unwrap()
    else await consumeStock({ stockId, updatedByEmpId, body }).unwrap()
  }, [adjusting, addStock, consumeStock])

  const columnDefs = useMemo(
    (): ColDef<StockRecord>[] => [
      { field: "itemCode",       headerName: "Item Code",       cellStyle: { color: "#3b82f6", fontWeight: 500 }, minWidth: 110 },
      { field: "companyName",    headerName: "Company Name",    minWidth: 140 },
      { field: "productName",    headerName: "Item Name",       cellStyle: { fontWeight: 600 }, minWidth: 120 },
      { field: "state",          headerName: "State",           minWidth: 130 },
      { field: "productionCode", headerName: "Operation Code",  minWidth: 120 },
      { field: "operationName",  headerName: "Operation Name",  minWidth: 140 },
      {
        field: "availableStockQty", headerName: "Available Stock Qty", minWidth: 150,
        cellStyle: (p) => ({ fontWeight: 600, color: (p.value ?? 0) > 0 ? "#2563eb" : "#dc2626" }),
      },
      {
        headerName: "Action",
        cellRenderer: StockActionsCell,
        cellRendererParams: {
          onEdit: dialog.openEdit,
          onAdd: (row: StockRecord) => setAdjusting({ mode: "add", stock: row }),
          onConsume: (row: StockRecord) => setAdjusting({ mode: "consume", stock: row }),
        },
        sortable: false, minWidth: 130,
      },
    ],
    [dialog]
  )

  return (
    <div className="flex flex-1 min-h-0">
      <DataTable<StockRecord>
        title="Available Stock"
        addLabel="Add Stock"
        rowData={stocks}
        columnDefs={columnDefs}
        loading={isLoading}
        onRefresh={refetch}
        refreshing={isFetching}
        onAdd={dialog.openAdd}
        onDelete={setDeleteRows}
        checkbox
      />

      <StockFormDialog
        key={dialog.editing?.stockId ?? "new"}
        open={dialog.isOpen}
        onClose={dialog.close}
        stock={dialog.editing}
        onAdd={handleAdd}
        onEdit={handleEdit}
      />

      <AdjustStockDialog
        mode={adjusting?.mode ?? "add"}
        stock={adjusting?.stock ?? null}
        onClose={() => setAdjusting(null)}
        onAdjust={handleAdjust}
      />

      <DeleteDialog
        open={!!deleteRows}
        onClose={closeDelete}
        onConfirm={handleDelete}
        title="Delete Stock"
        description={`Are you sure you want to delete the selected stock record${deleteRows && deleteRows.length > 1 ? "s" : ""}? This action cannot be undone.`}
      />
    </div>
  )
}
