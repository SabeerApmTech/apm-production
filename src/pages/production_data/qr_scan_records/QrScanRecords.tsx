import { useState } from "react"
import { TabSwitcher, type TabItem } from "@/shared/TabSwitcher"
import { ScheduleWiseTab } from "./ScheduleWiseTab"
import { ProducedProductsTab } from "./ProducedProductsTab"

type ViewTab = "schedule-wise" | "produced-products"

const VIEW_TABS: TabItem<ViewTab>[] = [
  { key: "schedule-wise", label: "Schedule Wise" },
  { key: "produced-products", label: "Produced Products" },
]

export function QrScanRecords() {
  const [activeTab, setActiveTab] = useState<ViewTab>("schedule-wise")

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4">
      <TabSwitcher tabs={VIEW_TABS} active={activeTab} onChange={setActiveTab} />

      <div className="flex flex-1 min-h-0 flex-col">
        {activeTab === "schedule-wise" ? <ScheduleWiseTab /> : <ProducedProductsTab />}
      </div>
    </div>
  )
}
