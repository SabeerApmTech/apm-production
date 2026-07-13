import { useCallback, useMemo, useRef, useState } from "react"
import type { ColDef, ICellRendererParams, RowHeightParams } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { useGetProductionHistoryQuery } from "@/store/services/productionHistoryApi"
import type { ProductionHistoryScheduleRecord } from "@/types/productionHistory"
import { fromIsoDate, getMonthStartIso } from "@/utils/date"
import {
  ExpandCell, isFullWidthRow, MIN_DETAIL_HEIGHT,
  type ScheduleDetailRow,
} from "./ScheduleExpandable"
import { ScheduleOperationsDetail } from "./ScheduleOperationsDetail"

type AnyRow = ProductionHistoryScheduleRecord | ScheduleDetailRow

export function ProductionHistory() {
  const [dateRange, setDateRange] = useState({ from: getMonthStartIso(), to: "" })
  const [expandedId, setExpandedId] = useState<string | null>(null)

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

  const { data, isLoading } = useGetProductionHistoryQuery({
    fromDate: dateRange.from || undefined,
    toDate: dateRange.to || undefined,
  })

  const rows = useMemo(() => data ?? [], [data])

  const toggleExpand = useCallback((scheduleId: string) => {
    setExpandedId((prev) => (prev === scheduleId ? null : scheduleId))
  }, [])

  const displayRows = useMemo<AnyRow[]>(() => {
    const result: AnyRow[] = []
    for (const row of rows) {
      result.push(row)
      if (expandedId === row.scheduleId) {
        result.push({ __isDetail: true, parentScheduleId: row.scheduleId })
      }
    }
    return result
  }, [rows, expandedId])

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
    <DataTable<AnyRow>
      title="Production History"
      rowData={displayRows}
      columnDefs={columnDefs}
      loading={isLoading}
      hideSno
      showDateFilter
      defaultFromDate={getMonthStartIso()}
      onDateFilter={(from, to) => setDateRange({ from, to })}
      isFullWidthRow={isFullWidthRow}
      fullWidthCellRenderer={renderDetail}
      getRowHeight={getRowHeight}
    />
  )
}
