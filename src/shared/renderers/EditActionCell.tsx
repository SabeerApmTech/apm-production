import { Pencil } from "lucide-react"
import type { ICellRendererParams } from "ag-grid-community"

interface EditActionCellParams extends ICellRendererParams {
  onEdit?: (row: unknown) => void
}

// Edit-only action cell shared by the master-data pages (Products, Store, Company) — each row's
// own data is passed straight through, so callers don't need a separate id-lookup step.
export function EditActionCell({ data, onEdit }: EditActionCellParams) {
  return (
    <div className="flex h-full items-center">
      <button
        onClick={(e) => { e.stopPropagation(); if (data) onEdit?.(data) }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  )
}
