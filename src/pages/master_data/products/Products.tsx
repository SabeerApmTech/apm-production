import { useState, useCallback, useMemo, useEffect } from "react"
import type { ColDef, RowClickedEvent, ICellRendererParams } from "ag-grid-community"
import { Drawer } from "@/components/ui/drawer"
import { DataTable } from "@/shared/DataTable"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { AddProductDialog } from "./AddProductDialog"
import { OperationsPanel } from "./OperationsPanel"
import { useDialogState } from "@/hooks/useDialogState"
import { EditActionCell } from "@/shared/renderers"
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
    <div className="flex flex-col justify-center gap-0.5 leading-tight">
      <span className="text-xs font-semibold text-blue-600">
        Production : {data.productionOperationCount} Stages
      </span>
      <span className="text-xs font-semibold text-amber-600">
        Rework : {data.reworkOperationCount} Stages
      </span>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────── */
export function Products() {
  const isMobile = useIsMobile()

  const { data, isLoading, isFetching, refetch } = useGetProductsQuery()
  const products = data ?? []

  const [createProduct] = useCreateProductMutation()
  const [updateProduct] = useUpdateProductMutation()
  const [deleteProducts] = useDeleteProductsMutation()

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const dialog = useDialogState<ProductRecord>()
  const [deleteRows, setDeleteRows] = useState<ProductRecord[] | null>(null)

  const selectedProduct = products.find((p) => p.productId === selectedId) ?? null

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
      { headerName: "Action",  cellRenderer: EditActionCell, cellRendererParams: { onEdit: dialog.openEdit }, sortable: false, maxWidth: 80 },
    ],
    [dialog]
  )

  return (
    <div className="flex flex-1 min-h-0 gap-4">
      <DataTable<ProductRecord>
        title="Products"
        rowData={products}
        columnDefs={columnDefs}
        loading={isLoading}
        onRefresh={refetch}
        refreshing={isFetching}
        onAdd={dialog.openAdd}
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
        key={dialog.editing?.productId ?? "new"}
        open={dialog.isOpen}
        onClose={dialog.close}
        product={dialog.editing}
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
