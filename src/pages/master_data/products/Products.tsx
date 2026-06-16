import { useState, useCallback, useMemo, useEffect } from "react"
import type { ColDef, RowClickedEvent, ICellRendererParams } from "ag-grid-community"
import { Pencil } from "lucide-react"
import { Drawer } from "@/components/ui/drawer"
import { DataTable } from "@/shared/DataTable"
import { AddProductDialog } from "./AddProductDialog"
import { OperationsPanel } from "./OperationsPanel"

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return isMobile
}

/* ── Types ─────────────────────────────────────────────── */
export interface Operation {
  id: string
  operation: string
}

export interface ProductRow {
  id: number
  itemCode: string
  productName: string
  productionStages: Operation[]
  reworkStages: Operation[]
}

/* ── Mock data ──────────────────────────────────────────── */
const initialProducts: ProductRow[] = [
  {
    id: 1,
    itemCode: "66547874",
    productName: "AIS 140 Standard",
    productionStages: [
      { id: "p1-1",  operation: "Enclosure Wiring Harness Fixing" },
      { id: "p1-2",  operation: "Led fixing" },
      { id: "p1-3",  operation: "Battery fixing" },
      { id: "p1-4",  operation: "Sticker fix in battery" },
      { id: "p1-5",  operation: "Top sticker fixing" },
      { id: "p1-6",  operation: "Gaskets fixing" },
      { id: "p1-7",  operation: "Power cable folding" },
      { id: "p1-8",  operation: "Box folding" },
      { id: "p1-9",  operation: "SOS and power cable packing" },
      { id: "p1-10", operation: "Device testing" },
      { id: "p1-11", operation: "Firmware flashing" },
      { id: "p1-12", operation: "GPS antenna attachment" },
      { id: "p1-13", operation: "SIM card insertion" },
      { id: "p1-14", operation: "Quality inspection" },
      { id: "p1-15", operation: "Label printing" },
      { id: "p1-16", operation: "Final assembly check" },
      { id: "p1-17", operation: "Weight check" },
      { id: "p1-18", operation: "Packaging" },
      { id: "p1-19", operation: "Dispatch readiness check" },
    ],
    reworkStages: [
      { id: "r1-1", operation: "Defect identification" },
      { id: "r1-2", operation: "Component replacement" },
      { id: "r1-3", operation: "Re-soldering" },
      { id: "r1-4", operation: "Re-testing" },
      { id: "r1-5", operation: "Re-inspection" },
    ],
  },
  {
    id: 2,
    itemCode: "66547875",
    productName: "Dashcam",
    productionStages: [
      { id: "p2-1",  operation: "PCB assembly" },
      { id: "p2-2",  operation: "Camera module fixing" },
      { id: "p2-3",  operation: "Lens calibration" },
      { id: "p2-4",  operation: "Memory card insertion" },
      { id: "p2-5",  operation: "Power on test" },
      { id: "p2-6",  operation: "Video recording test" },
      { id: "p2-7",  operation: "Night vision check" },
      { id: "p2-8",  operation: "Mount assembly" },
      { id: "p2-9",  operation: "Cable routing" },
      { id: "p2-10", operation: "Final inspection" },
      { id: "p2-11", operation: "Firmware update" },
      { id: "p2-12", operation: "Packaging" },
      { id: "p2-13", operation: "Label affixing" },
      { id: "p2-14", operation: "Box sealing" },
    ],
    reworkStages: [],
  },
  {
    id: 3,
    itemCode: "66547876",
    productName: "CCTV",
    productionStages: [],
    reworkStages: [],
  },
]

/* ── Cell renderers ─────────────────────────────────────── */
function StagesCell({ data }: ICellRendererParams<ProductRow>) {
  if (!data) return null
  const prod = data.productionStages.length
  const rew  = data.reworkStages.length
  const text = rew > 0 ? `${prod} Stages | ${rew} Stages` : `${prod} Stages`
  return <span className="text-blue-500 text-sm">{text}</span>
}

interface ProductActionCellParams extends ICellRendererParams<ProductRow> {
  onEdit?: (id: number) => void
}

function ProductActionCell({ data, onEdit }: ProductActionCellParams) {
  return (
    <div className="flex h-full items-center">
      <button
        onClick={(e) => { e.stopPropagation(); if (data) onEdit?.(data.id) }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────── */
export function Products() {
  const isMobile = useIsMobile()

  const [products, setProducts]       = useState<ProductRow[]>(initialProducts)
  const [selectedId, setSelectedId]   = useState<number | null>(null)
  const [dialogOpen, setDialogOpen]   = useState(false)
  const [editProduct, setEditProduct] = useState<ProductRow | undefined>()

  const selectedProduct = products.find((p) => p.id === selectedId) ?? null

  const openEditDialog = useCallback((id: number) => {
    const product = products.find((p) => p.id === id)
    if (product) setEditProduct(product)
  }, [products])

  const handleDelete = useCallback((rows: ProductRow[]) => {
    const ids = new Set(rows.map((r) => r.id))
    setProducts((prev) => prev.filter((p) => !ids.has(p.id)))
    if (selectedId !== null && ids.has(selectedId)) setSelectedId(null)
  }, [selectedId])

  const handleAdd = useCallback((product: Omit<ProductRow, "id">) => {
    setProducts((prev) => [
      ...prev,
      { ...product, id: Math.max(0, ...prev.map((p) => p.id)) + 1 },
    ])
  }, [])

  const handleEdit = useCallback((id: number, itemCode: string, productName: string) => {
    setProducts((prev) =>
      prev.map((p) => p.id === id ? { ...p, itemCode, productName } : p)
    )
  }, [])

  const handleUpdateOperations = useCallback(
    (type: "production" | "rework", ops: Operation[]) => {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedId
            ? { ...p, ...(type === "production" ? { productionStages: ops } : { reworkStages: ops }) }
            : p
        )
      )
    },
    [selectedId]
  )

  const onRowClicked = useCallback((e: RowClickedEvent<ProductRow>) => {
    if (!e.data) return
    const target = e.event?.target as HTMLElement
    if (target?.closest(".ag-selection-checkbox")) return
    if (target?.closest("button")) return
    setSelectedId((prev) => (prev === e.data!.id ? null : e.data!.id))
  }, [])

  const columnDefs = useMemo<ColDef<ProductRow>[]>(
    () => [
      { field: "itemCode",     headerName: "Item Code", cellStyle: { color: "#3b82f6", fontWeight: 500 } },
      { field: "productName",  headerName: "Product Name" },
      { headerName: "Operations", cellRenderer: StagesCell, sortable: false },
      { headerName: "Action",  cellRenderer: ProductActionCell, cellRendererParams: { onEdit: openEditDialog }, sortable: false, maxWidth: 80 },
    ],
    [openEditDialog]
  )

  return (
    <div className="flex flex-1 min-h-0 gap-4">
      <DataTable<ProductRow>
        title="Products"
        rowData={products}
        columnDefs={columnDefs}
        onAdd={() => setDialogOpen(true)}
        onDelete={handleDelete}
        checkbox
        onRowClicked={onRowClicked}
        getRowStyle={(p) => ({
          cursor: "pointer",
          ...(p.data?.id === selectedId ? { background: "#dbeafe" } : {}),
        })}
      />

      {selectedProduct && !isMobile && (
        <OperationsPanel key={selectedProduct.id} product={selectedProduct} onUpdate={handleUpdateOperations} />
      )}
      {isMobile && (
        <Drawer
          open={selectedId !== null}
          onClose={() => setSelectedId(null)}
          title={selectedProduct?.productName ?? "Operations"}
        >
          {selectedProduct && (
            <OperationsPanel
              key={selectedProduct.id}
              product={selectedProduct}
              onUpdate={handleUpdateOperations}
              className="w-full self-auto max-h-none border-0 shadow-none rounded-none"
            />
          )}
        </Drawer>
      )}

      <AddProductDialog
        key={editProduct?.id ?? "new"}
        open={dialogOpen || editProduct !== undefined}
        onClose={() => { setDialogOpen(false); setEditProduct(undefined) }}
        product={editProduct}
        onAdd={handleAdd}
        onEdit={handleEdit}
      />
    </div>
  )
}
