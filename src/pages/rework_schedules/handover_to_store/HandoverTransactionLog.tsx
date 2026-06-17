import { useState, useMemo } from "react"
import type { ColDef } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { DeleteCell } from "@/shared/renderers/DeleteCell"

interface ReworkHandoverLogRow {
  id: number
  dateTime: string
  reworkScheduleId: string
  company: string
  product: string
  handoverQty: number
  givenBy: string
  receivedBy: string
  storeLocation: string
  remarks: string
}

const MOCK_LOG: ReworkHandoverLogRow[] = [
  { id: 1, dateTime: "09/06/2026\n11:20 am", reworkScheduleId: "RS001 - 26", company: "Lakshitha", product: "AIS 140", handoverQty: 1500, givenBy: "Sharmila", receivedBy: "Nandha", storeLocation: "Chennai", remarks: "-" },
  { id: 2, dateTime: "09/06/2026\n02:00 pm", reworkScheduleId: "RS002 - 26", company: "Kingstrack", product: "Dashcam", handoverQty: 800,  givenBy: "Ravi",     receivedBy: "Ashwin", storeLocation: "Main Store", remarks: "-" },
]


export function HandoverTransactionLog() {
  const [rows,     setRows]     = useState<ReworkHandoverLogRow[]>(MOCK_LOG)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  function handleDelete() {
    if (deleteId === null) return
    setRows((prev) => prev.filter((r) => r.id !== deleteId))
    setDeleteId(null)
  }

  const columnDefs = useMemo<ColDef<ReworkHandoverLogRow>[]>(
    () => [
      { field: "dateTime",         headerName: "Date & Time",        minWidth: 130, cellStyle: { whiteSpace: "pre-line", lineHeight: "1.4" } as Record<string, string | number> },
      { field: "reworkScheduleId", headerName: "Rework Schedule Id", minWidth: 150 },
      { field: "company",          headerName: "Company",            cellStyle: { fontWeight: 600 }, minWidth: 120 },
      { field: "product",          headerName: "Product",            cellStyle: { fontWeight: 600 }, minWidth: 110 },
      { field: "handoverQty",      headerName: "Handover Qty",       minWidth: 120 },
      { field: "givenBy",          headerName: "Given By",           minWidth: 120 },
      { field: "receivedBy",       headerName: "Received By",        minWidth: 120 },
      { field: "storeLocation",    headerName: "Store Location",     minWidth: 130 },
      { field: "remarks",          headerName: "Remarks",            minWidth: 110 },
      {
        headerName: "Action",
        cellRenderer: DeleteCell,
        cellRendererParams: { onDelete: (id: number) => setDeleteId(id) },
        sortable: false, minWidth: 100,
      },
    ],
    []
  )

  return (
    <>
      <DataTable<ReworkHandoverLogRow>
        title="Rework Handover Log"
        rowData={rows}
        columnDefs={columnDefs}
        showDateFilter
      />
      <DeleteDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Log Entry"
        description="Are you sure you want to delete this handover log entry? This action cannot be undone."
      />
    </>
  )
}
