import { Pencil, Trash2 } from "lucide-react"
import type { ICellRendererParams } from "ag-grid-community"

interface EditDeleteCellParams extends ICellRendererParams {
  onEdit?:   (id: number) => void
  onDelete?: (id: number) => void
}

export function EditDeleteCell({ data, onEdit, onDelete }: EditDeleteCellParams) {
  return (
    <div className="flex h-full items-center gap-0.5">
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); if (data) onDelete(data.id) }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
      {onEdit && (
        <button
          onClick={(e) => { e.stopPropagation(); if (data) onEdit(data.id) }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
