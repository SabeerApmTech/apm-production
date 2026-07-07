import { useState, useCallback, useMemo } from "react"
import type { ColDef, ValueFormatterParams } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { StatusCell } from "@/shared/StatusCell"
import { DeleteCell } from "@/shared/renderers/DeleteCell"
import { formatLogDateTime } from "@/utils/date"
import type { TransactionLogRecord } from "@/types/transactionLog"
import {
  useGetTransactionLogsQuery,
  useDeleteTransactionLogMutation,
} from "@/store/services/transactionLogApi"

export function TransactionLog() {
  const { data, isLoading } = useGetTransactionLogsQuery()
  const rows = useMemo(() => data ?? [], [data])

  const [deleteTransactionLog] = useDeleteTransactionLogMutation()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [dateRange, setDateRange] = useState({ from: "", to: "" })

  // No date-range query param exists on the endpoint, so the toolbar's from/to filter is applied client-side.
  const filteredRows = useMemo(() => {
    if (!dateRange.from && !dateRange.to) return rows
    return rows.filter((r) => {
      const logDate = r.logTime.slice(0, 10)
      if (dateRange.from && logDate < dateRange.from) return false
      if (dateRange.to && logDate > dateRange.to) return false
      return true
    })
  }, [rows, dateRange])

  const closeDelete = useCallback(() => setDeleteId(null), [])
  const openDelete  = useCallback((id: number) => setDeleteId(id), [])

  const handleDelete = useCallback(async () => {
    if (deleteId === null) return
    try {
      await deleteTransactionLog(deleteId).unwrap()
    } catch {
      // Toast middleware already surfaced the error; the list reflects the server's actual state on refetch.
    }
  }, [deleteId, deleteTransactionLog])

  const columnDefs: ColDef<TransactionLogRecord>[] = [
    {
      field: "logTime",
      headerName: "Date & Time",
      minWidth: 130,
      cellStyle: { whiteSpace: "pre-line", lineHeight: "1.4" },
      valueFormatter: (p: ValueFormatterParams<TransactionLogRecord>) =>
        p.value ? formatLogDateTime(p.value) : "",
    },
    { field: "employeeId",    headerName: "Employee Id",    minWidth: 110 },
    { field: "employeeName",  headerName: "Employee Name",  minWidth: 130 },
    { field: "scheduleId",    headerName: "Schedule ID",    minWidth: 110 },
    { field: "companyName",   headerName: "Company",        cellStyle: { fontWeight: 600 }, minWidth: 120 },
    { field: "productName",   headerName: "Product",        cellStyle: { fontWeight: 600 }, minWidth: 110 },
    { field: "sequenceNo",    headerName: "Seq No",         maxWidth: 90 },
    { field: "operationName", headerName: "Operation",      minWidth: 140 },
    { field: "status",        headerName: "Status",         cellRenderer: StatusCell, minWidth: 110 },
    { field: "logEvent",      headerName: "Event",          minWidth: 100 },
    { field: "successfulQty", headerName: "Successful Qty", minWidth: 130 },
    { field: "rejectedQty",   headerName: "Rejected Qty",   minWidth: 120 },
    { field: "reason",        headerName: "Reason",         minWidth: 140, valueFormatter: (p) => p.value ?? "-" },
    { field: "remarks",       headerName: "Remarks",        minWidth: 110, valueFormatter: (p) => p.value ?? "-" },
    {
      headerName: "Action",
      cellRenderer: DeleteCell,
      cellRendererParams: { onDelete: openDelete },
      sortable: false, maxWidth: 80,
    },
  ]

  return (
    <>
      <DataTable<TransactionLogRecord>
        title="Transaction Log"
        rowData={filteredRows}
        columnDefs={columnDefs}
        loading={isLoading}
        showDateFilter
        onDateFilter={(from, to) => setDateRange({ from, to })}
      />
      <DeleteDialog
        open={deleteId !== null}
        onClose={closeDelete}
        onConfirm={handleDelete}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? This action cannot be undone."
      />
    </>
  )
}
