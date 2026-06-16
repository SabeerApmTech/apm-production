import { useState, useMemo } from "react"
import type { ColDef } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"

interface CompletedScheduleRow {
  id: number
  scheduleDate: string
  scheduleId: string
  company: string
  product: string
  noOfOperations: number
  targetQty: number
  targetDate: string
  completedDate: string
  createdBy: string
}

const ALL_SCHEDULES: CompletedScheduleRow[] = [
  { id: 1, scheduleDate: "2026-05-26", scheduleId: "S001-26", company: "Lakshika",  product: "AIS 140", noOfOperations: 19, targetQty: 3000, targetDate: "2026-06-17", completedDate: "2026-06-17", createdBy: "2547 : Basheer" },
  { id: 2, scheduleDate: "2026-05-26", scheduleId: "S002-26", company: "Kingstrack", product: "Dashcam", noOfOperations: 8,  targetQty: 2000, targetDate: "2026-06-17", completedDate: "2026-06-17", createdBy: "2547 : Basheer" },
  { id: 3, scheduleDate: "2026-05-26", scheduleId: "S003-26", company: "Kingstrack", product: "CC TV",   noOfOperations: 12, targetQty: 3000, targetDate: "2026-06-17", completedDate: "2026-06-17", createdBy: "2547 : Basheer" },
  { id: 4, scheduleDate: "2026-05-10", scheduleId: "S004-26", company: "Lakshika",  product: "AIS 140", noOfOperations: 15, targetQty: 1500, targetDate: "2026-05-25", completedDate: "2026-05-24", createdBy: "2547 : Basheer" },
  { id: 5, scheduleDate: "2026-04-15", scheduleId: "S005-26", company: "ABC",       product: "Dashcam", noOfOperations: 10, targetQty: 2500, targetDate: "2026-04-30", completedDate: "2026-04-29", createdBy: "2547 : Basheer" },
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

const columnDefs: ColDef<CompletedScheduleRow>[] = [
  { field: "scheduleDate",   headerName: "Schedule Date",    valueFormatter: (p) => formatDisplay(p.value), minWidth: 130 },
  { field: "scheduleId",     headerName: "Schedule ID",      minWidth: 110 },
  { field: "company",        headerName: "Company",          cellStyle: { fontWeight: 600 }, minWidth: 120 },
  { field: "product",        headerName: "Product",          cellStyle: { fontWeight: 600 }, minWidth: 110 },
  { field: "noOfOperations", headerName: "No of Operations", minWidth: 140 },
  { field: "targetQty",      headerName: "Target Qty",       minWidth: 110 },
  { field: "targetDate",     headerName: "Target Date",      valueFormatter: (p) => formatDisplay(p.value), minWidth: 120 },
  { field: "completedDate",  headerName: "Completed Date",   valueFormatter: (p) => formatDisplay(p.value), minWidth: 130 },
  { field: "createdBy",      headerName: "Created By",       minWidth: 140 },
]

export function CompletedSchedules() {
  const [fromDate, setFromDate] = useState("")
  const [toDate,   setToDate]   = useState("")

  const filtered = useMemo(
    () => ALL_SCHEDULES.filter((s) => inRange(s.completedDate, fromDate, toDate)),
    [fromDate, toDate]
  )

  return (
    <DataTable<CompletedScheduleRow>
      title="Completed Schedules"
      rowData={filtered}
      columnDefs={columnDefs}
      showDateFilter
      onDateFilter={(from, to) => { setFromDate(from); setToDate(to) }}
    />
  )
}
