import { useState } from "react"
import { TabSwitcher } from "@/shared/TabSwitcher"
import { ProductStockTab } from "./ProductStockTab"
import { AvailableStockList } from "./AvailableStockList"

type StockTab = "product" | "available"

export function StockData() {
  const [tab, setTab] = useState<StockTab>("product")

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4">
      <TabSwitcher
        tabs={[
          { key: "product", label: "Product Data" },
          { key: "available", label: "Available Stock List" },
        ]}
        active={tab}
        onChange={setTab}
      />
      <div className="flex flex-1 min-h-0">
        {tab === "product" ? <ProductStockTab /> : <AvailableStockList />}
      </div>
    </div>
  )
}
