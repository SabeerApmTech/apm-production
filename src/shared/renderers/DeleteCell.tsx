import { Trash2 } from "lucide-react"
import type { ICellRendererParams } from "ag-grid-community"

interface DeleteCellParams extends ICellRendererParams {
  onDelete?: (id: number) => void
}

export function DeleteCell({ data, onDelete }: DeleteCellParams) {
  return (
    <div className="flex h-full items-center">
      <button
        onClick={(e) => { e.stopPropagation(); if (data) onDelete?.(data.id) }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
