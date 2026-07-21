import { useCallback, useMemo, useState } from "react"
import type { ColDef } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { DateRangeFilter } from "@/shared/DateRangeFilter"
import { FilterSelect, ALL_FILTER_VALUE as ALL } from "@/shared/FilterSelect"
import { TabSwitcher, type TabItem } from "@/shared/TabSwitcher"
import { useGetProductsQuery } from "@/store/services/productApi"
import { useGetCompaniesQuery } from "@/store/services/companyApi"
import { useGetReworkProductProductionSummaryQuery } from "@/store/services/reworkProductWiseReportApi"
import type { ProductProductionSummaryRecord } from "@/types/productWiseReport"
import { useDateRange } from "@/hooks/useDateRange"
import {
  CompanyDetailCellRenderer, ExpandCell, isFullWidthRow, getRowHeight,
  type CompanyDetailRow,
} from "./ProductCompanyDetail"
import { ProductByCompanyChart } from "./ProductByCompanyChart"

type AnyRow = ProductProductionSummaryRecord | CompanyDetailRow
type ViewTab = "chart" | "table"

const VIEW_TABS: TabItem<ViewTab>[] = [
  { key: "chart", label: "Chart View" },
  { key: "table", label: "Table View" },
]

export function ReworkProductWiseReport() {
  const dateRange = useDateRange()
  const [itemCode, setItemCode] = useState(ALL)
  const [companyName, setCompanyName] = useState(ALL)
  const [expandedItemCode, setExpandedItemCode] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ViewTab>("chart")

  const { data: products } = useGetProductsQuery()
  const { data: companies } = useGetCompaniesQuery()

  const { data, isLoading, isFetching, refetch } = useGetReworkProductProductionSummaryQuery({
    fromDate: dateRange.from || undefined,
    toDate: dateRange.to || undefined,
    itemCode: itemCode === ALL ? undefined : itemCode,
  })

  // There's no company-product master mapping in this app, but each summary row already carries
  // its own per-company breakdown — so an itemCode-unfiltered fetch of the same summary is enough
  // to derive both dropdowns' cross-filtered options. Reuses the main query's cache entry whenever
  // no product is selected yet.
  const { data: allSummary } = useGetReworkProductProductionSummaryQuery({
    fromDate: dateRange.from || undefined,
    toDate: dateRange.to || undefined,
  })

  const productOptions = useMemo(() => {
    if (companyName === ALL) return products ?? []
    const codesForCompany = new Set(
      (allSummary ?? [])
        .filter((row) => row.companies.some((c) => c.companyName === companyName))
        .map((row) => row.itemCode)
    )
    return (products ?? []).filter((p) => codesForCompany.has(p.itemCode))
  }, [products, companyName, allSummary])

  const companyOptions = useMemo(() => {
    if (itemCode === ALL) return companies ?? []
    const row = (allSummary ?? []).find((r) => r.itemCode === itemCode)
    const namesForProduct = new Set((row?.companies ?? []).map((c) => c.companyName))
    return (companies ?? []).filter((c) => namesForProduct.has(c.companyName))
  }, [companies, itemCode, allSummary])

  // The API has no company filter param — filter client-side, narrowing each product's
  // `companies` breakdown (and its producedQty) down to just the selected company.
  const rows = useMemo(() => {
    const allRows = data ?? []
    if (companyName === ALL) return allRows
    return allRows
      .map((row) => {
        const companies = row.companies.filter((c) => c.companyName === companyName)
        return { ...row, companies, producedQty: companies.reduce((sum, c) => sum + c.producedQty, 0) }
      })
      .filter((row) => row.companies.length > 0)
  }, [data, companyName])

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
      <div className="shrink-0 flex flex-col gap-3">
        <DateRangeFilter
          fromDate={dateRange.from}
          toDate={dateRange.to}
          onChange={dateRange.setRange}
        />
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect
            label="Product"
            value={itemCode}
            onValueChange={setItemCode}
            allLabel="All Products"
            options={productOptions.map((p) => ({ value: p.itemCode, label: p.productName }))}
          />

          <FilterSelect
            label="Company"
            value={companyName}
            onValueChange={setCompanyName}
            allLabel="All Companies"
            options={companyOptions.map((c) => ({ value: c.companyName, label: c.companyName }))}
          />
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
            title="Rework Product Wise Report"
            rowData={displayRows}
            columnDefs={columnDefs}
            loading={isLoading}
            onRefresh={refetch}
            refreshing={isFetching}
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
