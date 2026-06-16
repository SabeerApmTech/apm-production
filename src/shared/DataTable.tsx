import { useRef, useState, useCallback, useMemo, useLayoutEffect } from "react"
import { AgGridReact } from "ag-grid-react"
import type { ColDef, GridReadyEvent, GridApi } from "ag-grid-community"
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community"
import { Search, Trash2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

ModuleRegistry.registerModules([AllCommunityModule])

const AG_HEADER_HEIGHT = 44
const AG_ROW_HEIGHT = 52
const AG_BORDER = 2      // 1px top + 1px bottom
const TOOLBAR_GAP = 16   // gap-4

export interface DataTableProps<T> {
  title: string
  rowData: T[]
  columnDefs: ColDef<T>[]
  onAdd?: () => void
  onDelete?: (rows: T[]) => void
  checkbox?: boolean
}

export function DataTable<T>({
  title,
  rowData,
  columnDefs,
  onAdd,
  onDelete,
  checkbox = false,
}: DataTableProps<T>) {
  const gridApiRef = useRef<GridApi<T> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState("")
  const [selectedCount, setSelectedCount] = useState(0)
  const [gridHeight, setGridHeight] = useState(400)

  const contentHeight = AG_HEADER_HEIGHT + rowData.length * AG_ROW_HEIGHT + AG_BORDER

  useLayoutEffect(() => {
    const recalc = () => {
      const container = containerRef.current
      const toolbar = toolbarRef.current
      if (!container || !toolbar) return
      const available = container.offsetHeight - toolbar.offsetHeight - TOOLBAR_GAP
      setGridHeight(Math.min(contentHeight, Math.max(120, available)))
    }
    recalc()
    const ro = new ResizeObserver(recalc)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [contentHeight])

  const defaultColDef = useMemo<ColDef>(
    () => ({ sortable: true, resizable: true, filter: false, flex: 1, minWidth: 100 }),
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

  const allColumnDefs = useMemo(
    () => [snoColumn, ...columnDefs],
    [snoColumn, columnDefs]
  )

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
    const count = gridApiRef.current?.getSelectedRows().length ?? 0
    setSelectedCount(count)
  }, [])

  const handleDelete = useCallback(() => {
    const rows = gridApiRef.current?.getSelectedRows() ?? []
    if (rows.length) onDelete?.(rows)
  }, [onDelete])

  return (
    <div ref={containerRef} className="flex flex-1 flex-col gap-4 min-h-0">
      {/* Toolbar */}
      <div ref={toolbarRef} className="shrink-0 flex flex-wrap items-center gap-3">
        {/* Delete icon + selected count */}
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

        {/* Total row count */}
        <span className="text-sm font-medium text-gray-500">
          Count: {rowData.length}
        </span>

        <div className="flex-1" />

        {/* Search */}
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

        {/* Add button — only when handler is provided */}
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

      {/* Grid container — fixed calculated height, border never scrolls */}
      <div
        style={{ height: gridHeight }}
        className="overflow-hidden rounded-xl border border-gray-200 shadow-sm shrink-0"
      >
        <div
          className="ag-theme-quartz h-full w-full"
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
            defaultColDef={defaultColDef}
            rowSelection={rowSelection}
            selectionColumnDef={selectionColumnDef}
            quickFilterText={search}
            onGridReady={onGridReady}
            onGridSizeChanged={onGridSizeChanged}
            onSelectionChanged={onSelectionChanged}
            suppressMovableColumns
            suppressCellFocus
            animateRows
          />
        </div>
      </div>
    </div>
  )
}
