import { cn } from "@/lib/utils"

export interface TabItem<T extends string> {
  key: T
  label: string
}

interface TabSwitcherProps<T extends string> {
  tabs: TabItem<T>[]
  active: T
  onChange: (key: T) => void
}

export function TabSwitcher<T extends string>({ tabs, active, onChange }: TabSwitcherProps<T>) {
  return (
    <div className="flex shrink-0 gap-1 rounded-xl bg-muted p-1 w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            "rounded-lg px-5 py-2 text-sm font-semibold transition-all",
            active === tab.key
              ? "bg-card text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
