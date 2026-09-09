import { useCallback, useMemo, useState } from "react"
import type { ColDef, ValueGetterParams } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { ReadyToMoveCell } from "@/shared/renderers/ReadyToMoveCell"
import { ActionButtonCell } from "@/shared/renderers/ActionButtonCell"
import { fromIsoDate } from "@/utils/date"
import { getAuthUser } from "@/utils/auth"
import { HandoverDialog } from "./HandoverDialog"
import type { HandoverFormData } from "./HandoverDialog"
import type { PendingHandoverRecord } from "@/types/handoverToStore"
import {
  useGetPendingHandoversQuery,
  useCreateHandoverMutation,
} from "@/store/services/handoverToStoreApi"

export function HandoverPendingList() {
  const { data, isLoading, isFetching, refetch } = useGetPendingHandoversQuery()
  const rows = data ?? []

  const [createHandover] = useCreateHandoverMutation()
  const [dialogRow, setDialogRow] = useState<PendingHandoverRecord | null>(null)

  // Only Supervisors can hand over stock to the store.
  const canHandover = getAuthUser()?.employeeRole === "SUPERVISOR"

  const handleHandover = useCallback(async (formData: HandoverFormData) => {
    if (!dialogRow) return
    const user = getAuthUser()
    if (!user) return
    await createHandover({
      scheduleId: dialogRow.scheduleId,
      handoverQty: formData.handoverQty,
      storeLocation: formData.storeLocation,
      givenByEmpId: user.employeeId,
      givenByEmpName: user.employeeName,
      receivedBy: formData.receivedBy,
      remarks: formData.remarks,
    }).unwrap()
  }, [dialogRow, createHandover])

  const columnDefs = useMemo(
    (): ColDef<PendingHandoverRecord>[] => [
      { field: "scheduleDate", headerName: "Schedule Date", valueFormatter: (p) => fromIsoDate(p.value.slice(0, 10)), minWidth: 130 },
      { field: "scheduleId",   headerName: "Schedule Id",   minWidth: 120 },
      {
        headerName: "Company",
        valueGetter: (p: ValueGetterParams<PendingHandoverRecord>) =>
          p.data ? `${p.data.companyName} - ${p.data.companyLocation}` : "",
        cellStyle: { fontWeight: 600 },
        minWidth: 160,
      },
      { field: "productName",        headerName: "Product",       cellStyle: { fontWeight: 600 }, minWidth: 130 },
      { field: "targetQty",          headerName: "Target Qty",    minWidth: 110 },
      { field: "producedQty",        headerName: "Produced Qty",  minWidth: 120 },
      { field: "deliveredQty",       headerName: "Delivered Qty", minWidth: 120 },
      { field: "handoverPendingQty", headerName: "Pending Qty",   minWidth: 110 },
      { field: "readyToMove",        headerName: "Ready To Move", cellRenderer: ReadyToMoveCell, minWidth: 120 },
      {
        headerName: "Action",
        cellRenderer: ActionButtonCell,
        cellRendererParams: {
          onAction: (row: PendingHandoverRecord) => setDialogRow(row),
          label: "Handover",
          disabled: (row: PendingHandoverRecord) => !canHandover || row.readyToMove <= 0,
        },
        sortable: false, minWidth: 110,
      },
    ],
    [canHandover]
  )

  return (
    <>
      <DataTable<PendingHandoverRecord>
        title="Handover Pending List"
        rowData={rows}
        columnDefs={columnDefs}
        loading={isLoading}
        onRefresh={refetch}
        refreshing={isFetching}
      />
      <HandoverDialog
        open={dialogRow !== null}
        onClose={() => setDialogRow(null)}
        row={dialogRow}
        onConfirm={handleHandover}
      />
    </>
  )
}
