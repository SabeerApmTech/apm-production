import { useState, useMemo } from "react"
import type { ColDef } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"

interface CompletedReworkRow {
  id: number
  reworkScheduleDate: string
  reworkScheduleId: string
  company: string
  product: string
  noOfOperations: number
  targetQty: number
  targetDate: string
  completedDate: string
  createdBy: string
}

const ALL_REWORK: CompletedReworkRow[] = [
  { id: 1, reworkScheduleDate: "2026-05-26", reworkScheduleId: "RS001-26", company: "Lakshika",   product: "AIS 140", noOfOperations: 19, targetQty: 500,  targetDate: "2026-06-17", completedDate: "2026-06-17", createdBy: "2547 : Basheer" },
  { id: 2, reworkScheduleDate: "2026-05-26", reworkScheduleId: "RS002-26", company: "Kingstrack", product: "Dashcam", noOfOperations: 8,  targetQty: 300,  targetDate: "2026-06-17", completedDate: "2026-06-17", createdBy: "2547 : Basheer" },
  { id: 3, reworkScheduleDate: "2026-05-10", reworkScheduleId: "RS003-26", company: "Lakshika",   product: "AIS 140", noOfOperations: 15, targetQty: 1500, targetDate: "2026-05-25", completedDate: "2026-05-24", createdBy: "2547 : Basheer" },
]

function formatDisplay(iso: string): string {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

function inRange(isoDate: string, from: string, to: string): boolean {
  if (!from && !to) return true
  const d = new Date(isoDate).getTime()
  if (from && d < new Date(from).getTime()) return false
  if (to   && d > new Date(to).getTime())   return false
  return true
}

const columnDefs: ColDef<CompletedReworkRow>[] = [
  { field: "reworkScheduleDate", headerName: "Rework Schedule Date", valueFormatter: (p) => formatDisplay(p.value), minWidth: 160 },
  { field: "reworkScheduleId",   headerName: "Rework Schedule ID",   minWidth: 150 },
  { field: "company",            headerName: "Company",              cellStyle: { fontWeight: 600 }, minWidth: 120 },
  { field: "product",            headerName: "Product",              cellStyle: { fontWeight: 600 }, minWidth: 110 },
  { field: "noOfOperations",     headerName: "No of Operations",     minWidth: 150 },
  { field: "targetQty",          headerName: "Target Qty",           minWidth: 110 },
  { field: "targetDate",         headerName: "Target Date",          valueFormatter: (p) => formatDisplay(p.value), minWidth: 120 },
  { field: "completedDate",      headerName: "Completed Date",       valueFormatter: (p) => formatDisplay(p.value), minWidth: 130 },
  { field: "createdBy",          headerName: "Created By",           minWidth: 140 },
]

export function CompletedReworkSchedules() {
  const [fromDate, setFromDate] = useState("")
  const [toDate,   setToDate]   = useState("")

  const filtered = useMemo(
    () => ALL_REWORK.filter((r) => inRange(r.completedDate, fromDate, toDate)),
    [fromDate, toDate]
  )

  return (
    <DataTable<CompletedReworkRow>
      title="Completed Rework Schedules"
      rowData={filtered}
      columnDefs={columnDefs}
      showDateFilter
      onDateFilter={(from, to) => { setFromDate(from); setToDate(to) }}
    />
  )
}
