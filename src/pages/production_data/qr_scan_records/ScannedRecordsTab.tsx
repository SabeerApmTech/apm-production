import { useCallback, useEffect, useMemo, useState } from "react"
import type { ColDef, RowClickedEvent, ValueFormatterParams, ValueGetterParams } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { FilterSelect, ALL_FILTER_VALUE as ALL } from "@/shared/FilterSelect"
import { Drawer } from "@/components/ui/drawer"
import { useDateRange } from "@/hooks/useDateRange"
import { getMonthEndIso, getMonthStartIso, formatLogDateTime } from "@/utils/date"
import { useGetScannedRecordsQuery, useGetScannedRecordsFilterQuery } from "@/store/services/operationQrScanApi"
import { ScannedRecordDetailPanel } from "./ScannedRecordDetailPanel"
import type { ScannedRecord } from "@/types/qrScanRecords"

// Rows have no id of their own — this triple is both what uniquely identifies a row and what
// GET /operation-qr-scan/scanned-record-details keys its lookup by.
function rowKey(r: ScannedRecord): string {
  return `${r.scheduleId}|${r.employeeId}|${r.operationName}`
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return isMobile
}

export function ScannedRecordsTab() {
  const isMobile = useIsMobile()
  const dateRange = useDateRange()
  const [companyName, setCompanyName] = useState(ALL)
  const [productName, setProductName] = useState(ALL)
  const [operationName, setOperationName] = useState(ALL)
  const [employeeId, setEmployeeId] = useState(ALL)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const hasFilter = companyName !== ALL || productName !== ALL || operationName !== ALL || employeeId !== ALL

  // The date-range endpoint is always kept fetched (not just when unfiltered) — besides being the
  // default view, it's also where the filter dropdowns' own option lists come from, so picking one
  // filter doesn't shrink the others' choices down to just whatever survived it.
  const dateQuery = useGetScannedRecordsQuery({ fromDate: dateRange.from, toDate: dateRange.to })
  const filterQuery = useGetScannedRecordsFilterQuery(
    {
      companyName: companyName === ALL ? undefined : companyName,
      productName: productName === ALL ? undefined : productName,
      operationName: operationName === ALL ? undefined : operationName,
      employeeId: employeeId === ALL ? undefined : employeeId,
    },
    { skip: !hasFilter }
  )

  const active = hasFilter ? filterQuery : dateQuery
  const rows = active.data?.records ?? []

  const optionSource = useMemo(() => dateQuery.data?.records ?? [], [dateQuery.data])
  const companyOptions = useMemo(() => [...new Set(optionSource.map((r) => r.companyName))], [optionSource])
  const productOptions = useMemo(() => [...new Set(optionSource.map((r) => r.productName))], [optionSource])
  const operationOptions = useMemo(() => [...new Set(optionSource.map((r) => r.operationName))], [optionSource])
  const employeeOptions = useMemo(() => {
    const seen = new Set<string>()
    return optionSource.filter((r) => {
      if (seen.has(r.employeeId)) return false
      seen.add(r.employeeId)
      return true
    })
  }, [optionSource])

  const selectedRecord = rows.find((r) => rowKey(r) === selectedId) ?? null

  // Compares against `selectedId` captured from this render's closure, not the live value inside
  // a functional setState updater — ag-grid can fire onRowClicked twice for a single physical
  // click, and with a functional updater the second call would see the first call's *pending*
  // result (id2) and toggle it straight back to null, closing the panel the same click opened it.
  // Reading the already-committed `selectedId` instead makes both calls agree, so double-firing is
  // idempotent no matter which row was previously selected.
  const onRowClicked = useCallback((e: RowClickedEvent<ScannedRecord>) => {
    if (!e.data) return
    const clickedId = rowKey(e.data)
    setSelectedId(clickedId === selectedId ? null : clickedId)
  }, [selectedId])

  const columnDefs = useMemo<ColDef<ScannedRecord>[]>(() => {
    const columns: ColDef<ScannedRecord>[] = [
      { field: "scheduleId", headerName: "Schedule ID", minWidth: 110 },
      { field: "companyName", headerName: "Company", cellStyle: { fontWeight: 600 }, minWidth: 140 },
      { field: "companyLocation", headerName: "Location", minWidth: 120 },
      { field: "productName", headerName: "Product", cellStyle: { fontWeight: 600 }, minWidth: 130 },
      { field: "targetQty", headerName: "Target Qty", minWidth: 100 },
      { field: "operationName", headerName: "Operation", minWidth: 130 },
      { field: "uniqueIdentifierName", headerName: "Identifier Name", minWidth: 140 },
      { field: "totalScannedQty", headerName: "Scanned Qty", minWidth: 110 },
      {
        headerName: "Employee",
        valueGetter: (p: ValueGetterParams<ScannedRecord>) => (p.data ? `${p.data.employeeId} : ${p.data.employeeName}` : ""),
        minWidth: 180,
      },
      {
        field: "startedAt",
        headerName: "Started At",
        minWidth: 150,
        cellStyle: { whiteSpace: "pre-line", lineHeight: "1.4" },
        valueFormatter: (p: ValueFormatterParams<ScannedRecord>) => (p.value ? formatLogDateTime(p.value) : ""),
      },
    ]
    return columns
  }, [])

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4">
      <div className="shrink-0 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <FilterSelect
            label="Company"
            value={companyName}
            onValueChange={setCompanyName}
            allLabel="All Companies"
            options={companyOptions.map((c) => ({ value: c, label: c }))}
          />
          <FilterSelect
            label="Product"
            value={productName}
            onValueChange={setProductName}
            allLabel="All Products"
            options={productOptions.map((p) => ({ value: p, label: p }))}
          />
          <FilterSelect
            label="Operation"
            value={operationName}
            onValueChange={setOperationName}
            allLabel="All Operations"
            options={operationOptions.map((o) => ({ value: o, label: o }))}
          />
          <FilterSelect
            label="Employee"
            value={employeeId}
            onValueChange={setEmployeeId}
            allLabel="All Employees"
            options={employeeOptions.map((o) => ({ value: o.employeeId, label: o.employeeName }))}
          />
        </div>
      </div>

      <div className="flex flex-1 min-h-0 gap-4">
        <DataTable<ScannedRecord>
          title="Scanned Records"
          rowData={rows}
          columnDefs={columnDefs}
          loading={active.isLoading}
          onRefresh={active.refetch}
          refreshing={active.isFetching}
          hideSno
          onRowClicked={onRowClicked}
          getRowStyle={(p) => ({
            cursor: "pointer",
            ...(p.data && rowKey(p.data) === selectedId ? { background: "#dbeafe" } : {}),
          })}
          showDateFilter
          defaultFromDate={getMonthStartIso()}
          defaultToDate={getMonthEndIso()}
          onDateFilter={dateRange.setRange}
        />

        {selectedRecord && !isMobile && (
          <ScannedRecordDetailPanel
            key={rowKey(selectedRecord)}
            scheduleId={selectedRecord.scheduleId}
            employeeId={selectedRecord.employeeId}
            operationName={selectedRecord.operationName}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>

      {isMobile && (
        <Drawer open={selectedId !== null} onClose={() => setSelectedId(null)} title="Scan Details">
          {selectedRecord && (
            <ScannedRecordDetailPanel
              key={rowKey(selectedRecord)}
              scheduleId={selectedRecord.scheduleId}
              employeeId={selectedRecord.employeeId}
              operationName={selectedRecord.operationName}
              className="w-full self-auto max-h-none border-0 shadow-none rounded-none"
            />
          )}
        </Drawer>
      )}
    </div>
  )
}
