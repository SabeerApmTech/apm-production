import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingRowProps {
  label?: string
  /** Icon size — "sm" (h-4, most call sites) or "md" (h-5, larger panels). */
  size?: "sm" | "md"
  className?: string
}

const ICON_SIZE: Record<NonNullable<LoadingRowProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
}

export function LoadingRow({ label = "Loading…", size = "sm", className }: LoadingRowProps) {
  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <Loader2 className={cn(ICON_SIZE[size], "animate-spin")} />
      {label}
    </div>
  )
}
