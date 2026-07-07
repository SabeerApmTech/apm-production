import { useState, useCallback, useMemo, useEffect } from "react"
import type { ColDef, RowClickedEvent, ICellRendererParams } from "ag-grid-community"
import { Pencil } from "lucide-react"
import { Drawer } from "@/components/ui/drawer"
import { DataTable } from "@/shared/DataTable"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { AddProductDialog } from "./AddProductDialog"
import { OperationsPanel } from "./OperationsPanel"
import type { ProductRecord } from "@/types/product"
import {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductsMutation,
} from "@/store/services/productApi"

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

/* ── Cell renderers ─────────────────────────────────────── */
function StagesCell({ data }: ICellRendererParams<ProductRecord>) {
  if (!data) return null
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
        {data.productionOperationCount} Production
      </span>
      {data.reworkOperationCount > 0 && (
        <span className="inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
          {data.reworkOperationCount} Rework
        </span>
      )}
    </div>
  )
}

interface ProductActionCellParams extends ICellRendererParams<ProductRecord> {
  onEdit?: (id: number) => void
}

function ProductActionCell({ data, onEdit }: ProductActionCellParams) {
  return (
    <div className="flex h-full items-center">
      <button
        onClick={(e) => { e.stopPropagation(); if (data) onEdit?.(data.productId) }}
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

  const { data, isLoading } = useGetProductsQuery()
  const products = useMemo(() => data ?? [], [data])

  const [createProduct] = useCreateProductMutation()
  const [updateProduct] = useUpdateProductMutation()
  const [deleteProducts] = useDeleteProductsMutation()

  const [selectedId, setSelectedId]   = useState<number | null>(null)
  const [dialogOpen, setDialogOpen]   = useState(false)
  const [editProduct, setEditProduct] = useState<ProductRecord | undefined>()
  const [deleteRows, setDeleteRows]   = useState<ProductRecord[] | null>(null)

  const selectedProduct = products.find((p) => p.productId === selectedId) ?? null

  const openEditDialog = useCallback((id: number) => {
    const product = products.find((p) => p.productId === id)
    if (product) setEditProduct(product)
  }, [products])

  const closeDelete = useCallback(() => setDeleteRows(null), [])

  const handleDelete = useCallback(async () => {
    if (!deleteRows?.length) return
    const ids = deleteRows.map((r) => r.productId)
    try {
      await deleteProducts(ids).unwrap()
      if (selectedId !== null && ids.includes(selectedId)) setSelectedId(null)
    } catch {
      // Toast middleware already surfaced the error; the list reflects the server's actual state on refetch.
    }
  }, [deleteRows, deleteProducts, selectedId])

  const handleAdd = useCallback(async (product: { itemCode: string; productName: string }) => {
    await createProduct(product).unwrap()
  }, [createProduct])

  const handleEdit = useCallback(async (productId: number, itemCode: string, productName: string) => {
    await updateProduct({ productId, body: { itemCode, productName } }).unwrap()
  }, [updateProduct])

  const onRowClicked = useCallback((e: RowClickedEvent<ProductRecord>) => {
    if (!e.data) return
    const target = e.event?.target as HTMLElement
    if (target?.closest(".ag-selection-checkbox")) return
    if (target?.closest("button")) return
    setSelectedId((prev) => (prev === e.data!.productId ? null : e.data!.productId))
  }, [])

  const columnDefs = useMemo<ColDef<ProductRecord>[]>(
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
      <DataTable<ProductRecord>
        title="Products"
        rowData={products}
        columnDefs={columnDefs}
        loading={isLoading}
        onAdd={() => setDialogOpen(true)}
        onDelete={setDeleteRows}
        checkbox
        onRowClicked={onRowClicked}
        getRowStyle={(p) => ({
          cursor: "pointer",
          ...(p.data?.productId === selectedId ? { background: "#dbeafe" } : {}),
        })}
      />

      {selectedProduct && !isMobile && (
        <OperationsPanel
          key={selectedProduct.productId}
          productId={selectedProduct.productId}
          onClose={() => setSelectedId(null)}
        />
      )}
      {isMobile && (
        <Drawer
          open={selectedId !== null}
          onClose={() => setSelectedId(null)}
          title={selectedProduct?.productName ?? "Operations"}
        >
          {selectedProduct && (
            <OperationsPanel
              key={selectedProduct.productId}
              productId={selectedProduct.productId}
              className="w-full self-auto max-h-none border-0 shadow-none rounded-none"
            />
          )}
        </Drawer>
      )}

      <AddProductDialog
        key={editProduct?.productId ?? "new"}
        open={dialogOpen || editProduct !== undefined}
        onClose={() => { setDialogOpen(false); setEditProduct(undefined) }}
        product={editProduct}
        onAdd={handleAdd}
        onEdit={handleEdit}
      />

      <DeleteDialog
        open={!!deleteRows}
        onClose={closeDelete}
        onConfirm={handleDelete}
        title="Delete Product"
        description={`Are you sure you want to delete the selected product${deleteRows && deleteRows.length > 1 ? "s" : ""}? This action cannot be undone.`}
      />
    </div>
  )
}
