import { useCallback, useMemo, useState } from "react"
import type { ColDef } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { ReadyToMoveCell } from "@/shared/renderers/ReadyToMoveCell"
import { ActionButtonCell } from "@/shared/renderers/ActionButtonCell"
import { fromIsoDate } from "@/utils/date"
import { getAuthUser } from "@/utils/auth"
import { HandoverDialog } from "./HandoverDialog"
import type { ReworkHandoverFormData } from "./HandoverDialog"
import type { ReworkHandoverPendingRecord } from "@/types/reworkHandoverToStore"
import {
  useGetReworkHandoverPendingListQuery,
  useCreateReworkHandoverMutation,
} from "@/store/services/reworkHandoverToStoreApi"

export function HandoverPendingList() {
  const { data, isLoading, isFetching, refetch } = useGetReworkHandoverPendingListQuery()
  const rows = data ?? []

  const [createHandover] = useCreateReworkHandoverMutation()
  const [dialogRow, setDialogRow] = useState<ReworkHandoverPendingRecord | null>(null)

  // Only Supervisors can hand over stock to the store.
  const canHandover = getAuthUser()?.employeeRole === "SUPERVISOR"

  const handleHandover = useCallback(async (formData: ReworkHandoverFormData) => {
    if (!dialogRow) return
    const user = getAuthUser()
    if (!user) return
    await createHandover({
      reworkScheduleId: dialogRow.reworkScheduleId,
      storeName: formData.storeName,
      receivedBy: formData.receivedBy,
      handoverQty: formData.handoverQty,
      remarks: formData.remarks,
      createdByEmpId: user.employeeId,
    }).unwrap()
  }, [dialogRow, createHandover])

  const columnDefs = useMemo<ColDef<ReworkHandoverPendingRecord>[]>(
    () => [
      { field: "reworkScheduleDate", headerName: "Schedule Date", valueFormatter: (p) => fromIsoDate(p.value), minWidth: 130 },
      { field: "reworkScheduleId",   headerName: "Rework Schedule Id", minWidth: 150 },
      { field: "companyName",        headerName: "Company",       cellStyle: { fontWeight: 600 }, minWidth: 130 },
      { field: "companyLocation",    headerName: "Location",      minWidth: 110 },
      { field: "productName",        headerName: "Product",       cellStyle: { fontWeight: 600 }, minWidth: 150 },
      { field: "targetQty",          headerName: "Target Qty",    minWidth: 110 },
      { field: "producedQty",        headerName: "Produced Qty",  minWidth: 120 },
      { field: "deliveredQty",       headerName: "Delivered Qty", minWidth: 120 },
      { field: "handoverPendingQty", headerName: "Pending Qty",   minWidth: 110 },
      { field: "readyToMove",        headerName: "Ready To Move", cellRenderer: ReadyToMoveCell, minWidth: 120 },
      {
        headerName: "Action",
        cellRenderer: ActionButtonCell,
        cellRendererParams: {
          onAction: (row: ReworkHandoverPendingRecord) => setDialogRow(row),
          label: "Handover",
          disabled: !canHandover,
        },
        sortable: false, minWidth: 110,
      },
    ],
    [canHandover]
  )

  return (
    <>
      <DataTable<ReworkHandoverPendingRecord>
        title="Rework Handover Pending"
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
