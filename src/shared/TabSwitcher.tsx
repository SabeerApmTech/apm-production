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
    <div className="flex shrink-0 gap-1 rounded-xl bg-gray-100 p-1 w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            "rounded-lg px-5 py-2 text-sm font-semibold transition-all",
            active === tab.key
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
