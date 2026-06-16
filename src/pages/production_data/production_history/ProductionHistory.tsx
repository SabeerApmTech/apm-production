import { useState, useMemo, useCallback } from "react"
import type { ColDef, ICellRendererParams } from "ag-grid-community"
import { Trash2 } from "lucide-react"
import { DataTable } from "@/shared/DataTable"
import { DeleteDialog } from "@/shared/DeleteDialog"
import {
  DetailCellRenderer, ExpandCell, isFullWidthRow, getRowHeight,
  type StepDetail, type DetailRow,
} from "@/shared/ExpandableDetail"

interface ProductionRow {
  id: number
  scheduleDateAndTime: string
  scheduleId: string
  product: string
  company: string
  targetQty: number
  producedQty: number
  pendingQty: number
  steps: StepDetail[]
}

type AnyRow = ProductionRow | DetailRow

const MOCK_ROWS: ProductionRow[] = [
  {
    id: 1,
    scheduleDateAndTime: "26/05/2026 11:15 AM", scheduleId: "S001-26",
    product: "AIS 140", company: "Lakshika",
    targetQty: 3000, producedQty: 2500, pendingQty: 500,
    steps: [
      { step: "Step - 01", operation: "Preprocess",        successfulQty: 1000, rejectedQty: 1000 },
      { step: "Step - 02", operation: "Firmware Flashing", successfulQty: 2200, rejectedQty: 500  },
      { step: "Step - 03", operation: "Battery Fixing",    successfulQty: 1000, rejectedQty: 1000 },
      { step: "Step - 04", operation: "Final QC",          successfulQty: 2900, rejectedQty: 100  },
    ],
  },
  {
    id: 2,
    scheduleDateAndTime: "26/05/2026 11:15 AM", scheduleId: "S002-26",
    product: "AIS 140", company: "Lakshika",
    targetQty: 3000, producedQty: 2500, pendingQty: 500,
    steps: [
      { step: "Step - 01", operation: "Preprocess",        successfulQty: 800,  rejectedQty: 200 },
      { step: "Step - 02", operation: "Firmware Flashing", successfulQty: 1500, rejectedQty: 300 },
    ],
  },
  {
    id: 3,
    scheduleDateAndTime: "27/05/2026 09:00 AM", scheduleId: "S003-26",
    product: "Dashcam", company: "Kingstrack",
    targetQty: 2000, producedQty: 1800, pendingQty: 200,
    steps: [
      { step: "Step - 01", operation: "Preprocess",     successfulQty: 600,  rejectedQty: 400 },
      { step: "Step - 02", operation: "Battery Fixing", successfulQty: 1200, rejectedQty: 600 },
      { step: "Step - 03", operation: "Final QC",       successfulQty: 1800, rejectedQty: 200 },
    ],
  },
]

interface DeleteCellParams extends ICellRendererParams<AnyRow> {
  onDelete?: (id: number) => void
}

function DeleteCell({ data, onDelete }: DeleteCellParams) {
  if (!data || (data as DetailRow).__isDetail) return null
  const row = data as ProductionRow
  return (
    <div className="flex h-full items-center">
      <button
        onClick={(e) => { e.stopPropagation(); onDelete?.(row.id) }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ProductionHistory() {
  const [rows,       setRows]       = useState<ProductionRow[]>(MOCK_ROWS)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [deleteId,   setDeleteId]   = useState<number | null>(null)

  const toggleExpand = useCallback((id: number) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  const handleDelete = useCallback(() => {
    if (deleteId === null) return
    setRows((prev) => prev.filter((r) => r.id !== deleteId))
    setExpandedId((prev) => (prev === deleteId ? null : prev))
    setDeleteId(null)
  }, [deleteId])

  const openDelete = useCallback((id: number) => setDeleteId(id), [])

  const displayRows = useMemo<AnyRow[]>(() => {
    const result: AnyRow[] = []
    for (const row of rows) {
      result.push(row)
      if (expandedId === row.id) {
        result.push({ __isDetail: true, parentId: row.id, steps: row.steps })
      }
    }
    return result
  }, [rows, expandedId])

  const columnDefs = useMemo<ColDef<AnyRow>[]>(
    () => [
      {
        headerName: "", maxWidth: 44, minWidth: 44, sortable: false, resizable: false,
        cellRenderer: ExpandCell,
        cellRendererParams: { expandedId, onToggle: toggleExpand },
      },
      { field: "scheduleDateAndTime" as keyof ProductionRow, headerName: "Schedule Date & Time", minWidth: 170 },
      { field: "scheduleId"          as keyof ProductionRow, headerName: "Schedule Id",          minWidth: 120 },
      { field: "product"             as keyof ProductionRow, headerName: "Product",              cellStyle: { fontWeight: 600 }, minWidth: 110 },
      { field: "company"             as keyof ProductionRow, headerName: "Company",              cellStyle: { fontWeight: 600 }, minWidth: 120 },
      { field: "targetQty"           as keyof ProductionRow, headerName: "Target Qty",           minWidth: 110 },
      { field: "producedQty"         as keyof ProductionRow, headerName: "Produced Qty",         minWidth: 120 },
      { field: "pendingQty"          as keyof ProductionRow, headerName: "Pending Qty",          minWidth: 110 },
      {
        headerName: "Action",
        cellRenderer: DeleteCell,
        cellRendererParams: { onDelete: openDelete },
        sortable: false, maxWidth: 80,
      },
    ],
    [expandedId, toggleExpand, openDelete]
  )

  return (
    <>
      <DataTable<AnyRow>
        title="Production History"
        rowData={displayRows}
        columnDefs={columnDefs}
        hideSno
        showDateFilter
        isFullWidthRow={isFullWidthRow}
        fullWidthCellRenderer={DetailCellRenderer}
        getRowHeight={getRowHeight}
      />
      <DeleteDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Record"
        description="Are you sure you want to delete this production record? This action cannot be undone."
      />
    </>
  )
}
