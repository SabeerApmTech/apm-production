import type { ColDef } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { getMonthEndIso, getMonthStartIso } from "@/utils/date"
import { useDateRange } from "@/hooks/useDateRange"
import { useGetCompletedSchedulesQuery } from "@/store/services/completedScheduleApi"
import type { CompletedScheduleRecord } from "@/types/completedSchedule"

function formatDisplay(iso: string): string {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
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
  const dateRange = useDateRange()

  const { data, isLoading, isFetching, refetch } = useGetCompletedSchedulesQuery({
    fromDate: dateRange.from,
    toDate: dateRange.to,
  })
  const schedules = data ?? []

  return (
    <DataTable<CompletedScheduleRecord>
      title="Completed Schedules"
      rowData={schedules}
      columnDefs={columnDefs}
      loading={isLoading}
      onRefresh={refetch}
      refreshing={isFetching}
      showDateFilter
      defaultFromDate={getMonthStartIso()}
      defaultToDate={getMonthEndIso()}
      onDateFilter={dateRange.setRange}
    />
  )
}
