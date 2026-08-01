import { useMemo, useState } from "react"
import type { ColDef, ValueGetterParams } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { FilterSelect, ALL_FILTER_VALUE as ALL } from "@/shared/FilterSelect"
import { getMonthEndIso, getMonthStartIso } from "@/utils/date"
import { useDateRange } from "@/hooks/useDateRange"
import { useGetOperationQrScanListQuery } from "@/store/services/operationQrScanApi"
import { useGetProductsQuery, useGetIdentifiersQuery } from "@/store/services/productApi"
import { useGetOperatorsQuery } from "@/store/services/userManagementApi"
import type { QrScanRecord } from "@/types/productionMonitoring"

export function ProducedProducts() {
  const dateRange = useDateRange()
  const [productName, setProductName] = useState(ALL)
  const [identifierName, setIdentifierName] = useState(ALL)
  const [employeeId, setEmployeeId] = useState(ALL)

  const { data: products } = useGetProductsQuery()
  const { data: identifiers } = useGetIdentifiersQuery()
  const { data: operators } = useGetOperatorsQuery()

  // Multiple products can share the same identifier name — dedupe for the filter's option list.
  const identifierOptions = useMemo(() => {
    const seen = new Set<string>()
    return (identifiers ?? []).filter((i) => {
      if (seen.has(i.identifierName)) return false
      seen.add(i.identifierName)
      return true
    })
  }, [identifiers])

  const employeeNameById = useMemo(
    () => new Map((operators ?? []).map((o) => [o.employeeId, o.employeeName])),
    [operators]
  )

  const { data, isLoading, isFetching, refetch } = useGetOperationQrScanListQuery({
    productName: productName === ALL ? undefined : productName,
    identifierName: identifierName === ALL ? undefined : identifierName,
    employeeId: employeeId === ALL ? undefined : employeeId,
    fromDate: dateRange.from,
    toDate: dateRange.to,
  })

  const rows = data?.records ?? []

  const columnDefs = useMemo<ColDef<QrScanRecord>[]>(
    () => [
      { field: "scheduleId", headerName: "Schedule ID", minWidth: 110 },
      { field: "companyName", headerName: "Company", cellStyle: { fontWeight: 600 }, minWidth: 140 },
      { field: "productName", headerName: "Product", cellStyle: { fontWeight: 600 }, minWidth: 130 },
      { field: "operationName", headerName: "Operation", minWidth: 130 },
      { field: "identifierName", headerName: "Identifier Name", minWidth: 140 },
      { field: "uniqueIdentifier", headerName: "Unique Identifier", minWidth: 150 },
      {
        headerName: "Employee",
        valueGetter: (p: ValueGetterParams<QrScanRecord>) => {
          if (!p.data) return ""
          const name = employeeNameById.get(p.data.employeeId)
          return name ? `${p.data.employeeId} : ${name}` : p.data.employeeId
        },
        minWidth: 160,
      },
    ],
    [employeeNameById]
  )

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4">
      <div className="shrink-0 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <FilterSelect
            label="Product"
            value={productName}
            onValueChange={setProductName}
            allLabel="All Products"
            options={(products ?? []).map((p) => ({ value: p.productName, label: p.productName }))}
          />

          <FilterSelect
            label="Identifier"
            value={identifierName}
            onValueChange={setIdentifierName}
            allLabel="All Identifiers"
            options={identifierOptions.map((i) => ({ value: i.identifierName, label: i.identifierName }))}
          />

          <FilterSelect
            label="Employee"
            value={employeeId}
            onValueChange={setEmployeeId}
            allLabel="All Employees"
            options={(operators ?? []).map((o) => ({ value: o.employeeId, label: o.employeeName }))}
          />
        </div>
      </div>

      <DataTable<QrScanRecord>
        title="Produced Products"
        rowData={rows}
        columnDefs={columnDefs}
        loading={isLoading}
        onRefresh={refetch}
        refreshing={isFetching}
        showDateFilter
        defaultFromDate={getMonthStartIso()}
        defaultToDate={getMonthEndIso()}
        onDateFilter={dateRange.setRange}
      />
    </div>
  )
}
