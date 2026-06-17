import { useState, useMemo } from "react"
import type { ColDef } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { ReadyToMoveCell } from "@/shared/renderers/ReadyToMoveCell"
import { ActionButtonCell } from "@/shared/renderers/ActionButtonCell"
import { HandoverDialog } from "./HandoverDialog"
import type { HandoverPendingRow, HandoverFormData } from "./HandoverDialog"

const MOCK_PENDING: HandoverPendingRow[] = [
  { id: 1, scheduleId: "S001 - 26", company: "Lakshitha", product: "AIS 140", targetQty: 3000, deliveredQty: 1000, pendingQty: 2000, readyToMove: 500 },
  { id: 2, scheduleId: "S001 - 26", company: "Lakshitha", product: "AIS 140", targetQty: 3000, deliveredQty: 500,  pendingQty: 2500, readyToMove: 1000 },
  { id: 3, scheduleId: "S002 - 26", company: "Kingstrack", product: "Dashcam", targetQty: 2000, deliveredQty: 800, pendingQty: 1200, readyToMove: 300 },
  { id: 4, scheduleId: "S003 - 26", company: "Kingstrack", product: "CC TV",   targetQty: 1500, deliveredQty: 200, pendingQty: 1300, readyToMove: 750 },
]

export function HandoverPendingList() {
  const [rows,      setRows]      = useState<HandoverPendingRow[]>(MOCK_PENDING)
  const [dialogRow, setDialogRow] = useState<HandoverPendingRow | null>(null)

  function handleHandover(rowId: number, _data: HandoverFormData) {
    setRows((prev) => prev.filter((r) => r.id !== rowId))
  }

  const columnDefs = useMemo<ColDef<HandoverPendingRow>[]>(
    () => [
      { field: "scheduleId",   headerName: "Schedule Id",   minWidth: 120 },
      { field: "company",      headerName: "Company",       cellStyle: { fontWeight: 600 }, minWidth: 120 },
      { field: "product",      headerName: "Product",       cellStyle: { fontWeight: 600 }, minWidth: 110 },
      { field: "targetQty",    headerName: "Target Qty",    minWidth: 110 },
      { field: "deliveredQty", headerName: "Delivered Qty", minWidth: 120 },
      { field: "pendingQty",   headerName: "Pending Qty",   minWidth: 110 },
      { field: "readyToMove",  headerName: "Ready To Move", cellRenderer: ReadyToMoveCell, minWidth: 120 },
      {
        headerName: "Action",
        cellRenderer: ActionButtonCell,
        cellRendererParams: { onAction: (row: HandoverPendingRow) => setDialogRow(row), label: "Handover" },
        sortable: false, minWidth: 110,
      },
    ],
    []
  )

  return (
    <>
      <DataTable<HandoverPendingRow>
        title="Handover Pending"
        rowData={rows}
        columnDefs={columnDefs}
        showDateFilter
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
