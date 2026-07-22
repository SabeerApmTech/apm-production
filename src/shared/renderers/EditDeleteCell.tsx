import { Pencil, Trash2 } from "lucide-react"
import type { ICellRendererParams } from "ag-grid-community"
import { cn } from "@/lib/utils"

interface EditDeleteCellParams extends ICellRendererParams {
  onEdit?:   (id: number) => void
  onDelete?: (id: number) => void
  /** Per-row override to disable (not hide) the edit action — e.g. a Supervisor viewing a
   * schedule type only a Manager may edit, or vice versa. */
  isEditDisabled?: (data: unknown) => boolean
  /** Per-row override to disable (not hide) the delete action — same idea as `isEditDisabled`. */
  isDeleteDisabled?: (data: unknown) => boolean
}

export function EditDeleteCell({ data, onEdit, onDelete, isEditDisabled, isDeleteDisabled }: EditDeleteCellParams) {
  const editDisabled = Boolean(data && isEditDisabled?.(data))
  const deleteDisabled = Boolean(data && isDeleteDisabled?.(data))
  return (
    <div className="flex h-full items-center gap-0.5">
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); if (data && !deleteDisabled) onDelete(data.id) }}
          disabled={deleteDisabled}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            deleteDisabled
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-400 hover:bg-red-50 hover:text-red-500"
          )}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
      {onEdit && (
        <button
          onClick={(e) => { e.stopPropagation(); if (data && !editDisabled) onEdit(data.id) }}
          disabled={editDisabled}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            editDisabled
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          )}
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
