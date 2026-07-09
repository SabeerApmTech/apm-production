import type { StoreRecord } from "@/types/store"

// No backend endpoint yet — mock data shared between the Store master-data page and the
// Handover-to-Store dialog's store picker until /Store is available.
export const MOCK_STORES: StoreRecord[] = [
  { storeId: 1, storeName: "Main Store" },
  { storeId: 2, storeName: "Raw Material Store" },
  { storeId: 3, storeName: "Finished Goods Store" },
]
