import { useRef, useState, useCallback, useMemo, useLayoutEffect } from "react"
import { AgGridReact } from "ag-grid-react"
import type {
  ColDef, GridReadyEvent, GridApi,
  RowClickedEvent, RowClassParams, RowStyle, RowDragEndEvent,
  IDetailCellRendererParams, IsFullWidthRowParams, RowHeightParams,
} from "ag-grid-community"
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community"
import * as XLSX from "xlsx"
import { Search, Trash2, Plus, FileSpreadsheet } from "lucide-react"
import { cn } from "@/lib/utils"
import { DatePicker } from "@/components/ui/date-picker"
import { getTodayIso } from "@/utils/date"

ModuleRegistry.registerModules([AllCommunityModule])

const AG_HEADER_HEIGHT = 44
const AG_ROW_HEIGHT    = 52
const TOOLBAR_GAP      = 16

export interface DataTableProps<T> {
  title: string
  rowData: T[]
  columnDefs: ColDef<T>[]
  /** Shows AG Grid's built-in loading overlay instead of the "no rows" state while the initial fetch is in flight. */
  loading?: boolean
  onAdd?: () => void
  onDelete?: (rows: T[]) => void
  checkbox?: boolean
  onRowClicked?: (event: RowClickedEvent<T>) => void
  getRowStyle?: (params: RowClassParams<T>) => RowStyle | undefined | null
  rowDrag?: boolean
  hideSno?: boolean
  onRowDragEnd?: (newOrder: T[]) => void
  toolbarExtra?: React.ReactNode
  showDateFilter?: boolean
  onDateFilter?: (from: string, to: string) => void
  /** Pre-fills both date pickers with today's date instead of blank — still user-editable. */
  defaultToToday?: boolean
  masterDetail?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  detailCellRendererParams?: Partial<IDetailCellRendererParams<T, any>>
  isRowMaster?: (dataItem: T) => boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isFullWidthRow?: (params: IsFullWidthRowParams<T>) => boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fullWidthCellRenderer?: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getRowHeight?: (params: RowHeightParams<T>) => number | undefined | null
}

export function DataTable<T>({
  title,
  rowData,
  columnDefs,
  loading = false,
  onAdd,
  onDelete,
  checkbox = false,
  onRowClicked,
  getRowStyle,
  rowDrag = false,
  hideSno = false,
  onRowDragEnd,
  toolbarExtra,
  showDateFilter = false,
  onDateFilter,
  defaultToToday = false,
  masterDetail = false,
  detailCellRendererParams,
  isRowMaster,
  isFullWidthRow,
  fullWidthCellRenderer,
  getRowHeight,
}: DataTableProps<T>) {
  const gridApiRef   = useRef<GridApi<T> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const toolbarRef   = useRef<HTMLDivElement>(null)
  const [search, setSearch]               = useState("")
  const [selectedCount, setSelectedCount] = useState(0)
  const [gridHeight, setGridHeight]       = useState(400)
  const [fromDate, setFromDate]           = useState(defaultToToday ? getTodayIso() : "")
  const [toDate,   setToDate]             = useState(defaultToToday ? getTodayIso() : "")

  const handleFromDate = useCallback((val: string) => {
    setFromDate(val); onDateFilter?.(val, toDate)
  }, [toDate, onDateFilter])

  const handleToDate = useCallback((val: string) => {
    setToDate(val); onDateFilter?.(fromDate, val)
  }, [fromDate, onDateFilter])

  const handleClearDates = useCallback(() => {
    setFromDate(""); setToDate(""); onDateFilter?.("", "")
  }, [onDateFilter])

  useLayoutEffect(() => {
    const recalc = () => {
      const container = containerRef.current
      const toolbar   = toolbarRef.current
      if (!container || !toolbar) return
      const available = container.offsetHeight - toolbar.offsetHeight - TOOLBAR_GAP
      setGridHeight(Math.max(120, available))
    }
    recalc()
    const ro = new ResizeObserver(recalc)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      resizable: true,
      filter: false,
      flex: 1,
      minWidth: 100,
      // Vertically centers cell content by default — most importantly custom icon-button
      // renderers (edit/delete/reset-password/etc.), which otherwise render top-aligned since
      // their own wrapper divs can't reliably resolve a percentage height against the cell.
      // Columns that set their own cellStyle (e.g. colored text) override this, which is fine —
      // plain single-line text doesn't need it.
      cellStyle: { display: "flex", alignItems: "center" },
    }),
    []
  )

  const dragColumn = useMemo<ColDef<T>>(
    () => ({
      headerName: "",
      rowDrag: true,
      width: 44,
      maxWidth: 44,
      sortable: false,
      resizable: false,
      suppressMovable: true,
      cellStyle: { padding: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" },
    }),
    []
  )

  const snoColumn = useMemo<ColDef<T>>(
    () => ({
      headerName: "S.No",
      valueGetter: (p) => (p.node?.rowIndex ?? 0) + 1,
      maxWidth: 70,
    }),
    []
  )

  const allColumnDefs = useMemo(() => {
    const leading: ColDef<T>[] = []
    if (rowDrag) leading.push(dragColumn)
    if (!hideSno) leading.push(snoColumn)
    return [...leading, ...columnDefs]
  }, [rowDrag, hideSno, dragColumn, snoColumn, columnDefs])

  const selectionColumnDef = useMemo(
    () => (checkbox ? { width: 48, maxWidth: 48, pinned: "left" as const } : undefined),
    [checkbox]
  )

  const rowSelection = useMemo(
    () =>
      checkbox
        ? ({ mode: "multiRow" as const, checkboxes: true, headerCheckbox: true, enableClickSelection: false })
        : undefined,
    [checkbox]
  )

  const onGridReady = useCallback((e: GridReadyEvent<T>) => {
    gridApiRef.current = e.api
    e.api.sizeColumnsToFit()
  }, [])

  const onGridSizeChanged = useCallback(() => {
    gridApiRef.current?.sizeColumnsToFit()
  }, [])

  const onSelectionChanged = useCallback(() => {
    setSelectedCount(gridApiRef.current?.getSelectedRows().length ?? 0)
  }, [])

  const handleDelete = useCallback(() => {
    const rows = gridApiRef.current?.getSelectedRows() ?? []
    if (rows.length) onDelete?.(rows)
  }, [onDelete])

  const handleRowDragEnd = useCallback((e: RowDragEndEvent<T>) => {
    if (!onRowDragEnd) return
    const newOrder: T[] = []
    e.api.forEachNodeAfterFilterAndSort((node) => {
      if (node.data) newOrder.push(node.data)
    })
    onRowDragEnd(newOrder)
  }, [onRowDragEnd])

  const exportToExcel = useCallback(() => {
    const exportCols = columnDefs.filter((col) => col.field)
    const headers = ["S.No", ...exportCols.map((col) => col.headerName ?? String(col.field ?? ""))]
    const rows = rowData.map((row, i) => [
      i + 1,
      ...exportCols.map((col) => (row as Record<string, unknown>)[col.field as string] ?? ""),
    ])
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, title)
    XLSX.writeFile(wb, `${title}.xlsx`)
  }, [columnDefs, rowData, title])

  return (
    <div ref={containerRef} className="flex flex-1 flex-col gap-4 min-h-0">
      {/* Toolbar */}
      <div ref={toolbarRef} className="shrink-0 flex flex-wrap items-end gap-3">
        {checkbox && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={selectedCount === 0}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg border transition-all",
                selectedCount > 0
                  ? "border-red-400 bg-red-500 text-white shadow-sm hover:bg-red-600 active:bg-red-700"
                  : "border-red-200 bg-red-50 text-red-400 cursor-default"
              )}
            >
              <Trash2 className="h-4 w-4" />
            </button>
            {selectedCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 px-1.5 text-xs font-bold text-red-600">
                {selectedCount}
              </span>
            )}
          </div>
        )}

        {showDateFilter && (
          <div className="flex flex-row items-end gap-3">
            <div className="flex flex-col gap-1 w-36 sm:w-44">
              <span className="text-xs font-medium text-gray-500">From Date</span>
              <DatePicker value={fromDate} onChange={handleFromDate} placeholder="From date" />
            </div>
            <div className="flex flex-col gap-1 w-36 sm:w-44">
              <span className="text-xs font-medium text-gray-500">To Date</span>
              <DatePicker value={toDate} onChange={handleToDate} placeholder="To date" maxDate={new Date()} />
            </div>
            {(fromDate || toDate) && (
              <button
                onClick={handleClearDates}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {toolbarExtra}

        <div className="flex-1" />

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-56 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:w-72"
          />
        </div>

        <button
          onClick={exportToExcel}
          disabled={rowData.length === 0}
          title="Export to Excel"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border transition-all",
            rowData.length > 0
              ? "border-green-400 bg-green-500 text-white shadow-sm hover:bg-green-600 active:bg-green-700"
              : "border-green-200 bg-green-50 text-green-400 cursor-default"
          )}
        >
          <FileSpreadsheet className="h-4 w-4" />
        </button>

        {onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600 active:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add {title}
          </button>
        )}
      </div>

      {/* Grid */}
      <div
        style={{ height: gridHeight }}
        className="flex flex-col overflow-hidden rounded-xl border border-gray-200 shadow-sm shrink-0"
      >
        <div
          className="ag-theme-quartz flex-1 w-full min-h-0"
          style={
            {
              "--ag-font-family": "inherit",
              "--ag-font-size": "13.5px",
              "--ag-header-background-color": "#f8fafc",
              "--ag-header-foreground-color": "#374151",
              "--ag-header-height": `${AG_HEADER_HEIGHT}px`,
              "--ag-row-height": `${AG_ROW_HEIGHT}px`,
              "--ag-border-color": "#e5e7eb",
              "--ag-row-border-color": "#f1f5f9",
              "--ag-odd-row-background-color": "#fafbfc",
              "--ag-selected-row-background-color": "#eff6ff",
              "--ag-row-hover-color": "#f5f8ff",
              "--ag-checkbox-checked-color": "#3b82f6",
              "--ag-wrapper-border-radius": "0.75rem",
            } as React.CSSProperties
          }
        >
          <AgGridReact<T>
            rowData={rowData}
            columnDefs={allColumnDefs}
            loading={loading}
            defaultColDef={defaultColDef}
            rowSelection={rowSelection}
            selectionColumnDef={selectionColumnDef}
            quickFilterText={search}
            onGridReady={onGridReady}
            onGridSizeChanged={onGridSizeChanged}
            onSelectionChanged={onSelectionChanged}
            onRowClicked={onRowClicked}
            getRowStyle={getRowStyle ? (p) => getRowStyle(p) ?? undefined : undefined}
            rowDragManaged={rowDrag}
            onRowDragEnd={rowDrag ? handleRowDragEnd : undefined}
            suppressMovableColumns
            suppressCellFocus
            enableCellTextSelection
            ensureDomOrder
            animateRows
            masterDetail={masterDetail}
            detailCellRendererParams={detailCellRendererParams}
            isRowMaster={isRowMaster}
            isFullWidthRow={isFullWidthRow}
            fullWidthCellRenderer={fullWidthCellRenderer}
            getRowHeight={getRowHeight}
          />
        </div>
        <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-2">
          <span className="text-sm font-semibold text-gray-500">Count: {rowData.length}</span>
        </div>
      </div>
    </div>
  )
}
