import { useMemo, useState } from "react"
import type { ColDef } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { DateRangeFilter } from "@/shared/DateRangeFilter"
import { FilterSelect, ALL_FILTER_VALUE as ALL } from "@/shared/FilterSelect"
import { TabSwitcher, type TabItem } from "@/shared/TabSwitcher"
import { useGetOperatorsQuery } from "@/store/services/userManagementApi"
import { useGetCompaniesQuery } from "@/store/services/companyApi"
import { useGetProductsQuery, useGetOperationsQuery } from "@/store/services/productApi"
import { useGetEmployeePerformanceReportQuery } from "@/store/services/employeePerformanceReportApi"
import type { EmployeePerformanceRecord } from "@/types/employeePerformanceReport"
import { useDateRange } from "@/hooks/useDateRange"
import { PerformanceByOperationChart } from "./PerformanceByOperationChart"

type ViewTab = "chart" | "table"

const VIEW_TABS: TabItem<ViewTab>[] = [
  { key: "chart", label: "Chart View" },
  { key: "table", label: "Table View" },
]

export function EmployeePerformanceReport() {
  const dateRange = useDateRange()
  const [employeeId, setEmployeeId] = useState(ALL)
  const [companyName, setCompanyName] = useState(ALL)
  const [productId, setProductId] = useState(ALL)
  const [operationName, setOperationName] = useState(ALL)
  const [activeTab, setActiveTab] = useState<ViewTab>("chart")

  const { data: operators } = useGetOperatorsQuery()
  const { data: companies } = useGetCompaniesQuery()
  const { data: products } = useGetProductsQuery()
  const { data: operations } = useGetOperationsQuery(
    { productId: Number(productId), operationType: "production" },
    { skip: productId === ALL }
  )

  const { data, isLoading, isFetching, refetch } = useGetEmployeePerformanceReportQuery({
    fromDate: dateRange.from || undefined,
    toDate: dateRange.to || undefined,
    employeeId: employeeId === ALL ? undefined : employeeId,
    companyName: companyName === ALL ? undefined : companyName,
    operationName: operationName === ALL ? undefined : operationName,
  })

  // The API has no product filter param — filter client-side by the selected product's name.
  const selectedProductName = useMemo(
    () => (productId === ALL ? null : products?.find((p) => String(p.productId) === productId)?.productName ?? null),
    [products, productId]
  )

  // The API returns rows grouped by whatever order employees were created in — sort alphabetically
  // by name so both the chart's employee axis and the table's default order read A→Z.
  const rowData = useMemo(
    () =>
      (data ?? [])
        .filter((row) => !selectedProductName || row.productName === selectedProductName)
        .sort(
          (a, b) => a.employeeName.localeCompare(b.employeeName) || a.operationName.localeCompare(b.operationName)
        ),
    [data, selectedProductName]
  )

  const columnDefs = useMemo<ColDef<EmployeePerformanceRecord>[]>(
    () => [
      { field: "employeeId", headerName: "Employee Id", maxWidth: 130 },
      { field: "employeeName", headerName: "Employee Name", cellStyle: { fontWeight: 600 } },
      { field: "companyName", headerName: "Company" },
      { field: "productName", headerName: "Product" },
      { field: "operationName", headerName: "Operation" },
      { field: "producedQty", headerName: "Produced Qty" },
      { field: "averagePerDay", headerName: "Average / Day" },
    ],
    []
  )

  function handleProductChange(value: string) {
    setProductId(value)
    setOperationName(ALL)
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4">
      <div className="shrink-0 flex flex-col gap-3">
        <DateRangeFilter
          fromDate={dateRange.from}
          toDate={dateRange.to}
          onChange={dateRange.setRange}
        />

        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect
            label="Operator"
            value={employeeId}
            onValueChange={setEmployeeId}
            allLabel="All Operators"
            options={(operators ?? []).map((o) => ({ value: o.employeeId, label: o.employeeName }))}
            className="w-40"
          />

          <FilterSelect
            label="Company"
            value={companyName}
            onValueChange={setCompanyName}
            allLabel="All Companies"
            options={(companies ?? []).map((c) => ({ value: c.companyName, label: c.companyName }))}
            className="w-40"
          />

          <FilterSelect
            label="Product"
            value={productId}
            onValueChange={handleProductChange}
            allLabel="All Products"
            options={(products ?? []).map((p) => ({ value: String(p.productId), label: p.productName }))}
            className="w-40"
          />

          <FilterSelect
            label="Operation"
            value={operationName}
            onValueChange={setOperationName}
            allLabel="All Operations"
            options={(operations ?? []).map((op) => ({ value: op.operationName, label: op.operationName }))}
            disabled={productId === ALL}
            className="w-40"
          />
        </div>
      </div>

      <TabSwitcher tabs={VIEW_TABS} active={activeTab} onChange={setActiveTab} />

      <div className="flex flex-1 min-h-0 flex-col">
        {activeTab === "chart" ? (
          <div className="flex flex-1 min-h-0 flex-col rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-3 shrink-0 text-sm font-semibold text-foreground">Produced Qty by Employee &amp; Operation</h3>
            <div className="flex-1 min-h-0">
              <PerformanceByOperationChart data={rowData} />
            </div>
          </div>
        ) : (
          <DataTable<EmployeePerformanceRecord>
            title="Employee Performance Report"
            rowData={rowData}
            columnDefs={columnDefs}
            loading={isLoading}
            onRefresh={refetch}
            refreshing={isFetching}
            hideSno
          />
        )}
      </div>
    </div>
  )
}
