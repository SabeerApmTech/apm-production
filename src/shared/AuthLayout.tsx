import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import productionProducts from "@/assets/production-products.jpg"
import { cn } from "@/lib/utils"

interface AuthLayoutProps {
  /** Extra classes for the split card — e.g. sizing. */
  cardClassName?: string
  /** Extra classes for the left (form/content) panel. */
  leftClassName?: string
  /** Optional top-right corner nav button — omit when there's no alternate screen to link to. */
  cornerLabel?: string
  cornerTo?: string
  /** Rendered on top of the right-side product image. */
  rightOverlay?: ReactNode
  children: ReactNode
}

// Shared outer shell for login-style screens: full-viewport centered wrapper, split card,
// optional top-right corner nav button, and the right-side product image panel. Each page still
// owns its own left-panel content (logo, heading, form) since that part differs meaningfully.
export function AuthLayout({ cardClassName, leftClassName, cornerLabel, cornerTo, rightOverlay, children }: AuthLayoutProps) {
  const navigate = useNavigate()

  return (
    <div className="force-light h-dvh overflow-hidden flex items-center justify-center bg-gray-100 px-4">
      <div className={cn("flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-2xl bg-white", cardClassName)}>
        <div className={cn("w-full md:w-1/2 relative", leftClassName)}>
          {cornerLabel && cornerTo && (
            <button
              type="button"
              onClick={() => navigate(cornerTo)}
              className="absolute top-4 right-4 z-10 text-xs rounded-lg px-3 py-1.5 border font-medium transition text-[#1a2a4a] border-[#1a2a4a] hover:bg-[#1a2a4a] hover:text-white"
            >
              {cornerLabel}
            </button>
          )}
          {children}
        </div>

        <div className="hidden md:block w-1/2 relative">
          <img src={productionProducts} alt="APM Products" className="w-full h-full object-cover" />
          {rightOverlay}
        </div>
      </div>
    </div>
  )
}
