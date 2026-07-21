import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  width?: string
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  width = "520px",
}: DrawerProps) {
  const [mounted, setMounted] = React.useState(false)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    let frameId: number
    let timerId: ReturnType<typeof setTimeout>

    if (open) {
      // Deferred a frame so mounting the panel and flipping it visible stay two separate
      // commits — otherwise the browser never paints the pre-transition (translate-x-full)
      // state and the slide-in animation doesn't run.
      frameId = requestAnimationFrame(() => {
        setMounted(true)
        frameId = requestAnimationFrame(() => setVisible(true))
      })
    } else {
      frameId = requestAnimationFrame(() => setVisible(false))
      timerId = setTimeout(() => setMounted(false), 300)
    }

    return () => {
      cancelAnimationFrame(frameId)
      clearTimeout(timerId)
    }
  }, [open])

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (open) document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onClose])

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "relative flex h-full flex-col bg-card shadow-2xl",
          "transition-transform duration-300 ease-in-out",
          visible ? "translate-x-0" : "translate-x-full"
        )}
        style={{ width: `min(${width}, 100vw)` }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>,
    document.body
  )
}
