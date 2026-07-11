import { useMemo, useState } from "react"
import type { ColDef } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { DatePicker } from "@/components/ui/date-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TabSwitcher, type TabItem } from "@/shared/TabSwitcher"
import { useGetOperatorsQuery } from "@/store/services/userManagementApi"
import { useGetCompaniesQuery } from "@/store/services/companyApi"
import { useGetProductsQuery, useGetOperationsQuery } from "@/store/services/productApi"
import { useGetEmployeePerformanceReportQuery } from "@/store/services/employeePerformanceReportApi"
import type { EmployeePerformanceRecord } from "@/types/employeePerformanceReport"
import { getMonthStartIso, getTodayIso } from "@/utils/date"
import { PerformanceByOperationChart } from "./PerformanceByOperationChart"

type ViewTab = "chart" | "table"

const ALL = "all"

const VIEW_TABS: TabItem<ViewTab>[] = [
  { key: "chart", label: "Chart View" },
  { key: "table", label: "Table View" },
]

export function EmployeePerformanceReport() {
  const [dateRange, setDateRange] = useState({ from: getMonthStartIso(), to: getTodayIso() })
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

  const { data, isLoading } = useGetEmployeePerformanceReportQuery({
    fromDate: dateRange.from || undefined,
    toDate: dateRange.to || undefined,
    employeeId: employeeId === ALL ? undefined : employeeId,
    companyName: companyName === ALL ? undefined : companyName,
    operationName: operationName === ALL ? undefined : operationName,
  })

  // The API returns rows grouped by whatever order employees were created in — sort alphabetically
  // by name so both the chart's employee axis and the table's default order read A→Z.
  const rowData = useMemo(
    () =>
      [...(data ?? [])].sort(
        (a, b) => a.employeeName.localeCompare(b.employeeName) || a.operationName.localeCompare(b.operationName)
      ),
    [data]
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
      <div className="shrink-0 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1 w-36 sm:w-44">
          <span className="text-xs font-medium text-muted-foreground">From Date</span>
          <DatePicker
            value={dateRange.from}
            onChange={(from) => setDateRange((prev) => ({ ...prev, from }))}
            placeholder="From date"
          />
        </div>
        <div className="flex flex-col gap-1 w-36 sm:w-44">
          <span className="text-xs font-medium text-muted-foreground">To Date</span>
          <DatePicker
            value={dateRange.to}
            onChange={(to) => setDateRange((prev) => ({ ...prev, to }))}
            placeholder="To date"
            maxDate={new Date()}
          />
        </div>
        {(dateRange.from || dateRange.to) && (
          <button
            onClick={() => setDateRange({ from: "", to: "" })}
            className="h-10 rounded-lg border border-border px-3 text-sm text-muted-foreground hover:bg-accent transition-colors"
          >
            Clear
          </button>
        )}

        <div className="flex flex-col gap-1 w-40">
          <span className="text-xs font-medium text-muted-foreground">Operator</span>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger><SelectValue placeholder="All Operators" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Operators</SelectItem>
              {(operators ?? []).map((o) => (
                <SelectItem key={o.usersId} value={o.employeeId}>{o.employeeName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 w-40">
          <span className="text-xs font-medium text-muted-foreground">Company</span>
          <Select value={companyName} onValueChange={setCompanyName}>
            <SelectTrigger><SelectValue placeholder="All Companies" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Companies</SelectItem>
              {(companies ?? []).map((c) => (
                <SelectItem key={c.companyId} value={c.companyName}>{c.companyName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 w-40">
          <span className="text-xs font-medium text-muted-foreground">Product</span>
          <Select value={productId} onValueChange={handleProductChange}>
            <SelectTrigger><SelectValue placeholder="All Products" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Products</SelectItem>
              {(products ?? []).map((p) => (
                <SelectItem key={p.productId} value={String(p.productId)}>{p.productName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 w-40">
          <span className="text-xs font-medium text-muted-foreground">Operation</span>
          <Select value={operationName} onValueChange={setOperationName} disabled={productId === ALL}>
            <SelectTrigger><SelectValue placeholder="All Operations" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Operations</SelectItem>
              {(operations ?? []).map((op) => (
                <SelectItem key={op.id} value={op.operationName}>{op.operationName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            hideSno
          />
        )}
      </div>
    </div>
  )
}
