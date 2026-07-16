import { useRef, useState, useCallback, useMemo, useLayoutEffect } from "react"
import { AgGridReact } from "ag-grid-react"
import type {
  ColDef, GridReadyEvent, GridApi,
  RowClickedEvent, RowClassParams, RowStyle, RowDragEndEvent,
  IDetailCellRendererParams, IsFullWidthRowParams, RowHeightParams,
  ValueFormatterParams, ValueGetterParams,
} from "ag-grid-community"
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community"
import * as XLSX from "xlsx"
import { Search, Plus, FileSpreadsheet, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { DateRangeFilter } from "@/shared/DateRangeFilter"
import { DangerIconButton } from "@/shared/DangerIconButton"
import { getTodayIso } from "@/utils/date"
import { useTheme } from "@/hooks/useTheme"

ModuleRegistry.registerModules([AllCommunityModule])

const AG_HEADER_HEIGHT = 44
const AG_ROW_HEIGHT    = 52
const TOOLBAR_GAP      = 16

// AG Grid's --ag-* custom properties are a separate namespace from the shadcn --color-* tokens
// and are set inline below (inline styles always win over any CSS-level dark: override), so the
// light/dark swap has to happen in JS.
const AG_VARS_LIGHT: Record<string, string> = {
  "--ag-background-color": "#ffffff",
  "--ag-foreground-color": "#111827",
  "--ag-header-background-color": "#f8fafc",
  "--ag-header-foreground-color": "#374151",
  "--ag-border-color": "#e5e7eb",
  "--ag-row-border-color": "#f1f5f9",
  "--ag-odd-row-background-color": "#fafbfc",
  "--ag-selected-row-background-color": "#eff6ff",
  "--ag-row-hover-color": "#f5f8ff",
  "--ag-checkbox-checked-color": "#3b82f6",
}

const AG_VARS_DARK: Record<string, string> = {
  "--ag-background-color": "#18181b",
  "--ag-foreground-color": "#e4e4e7",
  "--ag-header-background-color": "#27272a",
  "--ag-header-foreground-color": "#e4e4e7",
  "--ag-border-color": "#3f3f46",
  "--ag-row-border-color": "#27272a",
  "--ag-odd-row-background-color": "#1f1f23",
  "--ag-selected-row-background-color": "#1e3a5f",
  "--ag-row-hover-color": "#26262b",
  "--ag-checkbox-checked-color": "#3b82f6",
}

const defaultColDef: ColDef = {
  sortable: false,
  resizable: true,
  filter: false,
  flex: 1,
  minWidth: 100,
  wrapHeaderText: true,
  autoHeaderHeight: true,
  // Vertical centering + text-overflow clipping live in the global `.ag-theme-quartz .ag-cell`
  // CSS rule (index.css), not here — a column's own cellStyle fully replaces (rather than
  // merges with) whatever's set here, so a JS-level default silently disappears for any
  // column with custom styling (e.g. bold Company/Product text). The CSS class applies to
  // every cell regardless, and a column's cellStyle can still override individual properties
  // via inline style if it ever needs to (e.g. `whiteSpace: "pre-line"` for multi-line cells).
}

const dragColumn: ColDef = {
  headerName: "",
  rowDrag: true,
  width: 44,
  maxWidth: 44,
  sortable: false,
  resizable: false,
  suppressMovable: true,
  cellStyle: { padding: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" },
}

const snoColumn: ColDef = {
  headerName: "S.No",
  valueGetter: (p) => (p.node?.rowIndex ?? 0) + 1,
  maxWidth: 70,
}

export interface DataTableProps<T> {
  title: string
  rowData: T[]
  columnDefs: ColDef<T>[]
  /** Shows AG Grid's built-in loading overlay instead of the "no rows" state while the initial fetch is in flight. */
  loading?: boolean
  /** Shows a refresh button in the toolbar; clicking it calls this and spins the icon while `refreshing` is true. */
  onRefresh?: () => void
  refreshing?: boolean
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
  /** Pre-fills the From Date picker with this ISO date instead of today/blank — still user-editable. */
  defaultFromDate?: string
  /** Pre-fills the To Date picker with this ISO date instead of today/blank — still user-editable. */
  defaultToDate?: string
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
  onRefresh,
  refreshing = false,
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
  defaultFromDate,
  defaultToDate,
  masterDetail = false,
  detailCellRendererParams,
  isRowMaster,
  isFullWidthRow,
  fullWidthCellRenderer,
  getRowHeight,
}: DataTableProps<T>) {
  const { theme } = useTheme()
  const gridApiRef   = useRef<GridApi<T> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const toolbarRef   = useRef<HTMLDivElement>(null)
  const [search, setSearch]               = useState("")
  const [selectedCount, setSelectedCount] = useState(0)
  const [gridHeight, setGridHeight]       = useState(400)
  const [fromDate, setFromDate]           = useState(defaultFromDate ?? (defaultToToday ? getTodayIso() : ""))
  const [toDate,   setToDate]             = useState(defaultToDate ?? (defaultToToday ? getTodayIso() : ""))

  const handleDateRangeChange = useCallback((from: string, to: string) => {
    setFromDate(from); setToDate(to); onDateFilter?.(from, to)
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

  const allColumnDefs = useMemo(() => {
    const leading: ColDef<T>[] = []
    if (rowDrag) leading.push(dragColumn)
    if (!hideSno) leading.push(snoColumn)
    return [...leading, ...columnDefs]
  }, [rowDrag, hideSno, columnDefs])

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
    const exportCols = columnDefs.filter((col) => col.field || col.valueGetter)
    const headers = ["S.No", ...exportCols.map((col) => col.headerName ?? String(col.field ?? ""))]
    const rows = rowData.map((row, i) => [
      i + 1,
      ...exportCols.map((col) => {
        const raw = col.field
          ? (row as Record<string, unknown>)[col.field as string] ?? ""
          : typeof col.valueGetter === "function"
            ? col.valueGetter({ data: row } as unknown as ValueGetterParams<T>) ?? ""
            : ""
        return typeof col.valueFormatter === "function"
          ? col.valueFormatter({ value: raw, data: row } as unknown as ValueFormatterParams<T>) ?? raw
          : raw
      }),
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
        {checkbox && <DangerIconButton onClick={handleDelete} count={selectedCount} />}

        {showDateFilter && (
          <DateRangeFilter fromDate={fromDate} toDate={toDate} onChange={handleDateRangeChange} />
        )}

        {toolbarExtra}

        <div className="flex-1" />

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-56 rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 sm:w-72"
          />
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            title="Refresh"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm transition-all hover:bg-accent disabled:cursor-default"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </button>
        )}

        <button
          onClick={exportToExcel}
          disabled={rowData.length === 0}
          title="Export to Excel"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border transition-all",
            rowData.length > 0
              ? "border-green-400 bg-green-500 text-white shadow-sm hover:bg-green-600 active:bg-green-700"
              : "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/40 text-green-400 dark:text-green-700 cursor-default"
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
        className="flex flex-col overflow-hidden rounded-xl border border-border shadow-sm shrink-0"
      >
        <div
          className="ag-theme-quartz flex-1 w-full min-h-0"
          style={
            {
              "--ag-font-family": "inherit",
              "--ag-font-size": "13.5px",
              "--ag-header-height": `${AG_HEADER_HEIGHT}px`,
              "--ag-row-height": `${AG_ROW_HEIGHT}px`,
              "--ag-wrapper-border-radius": "0.75rem",
              ...(theme === "dark" ? AG_VARS_DARK : AG_VARS_LIGHT),
            } as React.CSSProperties
          }
        >
          <AgGridReact<T>
            rowData={rowData}
            columnDefs={allColumnDefs}
            loading={loading || refreshing}
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
        <div className="shrink-0 border-t border-border bg-card px-4 py-2">
          <span className="text-sm font-semibold text-muted-foreground">Count: {rowData.length}</span>
        </div>
      </div>
    </div>
  )
}
