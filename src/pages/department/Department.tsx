import { useMemo } from "react"
import type { ColDef } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { useGetDepartmentSummaryQuery } from "@/store/services/departmentReportApi"
import type { DepartmentSummaryRecord } from "@/types/departmentReport"

const columnDefs: ColDef<DepartmentSummaryRecord>[] = [
  { field: "department", headerName: "Department", cellStyle: { fontWeight: 600, textTransform: "capitalize" } },
  { field: "managersCount", headerName: "Managers Count" },
  { field: "supervisorsCount", headerName: "Supervisors Count" },
  { field: "operatorsCount", headerName: "Operators Count" },
  { field: "totalCount", headerName: "Total" },
]

export function Department() {
  const { data, isLoading, isFetching, refetch } = useGetDepartmentSummaryQuery()
  const rowData = useMemo(() => data ?? [], [data])

  return (
    <DataTable<DepartmentSummaryRecord>
      title="Department"
      rowData={rowData}
      columnDefs={columnDefs}
      loading={isLoading}
      onRefresh={refetch}
      refreshing={isFetching}
      hideSno
    />
  )
}
