import { NavLink, useLocation } from "react-router-dom"
import { ChevronDown } from "lucide-react"
import { useState } from "react"
import companyLogo from "@/assets/company-logo-white.png"
import { navItems, operatorNavItems } from "@/utils/navigation"
import { getRole } from "@/utils/auth"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const location = useLocation()
  const role = getRole()
  const items = role === 'operator' ? operatorNavItems : navItems

  const isChildActive = (children?: { path: string }[]) =>
    children?.some((c) => location.pathname.startsWith(c.path)) ?? false

  // Accordion — only one parent section open at a time. The section containing the active
  // route always wins; a manual toggle only applies within that same active section, so
  // navigating elsewhere (which changes activeLabel) naturally resets any manual override.
  const activeLabel = items.find((item) => isChildActive(item.children))?.label ?? null
  const [manualLabel, setManualLabel] = useState<string | null>(null)
  const [trackedActiveLabel, setTrackedActiveLabel] = useState(activeLabel)
  if (activeLabel !== trackedActiveLabel) {
    setTrackedActiveLabel(activeLabel)
    setManualLabel(null)
  }
  const openLabel = manualLabel ?? activeLabel

  const toggleItem = (label: string) =>
    setManualLabel(openLabel === label ? null : label)

  return (
    <Sidebar className="bg-[#27375D]">
      {/* Logo */}
      <SidebarHeader className="flex items-center px-5 py-5">
        <img src={companyLogo} alt="APM" className="h-9 w-auto object-contain" />
      </SidebarHeader>

      <SidebarContent className="px-3 pb-4">
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon

            /* Leaf item — no children */
            if (!item.children) {
              return (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.path}
                    className={cn(
                      "text-white/70 hover:bg-white/10 hover:text-white",
                      location.pathname === item.path &&
                        "bg-blue-600 text-white hover:bg-blue-600"
                    )}
                  >
                    <NavLink to={item.path!}>
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            }

            /* Collapsible parent item */
            const isOpen = openLabel === item.label
            const hasActiveChild = isChildActive(item.children)

            return (
              <SidebarMenuItem key={item.label}>
                <Collapsible open={isOpen} onOpenChange={() => toggleItem(item.label)}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className={cn(
                        "text-white/70 hover:bg-white/10 hover:text-white",
                        hasActiveChild && "text-white"
                      )}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform duration-200",
                          isOpen && "rotate-180"
                        )}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.children.map((child) => {
                        const childActive = location.pathname === child.path
                        return (
                          <SidebarMenuSubItem key={child.path}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={childActive}
                              className={cn(
                                "text-white/60 hover:bg-white/10 hover:text-white",
                                childActive && "bg-blue-600 text-white hover:bg-blue-600"
                              )}
                            >
                              <NavLink to={child.path}>{child.label}</NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
