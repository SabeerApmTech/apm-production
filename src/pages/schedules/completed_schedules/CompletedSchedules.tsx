import { useState, useMemo } from "react"
import type { ColDef } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { useGetCompletedSchedulesQuery } from "@/store/services/completedScheduleApi"
import type { CompletedScheduleRecord } from "@/types/completedSchedule"

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

const columnDefs: ColDef<CompletedScheduleRecord>[] = [
  { field: "scheduleDate",     headerName: "Schedule Date",    valueFormatter: (p) => formatDisplay(p.value), minWidth: 130 },
  { field: "scheduleId",       headerName: "Schedule ID",      minWidth: 110 },
  { field: "companyName",      headerName: "Company",          cellStyle: { fontWeight: 600 }, minWidth: 120 },
  { field: "productName",      headerName: "Product",          cellStyle: { fontWeight: 600 }, minWidth: 110 },
  { field: "noOfOperations",   headerName: "No of Operations", minWidth: 140 },
  { field: "targetQty",        headerName: "Target Qty",       minWidth: 110 },
  { field: "targetDate",       headerName: "Target Date",      valueFormatter: (p) => formatDisplay(p.value), minWidth: 120 },
  { field: "completedAt",      headerName: "Completed Date",   valueFormatter: (p) => formatDisplay(p.value), minWidth: 130 },
  { field: "createdByEmpName", headerName: "Created By",       minWidth: 140 },
]

export function CompletedSchedules() {
  const { data, isLoading } = useGetCompletedSchedulesQuery()
  const schedules = useMemo(() => data ?? [], [data])

  const [fromDate, setFromDate] = useState("")
  const [toDate,   setToDate]   = useState("")

  const filtered = useMemo(
    () => schedules.filter((s) => inRange(s.completedAt, fromDate, toDate)),
    [schedules, fromDate, toDate]
  )

  return (
    <DataTable<CompletedScheduleRecord>
      title="Completed Schedules"
      rowData={filtered}
      columnDefs={columnDefs}
      loading={isLoading}
      showDateFilter
      onDateFilter={(from, to) => { setFromDate(from); setToDate(to) }}
    />
  )
}
