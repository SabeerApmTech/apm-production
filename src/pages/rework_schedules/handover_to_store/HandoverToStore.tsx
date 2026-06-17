import { useState } from "react"
import { TabSwitcher } from "@/shared/TabSwitcher"
import type { TabItem } from "@/shared/TabSwitcher"
import { HandoverPendingList } from "./HandoverPendingList"
import { HandoverTransactionLog } from "./HandoverTransactionLog"

type Tab = "pending" | "log"

const TABS: TabItem<Tab>[] = [
  { key: "pending", label: "Handover Pending List" },
  { key: "log",     label: "Handover Transaction Log" },
]

export function ReworkHandoverToStore() {
  const [activeTab, setActiveTab] = useState<Tab>("pending")

  return (
    <div className="flex flex-1 flex-col gap-4 min-h-0">
      <TabSwitcher tabs={TABS} active={activeTab} onChange={setActiveTab} />
      <div className="flex flex-1 flex-col min-h-0">
        {activeTab === "pending" ? <HandoverPendingList /> : <HandoverTransactionLog />}
      </div>
    </div>
  )
}
