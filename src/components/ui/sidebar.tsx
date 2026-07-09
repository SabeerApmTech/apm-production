import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

const SIDEBAR_WIDTH = "250px"
const SIDEBAR_BREAKPOINT = 1024

type SidebarContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  toggleSidebar: () => void
  isMobile: boolean
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

function SidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isMobile, setIsMobile] = React.useState(
    () => window.innerWidth < SIDEBAR_BREAKPOINT
  )
  const [open, setOpen] = React.useState(
    () => defaultOpen && window.innerWidth >= SIDEBAR_BREAKPOINT
  )

  React.useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < SIDEBAR_BREAKPOINT
      setIsMobile(mobile)
      setOpen(!mobile)
    }
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const toggleSidebar = React.useCallback(() => setOpen((v) => !v), [])

  return (
    <SidebarContext.Provider value={{ open, setOpen, toggleSidebar, isMobile }}>
      {children}
    </SidebarContext.Provider>
  )
}

function useSidebar() {
  const ctx = React.useContext(SidebarContext)
  if (!ctx) throw new Error("useSidebar must be used inside <SidebarProvider>")
  return ctx
}

function Sidebar({ className, children, ...props }: React.ComponentProps<"aside">) {
  const { open, isMobile, setOpen } = useSidebar()

  return (
    <>
      {isMobile && open && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      <aside
        data-slot="sidebar"
        style={{ width: SIDEBAR_WIDTH }}
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col transition-transform duration-300 ease-in-out",
          isMobile
            ? open
              ? "translate-x-0 shadow-2xl"
              : "-translate-x-full"
            : "translate-x-0",
          className
        )}
        {...props}
      >
        {children}
      </aside>
    </>
  )
}

function SidebarTrigger({ className, children, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar()
  return (
    <button
      data-slot="sidebar-trigger"
      onClick={toggleSidebar}
      aria-label="Toggle sidebar"
      className={cn("inline-flex items-center justify-center", className)}
      {...props}
    >
      {children}
    </button>
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="sidebar-header" className={cn("shrink-0", className)} {...props} />
  )
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn("flex flex-1 flex-col overflow-y-auto overflow-x-hidden no-scrollbar", className)}
      {...props}
    />
  )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="sidebar-group" className={cn("flex flex-col gap-0.5 px-3 py-2", className)} {...props} />
  )
}

function SidebarGroupLabel({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="sidebar-group-label"
      className={cn("px-3 py-1 text-xs font-semibold uppercase tracking-wider opacity-50", className)}
      {...props}
    />
  )
}

function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="sidebar-group-content" className={cn("flex flex-col gap-0.5", className)} {...props} />
  )
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul data-slot="sidebar-menu" className={cn("flex flex-col gap-1.5", className)} {...props} />
  )
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li data-slot="sidebar-menu-item" className={cn("list-none", className)} {...props} />
  )
}

function SidebarMenuButton({
  className,
  isActive,
  asChild,
  ...props
}: React.ComponentProps<"button"> & { isActive?: boolean; asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      data-slot="sidebar-menu-button"
      data-active={isActive}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      className={cn("ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-white/10 pl-3", className)}
      {...props}
    />
  )
}

function SidebarMenuSubItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li data-slot="sidebar-menu-sub-item" className={cn("list-none", className)} {...props} />
  )
}

function SidebarMenuSubButton({
  className,
  isActive,
  asChild,
  ...props
}: React.ComponentProps<"button"> & { isActive?: boolean; asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-active={isActive}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
        className
      )}
      {...props}
    />
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<"div">) {
  const { isMobile } = useSidebar()
  return (
    <div
      data-slot="sidebar-inset"
      style={{ marginLeft: isMobile ? 0 : SIDEBAR_WIDTH }}
      className={cn("flex h-dvh flex-col overflow-hidden transition-all duration-300", className)}
      {...props}
    />
  )
}

export {
  SidebarProvider,
  useSidebar,
  Sidebar,
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarInset,
}
