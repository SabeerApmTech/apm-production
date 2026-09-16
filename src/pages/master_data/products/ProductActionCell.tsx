import { Copy, Pencil } from "lucide-react"
import type { ICellRendererParams } from "ag-grid-community"

interface ProductActionCellParams extends ICellRendererParams {
  onEdit?: (row: unknown) => void
  onDuplicate?: (row: unknown) => void
}

// Edit + Duplicate action cell for the Products table — Duplicate opens a dialog to copy this
// product (and some/all of its states + operations) under a different company.
export function ProductActionCell({ data, onEdit, onDuplicate }: ProductActionCellParams) {
  return (
    <div className="flex h-full items-center gap-0.5">
      <button
        onClick={(e) => { e.stopPropagation(); if (data) onEdit?.(data) }}
        aria-label="Edit product"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); if (data) onDuplicate?.(data) }}
        aria-label="Duplicate product"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
      >
        <Copy className="h-4 w-4" />
      </button>
    </div>
  )
}
