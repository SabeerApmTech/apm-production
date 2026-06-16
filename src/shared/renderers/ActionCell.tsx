import { Pencil } from "lucide-react"
import type { ICellRendererParams } from "ag-grid-community"

interface ActionCellParams extends ICellRendererParams {
  onEdit?: (data: unknown) => void
}

export function ActionCell({ data, onEdit }: ActionCellParams) {
  return (
    <div className="flex h-full items-center">
      <button
        onClick={() => onEdit?.(data)}
        className="flex items-center justify-center rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-blue-500"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  )
}
