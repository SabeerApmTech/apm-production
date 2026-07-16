import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface DangerIconButtonProps {
  onClick: () => void
  /** Selected-row count — drives both the disabled/enabled look and the adjacent count badge. */
  count: number
  /** "sm" (h-8, panel toolbars) or "md" (h-9, DataTable's own toolbar). */
  size?: "sm" | "md"
  title?: string
}

const DIMENSIONS = { sm: "h-8 w-8", md: "h-9 w-9" }

// The "delete selected rows" icon button + count badge, previously duplicated between
// DataTable's own toolbar and OperationsPanel's.
export function DangerIconButton({ onClick, count, size = "md", title }: DangerIconButtonProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onClick}
        disabled={count === 0}
        title={title}
        className={cn(
          "flex items-center justify-center rounded-lg border transition-all",
          DIMENSIONS[size],
          count > 0
            ? "border-red-400 bg-red-500 text-white shadow-sm hover:bg-red-600 active:bg-red-700"
            : "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-400 dark:text-red-700 cursor-default"
        )}
      >
        <Trash2 className="h-4 w-4" />
      </button>
      {count > 0 && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 px-1.5 text-xs font-bold text-red-600 dark:text-red-300">
          {count}
        </span>
      )}
    </div>
  )
}
