import { useState } from "react"
import { cn } from "@/lib/utils"
import { HandoverPendingList } from "./HandoverPendingList"
import { HandoverTransactionLog } from "./HandoverTransactionLog"

type Tab = "pending" | "log"

const TABS: { key: Tab; label: string }[] = [
  { key: "pending", label: "Handover Pending List" },
  { key: "log",     label: "Handover Transaction Log" },
]

export function HandoverToStore() {
  const [activeTab, setActiveTab] = useState<Tab>("pending")

  return (
    <div className="flex flex-1 flex-col gap-4 min-h-0">
      {/* Tab bar */}
      <div className="flex shrink-0 gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "rounded-lg px-5 py-2 text-sm font-semibold transition-all",
              activeTab === tab.key
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex flex-1 flex-col min-h-0">
        {activeTab === "pending" ? <HandoverPendingList /> : <HandoverTransactionLog />}
      </div>
    </div>
  )
}
