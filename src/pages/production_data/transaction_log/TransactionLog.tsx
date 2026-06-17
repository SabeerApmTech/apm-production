import { useState, useCallback } from "react"
import type { ColDef } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { StatusCell } from "@/shared/StatusCell"
import { DeleteCell } from "@/shared/renderers/DeleteCell"

interface TransactionRow {
  id: number
  dateTime: string
  employeeId: string
  employeeName: string
  scheduleId: string
  company: string
  product: string
  operation: string
  status: "Running" | "Stopped"
  successfulQty: number
  rejectedQty: number
  reason: string
  remarks: string
}

const MOCK_TRANSACTIONS: TransactionRow[] = [
  { id: 1, dateTime: "26/05/2026\n10:00 AM", employeeId: "1216", employeeName: "Ashwin", scheduleId: "S001-26", company: "Lakshitha", product: "CCDV",     operation: "Preprocessing",    status: "Running", successfulQty: 500,  rejectedQty: 0,   reason: "-",                remarks: "-"             },
  { id: 2, dateTime: "26/05/2026\n10:00 AM", employeeId: "0987", employeeName: "Naveen", scheduleId: "S002-26", company: "Kingstrack", product: "AIS - 140", operation: "Preprocessing",    status: "Stopped", successfulQty: 1500, rejectedQty: 500, reason: "Component Failure", remarks: "-"             },
  { id: 3, dateTime: "27/05/2026\n09:30 AM", employeeId: "1045", employeeName: "Ravi",   scheduleId: "S003-26", company: "Lakshitha", product: "AIS 140",   operation: "Firmware Flashing", status: "Running", successfulQty: 800,  rejectedQty: 0,   reason: "-",                remarks: "-"             },
  { id: 4, dateTime: "27/05/2026\n11:00 AM", employeeId: "1102", employeeName: "Suresh", scheduleId: "S003-26", company: "Lakshitha", product: "AIS 140",   operation: "Battery Fixing",    status: "Stopped", successfulQty: 300,  rejectedQty: 200, reason: "Battery Defect",   remarks: "Replaced batch" },
]


export function TransactionLog() {
  const [rows,     setRows]     = useState<TransactionRow[]>(MOCK_TRANSACTIONS)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const handleDelete = useCallback(() => {
    if (deleteId === null) return
    setRows((prev) => prev.filter((r) => r.id !== deleteId))
    setDeleteId(null)
  }, [deleteId])

  const openDelete = useCallback((id: number) => setDeleteId(id), [])

  const columnDefs: ColDef<TransactionRow>[] = [
    { field: "dateTime",      headerName: "Date & Time",    minWidth: 130, cellStyle: { whiteSpace: "pre-line", lineHeight: "1.4" } },
    { field: "employeeId",    headerName: "Employee Id",    minWidth: 110 },
    { field: "employeeName",  headerName: "Employee Name",  minWidth: 130 },
    { field: "scheduleId",    headerName: "Schedule ID",    minWidth: 110 },
    { field: "company",       headerName: "Company",        cellStyle: { fontWeight: 600 }, minWidth: 120 },
    { field: "product",       headerName: "Product",        cellStyle: { fontWeight: 600 }, minWidth: 110 },
    { field: "operation",     headerName: "Operation",      minWidth: 140 },
    { field: "status",        headerName: "Status",         cellRenderer: StatusCell, minWidth: 110 },
    { field: "successfulQty", headerName: "Successful Qty", minWidth: 130 },
    { field: "rejectedQty",   headerName: "Rejected Qty",   minWidth: 120 },
    { field: "reason",        headerName: "Reason",         minWidth: 140 },
    { field: "remarks",       headerName: "Remarks",        minWidth: 110 },
    {
      headerName: "Action",
      cellRenderer: DeleteCell,
      cellRendererParams: { onDelete: openDelete },
      sortable: false, maxWidth: 80,
    },
  ]

  return (
    <>
      <DataTable<TransactionRow>
        title="Transaction Log"
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
