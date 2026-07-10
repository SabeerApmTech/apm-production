import { KeyRound, Pencil } from "lucide-react"
import type { ICellRendererParams } from "ag-grid-community"

interface ActionCellParams extends ICellRendererParams {
  onEdit?: (data: unknown) => void
  onResetPassword?: (data: unknown) => void
}

export function ActionCell({ data, onEdit, onResetPassword }: ActionCellParams) {
  return (
    <div className="flex h-full items-center">
      {onEdit && (
        <button
          onClick={() => onEdit(data)}
          className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition hover:bg-accent hover:text-blue-500 dark:hover:text-blue-400"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
      {onResetPassword && (
        <button
          onClick={() => onResetPassword(data)}
          title="Reset Password"
          className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition hover:bg-accent hover:text-blue-500 dark:hover:text-blue-400"
        >
          <KeyRound className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
