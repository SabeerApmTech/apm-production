import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, onWheel, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      // Number inputs otherwise let the mouse scroll wheel bump the value while it's focused —
      // blurring on wheel keeps scrolling the page instead of silently editing the quantity.
      onWheel={type === "number" ? (e) => { e.currentTarget.blur(); onWheel?.(e) } : onWheel}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground dark:bg-input/30 border-input flex h-10 w-full min-w-0 rounded-lg border bg-transparent px-4 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-blue-500 focus-visible:ring-[3px] focus-visible:ring-blue-200 dark:focus-visible:ring-blue-900/40",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
