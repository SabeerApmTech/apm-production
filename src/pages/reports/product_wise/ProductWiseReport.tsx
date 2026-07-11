import { useCallback, useMemo, useState } from "react"
import type { ColDef } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { DatePicker } from "@/components/ui/date-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TabSwitcher, type TabItem } from "@/shared/TabSwitcher"
import { useGetProductsQuery } from "@/store/services/productApi"
import { useGetCompaniesQuery } from "@/store/services/companyApi"
import { useGetProductProductionSummaryQuery } from "@/store/services/productWiseReportApi"
import type { ProductProductionSummaryRecord } from "@/types/productWiseReport"
import {
  CompanyDetailCellRenderer, ExpandCell, isFullWidthRow, getRowHeight,
  type CompanyDetailRow,
} from "./ProductCompanyDetail"
import { ProductByCompanyChart } from "./ProductByCompanyChart"

type AnyRow = ProductProductionSummaryRecord | CompanyDetailRow
type ViewTab = "chart" | "table"

const ALL = "all"

const VIEW_TABS: TabItem<ViewTab>[] = [
  { key: "chart", label: "Chart View" },
  { key: "table", label: "Table View" },
]

export function ProductWiseReport() {
  const [dateRange, setDateRange] = useState({ from: "", to: "" })
  const [itemCode, setItemCode] = useState(ALL)
  const [companyName, setCompanyName] = useState(ALL)
  const [expandedItemCode, setExpandedItemCode] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ViewTab>("chart")

  const { data: products } = useGetProductsQuery()
  const { data: companies } = useGetCompaniesQuery()

  const { data, isLoading } = useGetProductProductionSummaryQuery({
    fromDate: dateRange.from || undefined,
    toDate: dateRange.to || undefined,
    itemCode: itemCode === ALL ? undefined : itemCode,
  })

  const allRows = useMemo(() => data ?? [], [data])

  // The API has no company filter param — filter client-side, narrowing each product's
  // `companies` breakdown (and its producedQty) down to just the selected company.
  const rows = useMemo(() => {
    if (companyName === ALL) return allRows
    return allRows
      .map((row) => {
        const companies = row.companies.filter((c) => c.companyName === companyName)
        return { ...row, companies, producedQty: companies.reduce((sum, c) => sum + c.producedQty, 0) }
      })
      .filter((row) => row.companies.length > 0)
  }, [allRows, companyName])

  const toggleExpand = useCallback((code: string) => {
    setExpandedItemCode((prev) => (prev === code ? null : code))
  }, [])

  const displayRows = useMemo<AnyRow[]>(() => {
    const result: AnyRow[] = []
    for (const row of rows) {
      result.push(row)
      if (expandedItemCode === row.itemCode) {
        result.push({ __isDetail: true, parentItemCode: row.itemCode, companies: row.companies })
      }
    }
    return result
  }, [rows, expandedItemCode])

  const columnDefs = useMemo<ColDef<AnyRow>[]>(() => {
    const cols: ColDef<AnyRow>[] = [
      {
        headerName: "", maxWidth: 44, minWidth: 44, sortable: false, resizable: false,
        cellRenderer: ExpandCell,
        cellRendererParams: { expandedItemCode, onToggle: toggleExpand },
      },
      { field: "itemCode" as keyof ProductProductionSummaryRecord, headerName: "Item Code", maxWidth: 110 },
      { field: "productName" as keyof ProductProductionSummaryRecord, headerName: "Product", cellStyle: { fontWeight: 600 } },
    ]
    // totalEmployees is a whole-product count from the API — not broken down per company, so it's
    // misleading once a single company is selected; only show it in the all-companies view.
    if (companyName === ALL) {
      cols.push({ field: "totalEmployees" as keyof ProductProductionSummaryRecord, headerName: "Employees", maxWidth: 120 })
    }
    cols.push(
      { field: "producedQty" as keyof ProductProductionSummaryRecord, headerName: "Produced Qty" },
      {
        headerName: "Companies",
        sortable: false,
        maxWidth: 120,
        valueGetter: (p) => (p.data as ProductProductionSummaryRecord | undefined)?.companies?.length ?? 0,
      }
    )
    return cols
  }, [expandedItemCode, toggleExpand, companyName])

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
        <div className="flex flex-col gap-1 w-48">
          <span className="text-xs font-medium text-muted-foreground">Product</span>
          <Select value={itemCode} onValueChange={setItemCode}>
            <SelectTrigger><SelectValue placeholder="All Products" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Products</SelectItem>
              {(products ?? []).map((p) => (
                <SelectItem key={p.productId} value={p.itemCode}>{p.productName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 w-48">
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
      </div>

      <TabSwitcher tabs={VIEW_TABS} active={activeTab} onChange={setActiveTab} />

      <div className="flex flex-1 min-h-0 flex-col">
        {activeTab === "chart" ? (
          <div className="flex flex-1 min-h-0 flex-col rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-3 shrink-0 text-sm font-semibold text-foreground">Produced Qty by Product &amp; Company</h3>
            <div className="flex-1 min-h-0">
              <ProductByCompanyChart data={rows} />
            </div>
          </div>
        ) : (
          <DataTable<AnyRow>
            title="Product Wise Report"
            rowData={displayRows}
            columnDefs={columnDefs}
            loading={isLoading}
            hideSno
            isFullWidthRow={isFullWidthRow}
            fullWidthCellRenderer={CompanyDetailCellRenderer}
            getRowHeight={getRowHeight}
          />
        )}
      </div>
    </div>
  )
}
