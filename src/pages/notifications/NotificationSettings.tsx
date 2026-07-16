import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ChevronLeft, Building2, Package, Factory, CalendarClock, Users, Bell,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { getCurrentEmployeeId } from "@/utils/auth"
import {
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingMutation,
} from "@/store/services/notificationApi"
import type { NotificationSetting } from "@/types/notification"

type IconType = React.ComponentType<{ className?: string }>

const CATEGORY_CFG: Record<string, { Icon: IconType; bg: string; text: string }> = {
  Company:          { Icon: Building2,    bg: "bg-blue-100 dark:bg-blue-950/40",     text: "text-blue-500 dark:text-blue-400" },
  Product:          { Icon: Package,      bg: "bg-indigo-100 dark:bg-indigo-950/40", text: "text-indigo-500 dark:text-indigo-400" },
  Production:       { Icon: Factory,      bg: "bg-amber-100 dark:bg-amber-950/40",   text: "text-amber-500 dark:text-amber-400" },
  Schedule:         { Icon: CalendarClock,bg: "bg-purple-100 dark:bg-purple-950/40", text: "text-purple-500 dark:text-purple-400" },
  "User Management":{ Icon: Users,        bg: "bg-green-100 dark:bg-green-950/40",   text: "text-green-500 dark:text-green-400" },
}
const DEFAULT_CATEGORY_CFG = { Icon: Bell, bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-500 dark:text-gray-400" }

// The subject phrase each category's event description is built around — e.g. "a company" for
// Company, but "production" (no article) since that one reads as an ongoing process, not a thing.
const CATEGORY_SUBJECT: Record<string, string> = {
  Company: "a company",
  Product: "a product",
  Production: "production",
  Schedule: "a schedule",
  "User Management": "a user",
}

/** "DEACTIVATED" -> "Deactivated" */
function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase()
}

function eventDescription(category: string, eventType: string): string {
  const subject = CATEGORY_SUBJECT[category] ?? `a ${category.toLowerCase()}`
  return `Get notified when ${subject} is ${eventType.toLowerCase()}.`
}

function SettingsSkeleton() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {[0, 1, 2, 3].map((section) => (
        <div key={section} className="rounded-xl border border-border overflow-hidden h-fit">
          <div className="flex items-center justify-between gap-2 bg-muted/50 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-3 w-14" />
          </div>
          <div className="divide-y divide-border">
            {[0, 1].map((row) => (
              <div key={row} className="flex items-center justify-between gap-4 px-4 py-4">
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-5 w-5 rounded-md shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function NotificationSettings() {
  const navigate = useNavigate()
  const employeeId = getCurrentEmployeeId()
  const { data, isLoading } = useGetNotificationSettingsQuery(employeeId, { skip: !employeeId })
  const [updateSetting] = useUpdateNotificationSettingMutation()
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set())

  // Grouped by category, preserving the API's own ordering rather than re-sorting client-side.
  const groups = new Map<string, NotificationSetting[]>()
  for (const setting of data ?? []) {
    const list = groups.get(setting.category) ?? []
    list.push(setting)
    groups.set(setting.category, list)
  }

  const handleToggle = async (notificationSettingId: number, next: boolean) => {
    setPendingIds((prev) => new Set(prev).add(notificationSettingId))
    try {
      await updateSetting({ notificationSettingId, isActive: next }).unwrap()
    } finally {
      setPendingIds((prev) => {
        const copy = new Set(prev)
        copy.delete(notificationSettingId)
        return copy
      })
    }
  }

  return (
    <div className="flex-1 flex min-h-0 flex-col">
      <button
        onClick={() => navigate("/notifications")}
        className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Back to Notifications
      </button>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <SettingsSkeleton />
        ) : groups.size === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Bell className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No notification settings found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-6">
            {Array.from(groups.entries()).map(([category, settings]) => {
              const { Icon: CategoryIcon, bg, text } = CATEGORY_CFG[category] ?? DEFAULT_CATEGORY_CFG
              return (
                <div key={category} className="flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden h-fit">
                  <div className="flex items-center justify-between gap-2 bg-muted/50 px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", bg)}>
                        <CategoryIcon className={cn("h-4.5 w-4.5", text)} />
                      </div>
                      <span className="text-sm font-bold uppercase tracking-wide text-foreground">{category}</span>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notify</span>
                  </div>

                  <div className="divide-y divide-border">
                    {settings.map((setting) => (
                      <div key={setting.notificationSettingId} className="flex items-center justify-between gap-4 px-4 py-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{titleCase(setting.eventType)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {eventDescription(category, setting.eventType)}
                          </p>
                        </div>
                        <Checkbox
                          checked={setting.isActive}
                          disabled={pendingIds.has(setting.notificationSettingId)}
                          onCheckedChange={(next) => handleToggle(setting.notificationSettingId, next === true)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
