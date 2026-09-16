import { useState } from "react"
import type { ColDef, ICellRendererParams, RowClickedEvent } from "ag-grid-community"
import { Pencil, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Drawer } from "@/components/ui/drawer"
import { DataTable } from "@/shared/DataTable"
import { LoadingRow } from "@/shared/LoadingRow"
import { useIsMobile } from "@/hooks/useIsMobile"
import { getAuthUser } from "@/utils/auth"
import { useGetMasterProductsQuery } from "@/store/services/productHierarchyApi"
import { useGetStockOperationsQuery, useUpdateStockQuantityMutation } from "@/store/services/stockApi"
import type { MasterProduct } from "@/types/productHierarchy"
import type { StockOperationItem } from "@/types/stock"

/* ── One operation row — click the pencil to edit its Available Stock Qty inline ── */
function StockOperationRow({ item }: { item: StockOperationItem }) {
  const [editing, setEditing] = useState(false)
  const [qty, setQty] = useState(String(item.availableStockQty))
  const [updateQuantity, { isLoading: saving }] = useUpdateStockQuantityMutation()

  const [prevQty, setPrevQty] = useState(item.availableStockQty)
  if (item.availableStockQty !== prevQty) {
    setPrevQty(item.availableStockQty)
    setQty(String(item.availableStockQty))
  }

  async function handleSave() {
    const user = getAuthUser()
    if (!user || qty === "" || Number(qty) === item.availableStockQty) { setEditing(false); return }
    try {
      await updateQuantity({ stockId: item.stockId, updatedByEmpId: user.employeeId, availableStockQty: Number(qty) }).unwrap()
      setEditing(false)
    } catch {
      // Toast middleware already surfaced the error; keep the field open so the user can retry.
    }
  }

  return (
    <div className="flex items-center gap-3 border-b border-dashed border-gray-200 px-4 py-2.5 text-sm hover:bg-gray-50">
      <span className="w-12 shrink-0 text-center text-gray-400">{item.sequenceNo}</span>
      <span className="w-20 shrink-0 break-words text-gray-700">{item.productionCode}</span>
      <p className="min-w-0 flex-1 truncate text-gray-700">{item.operationName}</p>
      {editing ? (
        <div className="flex shrink-0 items-center gap-1.5">
          <Input
            type="number" min={0} value={qty}
            onChange={(e) => setQty(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setEditing(false) }}
            disabled={saving}
            className="h-8 w-20 text-sm"
            autoFocus
          />
          <Button type="button" size="sm" className="h-8 px-2" disabled={saving} onClick={handleSave}>
            {saving ? "..." : "Save"}
          </Button>
        </div>
      ) : (
        <>
          <span className={cn("w-16 shrink-0 text-center text-sm font-semibold", item.availableStockQty > 0 ? "text-blue-600" : "text-red-500")}>
            {item.availableStockQty}
          </span>
          <button
            type="button"
            aria-label={`Edit stock quantity for ${item.operationName}`}
            onClick={() => setEditing(true)}
            className="shrink-0 text-gray-300 hover:text-blue-500 transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  )
}

function StockOperationsCard({ items, onClose }: { items: StockOperationItem[]; onClose?: () => void }) {
  return (
    <div className="flex w-full shrink-0 max-h-125 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-700">Operations</h3>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close operations" className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500">
        <span className="w-12 text-center">Seq. No</span>
        <span className="w-20 shrink-0">Code</span>
        <span className="flex-1">Operation Name</span>
        <span className="w-16 shrink-0 text-center">Stock Qty</span>
        <span className="w-4" />
      </div>
      <div className="flex-1 overflow-y-auto">
        {items.map((item) => <StockOperationRow key={item.stockId} item={item} />)}
        {items.length === 0 && (
          <div className="flex items-center justify-center py-12 text-sm text-gray-400">No operations for this state.</div>
        )}
      </div>
    </div>
  )
}

/* ── State list (with operation count) + Operations panel stacked below it ── */
function StockStatesColumn({ product, onClose }: { product: MasterProduct; onClose?: () => void }) {
  const isMobile = useIsMobile()
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const { data, isLoading, isError } = useGetStockOperationsQuery({
    itemCode: product.productCode, companyName: product.companyName, productName: product.itemName,
  })
  const groups = data ?? []
  const selectedGroup = groups.find((g) => g.state === selectedState) ?? null

  return (
    <>
      {/* `onClose` is only passed for the desktop side-column placement — inside the mobile
          Drawer (no onClose) this fills the drawer's own width instead. */}
      <div className={cn("flex shrink-0 flex-col gap-4", onClose ? "w-105 self-start" : "w-full")}>
        <div className="flex w-full shrink-0 max-h-125 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-700">State</h3>
            {onClose && (
              <button type="button" onClick={onClose} aria-label="Close states" className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500">
            <span className="flex-1">State</span>
            <span className="w-28 shrink-0 text-center">No of Operations</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {groups.map((g) => (
              <div
                key={g.state}
                onClick={() => setSelectedState((prev) => (prev === g.state ? null : g.state))}
                className={cn(
                  "flex cursor-pointer items-center gap-3 border-b border-dashed border-gray-200 px-4 py-2.5 text-sm hover:bg-gray-50",
                  selectedState === g.state && "bg-blue-50 hover:bg-blue-50"
                )}
              >
                <p className="min-w-0 flex-1 truncate text-gray-700">{g.state}</p>
                <span className="w-28 shrink-0 text-center text-gray-500">{g.operations.length}</span>
              </div>
            ))}
            {isLoading && <LoadingRow label="Loading states…" className="justify-center py-12 text-gray-400" />}
            {isError && <div role="alert" className="p-4 text-sm text-red-600">Unable to load stock data for this product.</div>}
            {!isLoading && !isError && groups.length === 0 && (
              <div className="flex items-center justify-center py-12 text-sm text-gray-400">No states configured for this product.</div>
            )}
          </div>
        </div>

        {selectedGroup && !isMobile && (
          <StockOperationsCard key={selectedGroup.state} items={selectedGroup.operations} onClose={() => setSelectedState(null)} />
        )}
      </div>

      {isMobile && (
        <Drawer open={selectedGroup !== null} onClose={() => setSelectedState(null)} title={selectedGroup?.state ?? "Operations"}>
          {selectedGroup && <StockOperationsCard items={selectedGroup.operations} />}
        </Drawer>
      )}
    </>
  )
}

/* ── Page ───────────────────────────────────────────────── */
export function ProductStockTab() {
  const isMobile = useIsMobile()
  const { data, isLoading, isFetching, refetch } = useGetMasterProductsQuery()
  const products = data ?? []

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selectedProduct = products.find((p) => p.productId === selectedId) ?? null

  const onRowClicked = (e: RowClickedEvent<MasterProduct>) => {
    if (!e.data) return
    setSelectedId((prev) => (prev === e.data!.productId ? null : e.data!.productId))
  }

  const columnDefs: ColDef<MasterProduct>[] = [
    { field: "productCode", headerName: "Product Code", cellStyle: { color: "#3b82f6", fontWeight: 500 } },
    {
      headerName: "Company Name",
      cellRenderer: ({ data }: ICellRendererParams<MasterProduct>) => data && <span>{data.companyName} - ({data.companyCode})</span>,
    },
    {
      headerName: "Item Name",
      cellRenderer: ({ data }: ICellRendererParams<MasterProduct>) => data && <span>{data.itemName} - ({data.itemCode})</span>,
    },
  ]

  return (
    <div className="flex flex-1 min-h-0 gap-4 overflow-x-auto">
      <div className="flex flex-1 min-w-140 min-h-0 flex-col">
        <DataTable<MasterProduct>
          title="Products"
          rowData={products}
          columnDefs={columnDefs}
          loading={isLoading}
          onRefresh={refetch}
          refreshing={isFetching}
          onRowClicked={onRowClicked}
          getRowStyle={(p) => ({
            cursor: "pointer",
            ...(p.data?.productId === selectedId ? { background: "#dbeafe" } : {}),
          })}
        />
      </div>

      {selectedProduct && !isMobile && (
        <StockStatesColumn key={selectedProduct.productId} product={selectedProduct} onClose={() => setSelectedId(null)} />
      )}
      {isMobile && (
        <Drawer open={selectedId !== null} onClose={() => setSelectedId(null)} title={selectedProduct?.itemName ?? "States"}>
          {selectedProduct && (
            <StockStatesColumn key={selectedProduct.productId} product={selectedProduct} />
          )}
        </Drawer>
      )}
    </div>
  )
}
