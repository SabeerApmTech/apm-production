import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  icon: ReactNode
  iconBg: string
  borderColor: string
  textColor: string
  /** "sm" — compact, non-interactive (dashboard header strip). "lg" (default) — larger, clickable filter card. */
  size?: "sm" | "lg"
  active?: boolean
  onClick?: () => void
}

export function StatCard({ label, value, icon, iconBg, borderColor, textColor, size = "lg", active, onClick }: StatCardProps) {
  const iconBox = (
    <div className={cn("flex shrink-0 items-center justify-center rounded-xl", size === "sm" ? "h-8 w-8" : "h-10 w-10", iconBg)}>
      {icon}
    </div>
  )

  if (size === "sm") {
    return (
      <div className={cn("flex shrink-0 min-w-32 items-center gap-2 rounded-xl border-2 bg-card px-2.5 py-2.5 shadow-sm sm:flex-1 sm:min-w-0", borderColor)}>
        {iconBox}
        <div className="min-w-0">
          <p className="whitespace-nowrap text-[11px] font-medium text-muted-foreground">{label}</p>
          <p className={cn("truncate text-sm font-bold", textColor)}>{value}</p>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-36 shrink-0 items-center gap-3 rounded-xl border-2 bg-card p-3 text-left shadow-sm transition-all sm:min-w-0 sm:shrink",
        borderColor,
        active && "ring-2 ring-offset-1 ring-blue-400 ring-offset-background"
      )}
    >
      {iconBox}
      <div className="min-w-0">
        <p className={cn("text-2xl font-bold leading-none", textColor)}>{value}</p>
        <p className="mt-1 text-xs font-medium text-muted-foreground leading-tight">{label}</p>
      </div>
    </button>
  )
}
