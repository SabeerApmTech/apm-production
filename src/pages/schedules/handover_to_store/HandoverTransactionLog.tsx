import { useCallback, useMemo, useState } from "react"
import type { ColDef, ValueFormatterParams, ValueGetterParams } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { DeleteCell } from "@/shared/renderers/DeleteCell"
import { formatLogDateTime, getTodayIso } from "@/utils/date"
import { getAuthUser } from "@/utils/auth"
import type { HandoverTransactionRecord } from "@/types/handoverToStore"
import {
  useGetHandoverTransactionLogQuery,
  useDeleteHandoverMutation,
} from "@/store/services/handoverToStoreApi"

export function HandoverTransactionLog() {
  const [fromDate, setFromDate] = useState(getTodayIso())
  const [toDate,   setToDate]   = useState(getTodayIso())

  const { data, isLoading } = useGetHandoverTransactionLogQuery({ fromDate, toDate })
  const rows = useMemo(() => data ?? [], [data])

  const [deleteHandover] = useDeleteHandoverMutation()
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Only Supervisors can delete a handover transaction.
  const canDelete = getAuthUser()?.employeeRole === "SUPERVISOR"

  const closeDelete = useCallback(() => setDeleteId(null), [])
  const openDelete   = useCallback((id: number) => setDeleteId(id), [])

  const handleDelete = useCallback(async () => {
    if (deleteId === null) return
    const user = getAuthUser()
    if (!user) return
    try {
      await deleteHandover({ handoverId: deleteId, employeeId: user.employeeId }).unwrap()
    } catch {
      // Toast middleware already surfaced the error; the list reflects the server's actual state on refetch.
    }
  }, [deleteId, deleteHandover])

  const columnDefs = useMemo<ColDef<HandoverTransactionRecord>[]>(
    () => [
      {
        field: "handoverDate", headerName: "Handover Date", minWidth: 130,
        cellStyle: { whiteSpace: "pre-line", lineHeight: "1.4" },
        valueFormatter: (p: ValueFormatterParams<HandoverTransactionRecord>) =>
          p.value ? formatLogDateTime(p.value) : "",
      },
      { field: "scheduleId",  headerName: "Schedule ID",  minWidth: 110 },
      { field: "companyName", headerName: "Company",      cellStyle: { fontWeight: 600 }, minWidth: 120 },
      { field: "productName", headerName: "Product",      cellStyle: { fontWeight: 600 }, minWidth: 110 },
      { field: "handoverQty", headerName: "Handover Qty", minWidth: 120 },
      { field: "storeName",   headerName: "Store Name",   minWidth: 140 },
      { field: "receivedBy",  headerName: "Received By",  minWidth: 130 },
      { field: "remarks",     headerName: "Remarks",      minWidth: 130, valueFormatter: (p) => p.value ?? "-" },
      {
        headerName: "Created By",
        valueGetter: (p: ValueGetterParams<HandoverTransactionRecord>) =>
          p.data ? `${p.data.createdByEmpId} : ${p.data.createdByEmpName}` : "",
        minWidth: 150,
      },
      ...(canDelete
        ? [
            {
              headerName: "Action",
              cellRenderer: DeleteCell,
              cellRendererParams: { onDelete: openDelete },
              sortable: false,
              maxWidth: 80,
            } satisfies ColDef<HandoverTransactionRecord>,
          ]
        : []),
    ],
    [canDelete, openDelete]
  )

  return (
    <>
      <DataTable<HandoverTransactionRecord>
        title="Handover Transaction Log"
        rowData={rows}
        columnDefs={columnDefs}
        loading={isLoading}
        showDateFilter
        defaultToToday
        onDateFilter={(from, to) => { setFromDate(from); setToDate(to) }}
      />
      <DeleteDialog
        open={deleteId !== null}
        onClose={closeDelete}
        onConfirm={handleDelete}
        title="Delete Transaction"
        description="Are you sure you want to delete this handover transaction? This action cannot be undone."
      />
    </>
  )
}
