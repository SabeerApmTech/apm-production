import { useState, useCallback, useMemo } from "react"
import type { ColDef, RowClickedEvent, ICellRendererParams } from "ag-grid-community"
import { Drawer } from "@/components/ui/drawer"
import { DataTable } from "@/shared/DataTable"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { AddProductDialog } from "./AddProductDialog"
import { StatesPanel } from "./StatesPanel"
import { useDialogState } from "@/hooks/useDialogState"
import { useIsMobile } from "@/hooks/useIsMobile"
import { EditActionCell } from "@/shared/renderers"
import type { MasterProduct, MasterProductRequest } from "@/types/productHierarchy"
import {
  useGetMasterProductsQuery,
  useCreateMasterProductMutation,
  useUpdateMasterProductMutation,
  useDeleteMasterProductsMutation,
} from "@/store/services/productHierarchyApi"

/* ── Cell renderers ─────────────────────────────────────── */
function CompanyCell({ data }: ICellRendererParams<MasterProduct>) {
  if (!data) return null
  return <span>{data.companyName} - ({data.companyCode})</span>
}

function ItemNameCell({ data }: ICellRendererParams<MasterProduct>) {
  if (!data) return null
  return <span>{data.productionItemName} - ({data.productionCode})</span>
}

/* ── Page ───────────────────────────────────────────────── */
export function Products() {
  const isMobile = useIsMobile()

  const { data, isLoading, isFetching, isError, refetch } = useGetMasterProductsQuery()
  const products = data ?? []

  const [createProduct] = useCreateMasterProductMutation()
  const [updateProduct] = useUpdateMasterProductMutation()
  const [deleteProducts] = useDeleteMasterProductsMutation()

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const dialog = useDialogState<MasterProduct>()
  const [deleteRows, setDeleteRows] = useState<MasterProduct[] | null>(null)

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

  const handleAdd = useCallback(async (body: MasterProductRequest) => {
    await createProduct(body).unwrap()
  }, [createProduct])

  const handleEdit = useCallback(async (productId: number, body: MasterProductRequest) => {
    await updateProduct({ productId, body }).unwrap()
  }, [updateProduct])

  const onRowClicked = useCallback((e: RowClickedEvent<MasterProduct>) => {
    if (!e.data) return
    const target = e.event?.target as HTMLElement
    if (target?.closest(".ag-selection-checkbox")) return
    if (target?.closest("button")) return
    setSelectedId((prev) => (prev === e.data!.productId ? null : e.data!.productId))
  }, [])

  const columnDefs = useMemo<ColDef<MasterProduct>[]>(
    () => [
      { field: "itemCode", headerName: "Item Code", cellStyle: { color: "#3b82f6", fontWeight: 500 } },
      { headerName: "Company Name", cellRenderer: CompanyCell },
      { headerName: "Item Name", cellRenderer: ItemNameCell },
      { headerName: "Action", cellRenderer: EditActionCell, cellRendererParams: { onEdit: dialog.openEdit }, sortable: false, maxWidth: 80 },
    ],
    [dialog]
  )

  return (
    <div className="flex flex-1 min-h-0 gap-4 overflow-x-auto">
      {/* min-w floor keeps the grid usable once the States column (420px, with Operations
          stacked below it) is open — without it flex-1 would shrink this all the way to 0
          instead of scrolling the row. */}
      <div className="flex flex-1 min-w-140 min-h-0 flex-col">
        {isError && <p role="alert" className="mb-2 text-sm text-red-600">Unable to load products. Use Refresh to try again.</p>}
        <DataTable<MasterProduct>
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
      </div>

      {selectedProduct && !isMobile && (
        <StatesPanel
          key={selectedProduct.productId}
          productId={selectedProduct.productId}
          onClose={() => setSelectedId(null)}
        />
      )}
      {isMobile && (
        <Drawer
          open={selectedId !== null}
          onClose={() => setSelectedId(null)}
          title={selectedProduct ? `${selectedProduct.productionItemName} - States` : "States"}
        >
          {selectedProduct && (
            <StatesPanel
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
