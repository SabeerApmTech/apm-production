import { Suspense } from "react"
import { Outlet } from "react-router-dom"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/layout/Sidebar"
import { Header } from "@/layout/Header"
import { PageSkeleton } from "@/components/PageSkeleton"
import { cn } from "@/lib/utils"
import { getRole } from "@/utils/auth"

export function DashboardLayout() {
  // Operators never get dark mode — even if the shared `theme` localStorage preference (set by
  // whoever last used this device) is dark, this subtree opts out via the same `force-light`
  // mechanism the login screens use. `contents` keeps this div out of the layout entirely, since
  // Sidebar is fixed-positioned and SidebarInset offsets itself with margin-left, not flex.
  const isOperator = getRole() === 'operator'

  return (
    <div className={cn("contents", isOperator && "force-light")}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          {/* Own Suspense boundary so a not-yet-loaded page chunk only swaps the content area —
              without this, the nearest boundary is App.tsx's top-level one, which would tear down
              and remount the sidebar/header too on every first visit to a page. */}
          <main className="flex flex-1 flex-col overflow-hidden p-4 md:p-6">
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
