import { useCallback, useMemo, useRef, useState } from "react"
import type { ColDef, ICellRendererParams, RowHeightParams } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { useGetQrScheduleListQuery } from "@/store/services/operationQrScanApi"
import type { QrScheduleRecord } from "@/types/qrScanRecords"
import {
  ExpandCell, isFullWidthRow, MIN_DETAIL_HEIGHT,
  type ScheduleDetailRow,
} from "./ScheduleExpandable"
import { TransactionsDetail } from "./TransactionsDetail"

type AnyRow = QrScheduleRecord | ScheduleDetailRow

export function ScheduleWiseTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { data, isLoading, isFetching, refetch } = useGetQrScheduleListQuery()

  // Transactions load lazily inside the detail panel, so its natural height isn't known up front —
  // TransactionsDetail measures itself and reports back here; resetRowHeights() then makes the grid
  // re-query getRowHeight so the row grows/shrinks to fit instead of leaving gaps.
  const heightMapRef = useRef(new Map<string, number>())

  const getRowHeight = useCallback((params: RowHeightParams<AnyRow>) => {
    const row = params.data as ScheduleDetailRow | undefined
    return row?.__isDetail ? heightMapRef.current.get(row.parentScheduleId) ?? MIN_DETAIL_HEIGHT : undefined
  }, [])

  const renderDetail = useCallback((params: ICellRendererParams<AnyRow>) => {
    const row = params.data as ScheduleDetailRow
    return (
      <TransactionsDetail
        scheduleId={row.parentScheduleId}
        onHeightChange={(height) => {
          if (heightMapRef.current.get(row.parentScheduleId) === height) return
          heightMapRef.current.set(row.parentScheduleId, height)
          params.api.resetRowHeights()
        }}
      />
    )
  }, [])

  const toggleExpand = useCallback((scheduleId: string) => {
    setExpandedId((prev) => (prev === scheduleId ? null : scheduleId))
  }, [])

  const displayRows = useMemo<AnyRow[]>(() => {
    const result: AnyRow[] = []
    for (const row of data?.schedules ?? []) {
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
      { field: "scheduleId" as keyof QrScheduleRecord, headerName: "Schedule Id", minWidth: 120 },
      { field: "companyName" as keyof QrScheduleRecord, headerName: "Company", cellStyle: { fontWeight: 600 }, minWidth: 130 },
      { field: "companyLocation" as keyof QrScheduleRecord, headerName: "Location", minWidth: 120 },
      { field: "state" as keyof QrScheduleRecord, headerName: "State", minWidth: 100 },
      { field: "productName" as keyof QrScheduleRecord, headerName: "Product", cellStyle: { fontWeight: 600 }, minWidth: 130 },
      { field: "targetQty" as keyof QrScheduleRecord, headerName: "Target Qty", minWidth: 110 },
    ],
    [expandedId, toggleExpand]
  )

  return (
    <DataTable<AnyRow>
      title="Schedule Wise"
      rowData={displayRows}
      columnDefs={columnDefs}
      loading={isLoading}
      onRefresh={refetch}
      refreshing={isFetching}
      hideSno
      isFullWidthRow={isFullWidthRow}
      fullWidthCellRenderer={renderDetail}
      getRowHeight={getRowHeight}
    />
  )
}
