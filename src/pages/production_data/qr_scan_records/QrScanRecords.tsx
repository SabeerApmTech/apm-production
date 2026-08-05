import { useState } from "react"
import { TabSwitcher, type TabItem } from "@/shared/TabSwitcher"
import { ScannedRecordsTab } from "./ScannedRecordsTab"
import { ProductSearchTab } from "./ProductSearchTab"

type ViewTab = "scanned-records" | "product-search"

const VIEW_TABS: TabItem<ViewTab>[] = [
  { key: "scanned-records", label: "Scanned Records" },
  { key: "product-search", label: "Product Search" },
]

export function QrScanRecords() {
  const [activeTab, setActiveTab] = useState<ViewTab>("scanned-records")

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4">
      <TabSwitcher tabs={VIEW_TABS} active={activeTab} onChange={setActiveTab} />

      <div className="flex flex-1 min-h-0 flex-col">
        {activeTab === "scanned-records" ? <ScannedRecordsTab /> : <ProductSearchTab />}
      </div>
    </div>
  )
}
