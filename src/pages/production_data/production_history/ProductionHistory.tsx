import { useCallback, useMemo, useRef, useState } from "react"
import type { ColDef, ICellRendererParams, RowHeightParams } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { FilterSelect, ALL_FILTER_VALUE as ALL } from "@/shared/FilterSelect"
import { useGetProductionHistoryQuery } from "@/store/services/productionHistoryApi"
import { useGetCompaniesQuery } from "@/store/services/companyApi"
import { useGetProductsQuery } from "@/store/services/productApi"
import type { ProductionHistoryScheduleRecord } from "@/types/productionHistory"
import { fromIsoDate, getMonthEndIso, getMonthStartIso } from "@/utils/date"
import { useDateRange } from "@/hooks/useDateRange"
import {
  ExpandCell, isFullWidthRow, MIN_DETAIL_HEIGHT,
  type ScheduleDetailRow,
} from "./ScheduleExpandable"
import { ScheduleOperationsDetail } from "./ScheduleOperationsDetail"

type AnyRow = ProductionHistoryScheduleRecord | ScheduleDetailRow

export function ProductionHistory() {
  const dateRange = useDateRange()
  const [companyName, setCompanyName] = useState(ALL)
  const [productName, setProductName] = useState(ALL)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: companies } = useGetCompaniesQuery()
  const { data: products } = useGetProductsQuery()

  // Operations/logs load lazily inside the detail panel, so its natural height isn't known up
  // front — ScheduleOperationsDetail measures itself and reports back here; resetRowHeights() then
  // makes the grid re-query getRowHeight so the row grows/shrinks to fit instead of leaving gaps.
  const heightMapRef = useRef(new Map<string, number>())

  const getRowHeight = useCallback((params: RowHeightParams<AnyRow>) => {
    const row = params.data as ScheduleDetailRow | undefined
    return row?.__isDetail ? heightMapRef.current.get(row.parentScheduleId) ?? MIN_DETAIL_HEIGHT : undefined
  }, [])

  const renderDetail = useCallback((params: ICellRendererParams<AnyRow>) => {
    const row = params.data as ScheduleDetailRow
    return (
      <ScheduleOperationsDetail
        scheduleId={row.parentScheduleId}
        onHeightChange={(height) => {
          if (heightMapRef.current.get(row.parentScheduleId) === height) return
          heightMapRef.current.set(row.parentScheduleId, height)
          params.api.resetRowHeights()
        }}
      />
    )
  }, [])

  const { data, isLoading, isFetching, refetch } = useGetProductionHistoryQuery({
    fromDate: dateRange.from || undefined,
    toDate: dateRange.to || undefined,
    companyName: companyName === ALL ? undefined : companyName,
    productName: productName === ALL ? undefined : productName,
  })

  const toggleExpand = useCallback((scheduleId: string) => {
    setExpandedId((prev) => (prev === scheduleId ? null : scheduleId))
  }, [])

  const displayRows = useMemo<AnyRow[]>(() => {
    const result: AnyRow[] = []
    for (const row of data ?? []) {
      result.push(row)
      if (expandedId === row.scheduleId) {
        result.push({ __isDetail: true, parentScheduleId: row.scheduleId })
      }
    }
    return result
  }, [data, expandedId])

  const columnDefs = useMemo<ColDef<AnyRow>[]>(
    () => [
      {
        headerName: "", maxWidth: 44, minWidth: 44, sortable: false, resizable: false,
        cellRenderer: ExpandCell,
        cellRendererParams: { expandedId, onToggle: toggleExpand },
      },
      { field: "scheduleId" as keyof ProductionHistoryScheduleRecord, headerName: "Schedule Id", minWidth: 120 },
      {
        headerName: "Schedule Date",
        minWidth: 150,
        valueGetter: (p) => {
          const row = p.data as ProductionHistoryScheduleRecord | undefined
          return row ? fromIsoDate(row.scheduleDate.slice(0, 10)) : ""
        },
      },
      { field: "productName" as keyof ProductionHistoryScheduleRecord, headerName: "Product", cellStyle: { fontWeight: 600 }, minWidth: 110 },
      { field: "companyName" as keyof ProductionHistoryScheduleRecord, headerName: "Company", cellStyle: { fontWeight: 600 }, minWidth: 120 },
      { field: "targetQty" as keyof ProductionHistoryScheduleRecord, headerName: "Target Qty", minWidth: 110 },
    ],
    [expandedId, toggleExpand]
  )

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4">
      <div className="shrink-0 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <FilterSelect
            label="Company"
            value={companyName}
            onValueChange={setCompanyName}
            allLabel="All Companies"
            options={(companies ?? []).map((c) => ({ value: c.companyName, label: c.companyName }))}
          />

          <FilterSelect
            label="Product"
            value={productName}
            onValueChange={setProductName}
            allLabel="All Products"
            options={(products ?? []).map((p) => ({ value: p.productName, label: p.productName }))}
          />
        </div>
      </div>

      <DataTable<AnyRow>
        title="Production History"
        rowData={displayRows}
        columnDefs={columnDefs}
        loading={isLoading}
        onRefresh={refetch}
        refreshing={isFetching}
        hideSno
        showDateFilter
        defaultFromDate={getMonthStartIso()}
        defaultToDate={getMonthEndIso()}
        onDateFilter={dateRange.setRange}
        isFullWidthRow={isFullWidthRow}
        fullWidthCellRenderer={renderDetail}
        getRowHeight={getRowHeight}
      />
    </div>
  )
}
