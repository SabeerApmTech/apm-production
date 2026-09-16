import type { ColDef } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { getMonthEndIso, getMonthStartIso } from "@/utils/date"
import { useDateRange } from "@/hooks/useDateRange"
import { useGetClosedSchedulesQuery } from "@/store/services/closedScheduleApi"
import type { ClosedScheduleRecord } from "@/types/closedSchedule"

function formatDisplay(iso: string): string {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

const columnDefs: ColDef<ClosedScheduleRecord>[] = [
  { field: "scheduleDate",     headerName: "Schedule Date",    valueFormatter: (p) => formatDisplay(p.value), minWidth: 130 },
  { field: "scheduleId",       headerName: "Schedule ID",      minWidth: 110 },
  { field: "companyName",      headerName: "Company",          cellStyle: { fontWeight: 600 }, minWidth: 120 },
  { field: "productCode",      headerName: "Product Code",     minWidth: 110 },
  { field: "productName",      headerName: "Item Name",        cellStyle: { fontWeight: 600 }, minWidth: 110 },
  { field: "state",            headerName: "State",            minWidth: 130 },
  { field: "noOfOperations",   headerName: "No of Operations", minWidth: 140 },
  { field: "plannedQty",       headerName: "Planned Qty",      minWidth: 110 },
  { field: "targetDate",       headerName: "Target Date",      valueFormatter: (p) => formatDisplay(p.value), minWidth: 120 },
  { field: "closedAt",         headerName: "Closed Date",      valueFormatter: (p) => formatDisplay(p.value), minWidth: 130 },
  {
    headerName: "Handover",
    valueGetter: (p) => (p.data?.isHandoverCompleted ? "Completed" : "Pending"),
    cellStyle: (p) => ({ fontWeight: 600, color: p.data?.isHandoverCompleted ? "#16a34a" : "#d97706" }),
    minWidth: 110,
  },
  { field: "createdByEmpName", headerName: "Created By",       minWidth: 140 },
]

export function ClosedSchedules() {
  const dateRange = useDateRange()

  const { data, isLoading, isFetching, refetch } = useGetClosedSchedulesQuery({
    fromDate: dateRange.from,
    toDate: dateRange.to,
  })
  const schedules = data ?? []

  return (
    <DataTable<ClosedScheduleRecord>
      title="Closed Schedules"
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
