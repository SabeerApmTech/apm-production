import { useState, useCallback } from "react"
import type { ColDef, ICellRendererParams } from "ag-grid-community"
import { Trash2 } from "lucide-react"
import { DataTable } from "@/shared/DataTable"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { StatusCell } from "@/shared/StatusCell"

interface ReworkTransactionRow {
  id: number
  dateTime: string
  employeeId: string
  employeeName: string
  reworkScheduleId: string
  company: string
  product: string
  operation: string
  status: "Running" | "Stopped"
  successfulQty: number
}

const MOCK_TRANSACTIONS: ReworkTransactionRow[] = [
  { id: 1, dateTime: "26/05/2026\n10:00 AM", employeeId: "1216", employeeName: "Ashwin", reworkScheduleId: "RS001-26", company: "Lakshitha", product: "CCDV",     operation: "Preprocessing",    status: "Running", successfulQty: 500 },
  { id: 2, dateTime: "26/05/2026\n10:00 AM", employeeId: "0987", employeeName: "Naveen", reworkScheduleId: "RS002-26", company: "Kingstrack", product: "AIS - 140", operation: "Preprocessing",    status: "Stopped", successfulQty: 150 },
  { id: 3, dateTime: "27/05/2026\n09:30 AM", employeeId: "1045", employeeName: "Ravi",   reworkScheduleId: "RS001-26", company: "Lakshitha", product: "AIS 140",   operation: "Firmware Flashing", status: "Running", successfulQty: 800 },
]

interface DeleteCellParams extends ICellRendererParams<ReworkTransactionRow> {
  onDelete?: (id: number) => void
}

function DeleteCell({ data, onDelete }: DeleteCellParams) {
  return (
    <div className="flex h-full items-center">
      <button
        onClick={(e) => { e.stopPropagation(); if (data) onDelete?.(data.id) }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ReworkTransactionLog() {
  const [rows,     setRows]     = useState<ReworkTransactionRow[]>(MOCK_TRANSACTIONS)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const handleDelete = useCallback(() => {
    if (deleteId === null) return
    setRows((prev) => prev.filter((r) => r.id !== deleteId))
    setDeleteId(null)
  }, [deleteId])

  const openDelete = useCallback((id: number) => setDeleteId(id), [])

  const columnDefs: ColDef<ReworkTransactionRow>[] = [
    { field: "dateTime",         headerName: "Date & Time",        minWidth: 130, cellStyle: { whiteSpace: "pre-line", lineHeight: "1.4" } },
    { field: "employeeId",       headerName: "Employee Id",        minWidth: 110 },
    { field: "employeeName",     headerName: "Employee Name",      minWidth: 130 },
    { field: "reworkScheduleId", headerName: "Rework Schedule ID", minWidth: 150 },
    { field: "company",          headerName: "Company",            cellStyle: { fontWeight: 600 }, minWidth: 120 },
    { field: "product",          headerName: "Product",            cellStyle: { fontWeight: 600 }, minWidth: 110 },
    { field: "operation",        headerName: "Operation",          minWidth: 140 },
    { field: "status",           headerName: "Status",             cellRenderer: StatusCell, minWidth: 110 },
    { field: "successfulQty",    headerName: "Success",            minWidth: 100 },
    {
      headerName: "Delete",
      cellRenderer: DeleteCell,
      cellRendererParams: { onDelete: openDelete },
      sortable: false, minWidth: 100,
    },
  ]

  return (
    <>
      <DataTable<ReworkTransactionRow>
        title="Rework Transaction Log"
        rowData={rows}
        columnDefs={columnDefs}
        showDateFilter
      />
      <DeleteDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? This action cannot be undone."
      />
    </>
  )
}
