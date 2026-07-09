import { useCallback, useMemo, useState } from "react"
import type { ColDef } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { ReadyToMoveCell } from "@/shared/renderers/ReadyToMoveCell"
import { ActionButtonCell } from "@/shared/renderers/ActionButtonCell"
import { fromIsoDate } from "@/utils/date"
import { getAuthUser } from "@/utils/auth"
import { HandoverDialog } from "./HandoverDialog"
import type { HandoverFormData } from "./HandoverDialog"
import type { HandoverPendingRecord } from "@/types/handoverToStore"
import {
  useGetHandoverPendingListQuery,
  useCreateHandoverMutation,
} from "@/store/services/handoverToStoreApi"

// A column's own cellStyle fully replaces (rather than merges with) DataTable's defaultColDef
// cellStyle, so bold text columns need their own explicit clip — otherwise long values like
// "MICROPROCESSOR" spill into the next column instead of ellipsizing.
const BOLD_CLIPPED_CELL = {
  fontWeight: 600,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const

export function HandoverPendingList() {
  const { data, isLoading } = useGetHandoverPendingListQuery()
  const rows = useMemo(() => data ?? [], [data])

  const [createHandover] = useCreateHandoverMutation()
  const [dialogRow, setDialogRow] = useState<HandoverPendingRecord | null>(null)

  // Only Supervisors can hand over stock to the store.
  const canHandover = getAuthUser()?.employeeRole === "SUPERVISOR"

  const handleHandover = useCallback(async (formData: HandoverFormData) => {
    if (!dialogRow) return
    const user = getAuthUser()
    if (!user) return
    await createHandover({
      scheduleId: dialogRow.scheduleId,
      storeName: formData.storeName,
      receivedBy: formData.receivedBy,
      handoverQty: formData.handoverQty,
      remarks: formData.remarks,
      createdByEmpId: user.employeeId,
    }).unwrap()
  }, [dialogRow, createHandover])

  const columnDefs = useMemo<ColDef<HandoverPendingRecord>[]>(
    () => [
      { field: "scheduleDate",       headerName: "Schedule Date", valueFormatter: (p) => fromIsoDate(p.value), minWidth: 130 },
      { field: "scheduleId",         headerName: "Schedule Id",   minWidth: 120 },
      { field: "companyName",        headerName: "Company",       cellStyle: BOLD_CLIPPED_CELL, minWidth: 130 },
      { field: "companyLocation",    headerName: "Location",      minWidth: 110 },
      { field: "productName",        headerName: "Product",       cellStyle: BOLD_CLIPPED_CELL, minWidth: 150 },
      { field: "targetQty",          headerName: "Target Qty",    minWidth: 110 },
      { field: "producedQty",        headerName: "Produced Qty",  minWidth: 120 },
      { field: "deliveredQty",       headerName: "Delivered Qty", minWidth: 120 },
      { field: "handoverPendingQty", headerName: "Pending Qty",   minWidth: 110 },
      { field: "readyToMove",        headerName: "Ready To Move", cellRenderer: ReadyToMoveCell, minWidth: 120 },
      {
        headerName: "Action",
        cellRenderer: ActionButtonCell,
        cellRendererParams: {
          onAction: (row: HandoverPendingRecord) => setDialogRow(row),
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
      <DataTable<HandoverPendingRecord>
        title="Handover Pending"
        rowData={rows}
        columnDefs={columnDefs}
        loading={isLoading}
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
