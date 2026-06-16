import { useState } from "react"
import { HandoverPendingList } from "./HandoverPendingList"
import { HandoverTransactionLog } from "./HandoverTransactionLog"

type Tab = "pending" | "log"

export function ReworkHandoverToStore() {
  const [activeTab, setActiveTab] = useState<Tab>("pending")

  return (
    <div className="flex flex-1 flex-col gap-4 min-h-0">
      {/* Tab switcher */}
      <div className="inline-flex shrink-0 rounded-xl bg-gray-100 p-1 gap-1 self-start">
        {([
          { key: "pending", label: "Handover Pending List" },
          { key: "log",     label: "Handover Transaction Log" },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={
              activeTab === key
                ? "rounded-lg bg-white px-5 py-2 text-sm font-semibold text-blue-600 shadow-sm transition-all"
                : "rounded-lg px-5 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-all"
            }
          >
            {label}
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
