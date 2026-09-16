import { useState, useCallback, useMemo, useEffect } from "react"
import type { ColDef, RowClickedEvent, ICellRendererParams } from "ag-grid-community"
import { Tags, Users } from "lucide-react"
import { ProcessTeam } from "../process_team/ProcessTeam"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Drawer } from "@/components/ui/drawer"
import { DataTable } from "@/shared/DataTable"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { ProductionItemDialog } from "./ProductionItemDialog"
import { ManageIdentifiersDialog } from "../products/ManageIdentifiersDialog"
import { ProductionStagesPanel } from "./ProductionStagesPanel"
import { useDialogState } from "@/hooks/useDialogState"
import { EditActionCell } from "@/shared/renderers"
import type { ProductionItem } from "@/types/productionItem"
import {
  useGetProductionItemsQuery,
  useCreateProductionItemMutation,
  useUpdateProductionItemMutation,
  useDeleteProductionItemsMutation,
} from "@/store/services/productionItemApi"

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
function StagesCell({ data }: ICellRendererParams<ProductionItem>) {
  if (!data) return null
  return (
    <div className="flex flex-col justify-center gap-0.5 leading-tight">
      <span className="text-xs font-semibold text-blue-600">
        Production : {data.operations.length} Stages
      </span>
      <span className="text-xs font-semibold text-amber-600">
        Rework : 0 Stages
      </span>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────── */
export function ProductionItems() {
  const isMobile = useIsMobile()

  const { data, isLoading, isFetching, isError, refetch } = useGetProductionItemsQuery()
  const products = data ?? []

  const [createProduct] = useCreateProductionItemMutation()
  const [updateProduct] = useUpdateProductionItemMutation()
  const [deleteProductionItems] = useDeleteProductionItemsMutation()

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const dialog = useDialogState<ProductionItem>()
  const [deleteRows, setDeleteRows] = useState<ProductionItem[] | null>(null)
  const [manageIdentifiersOpen, setManageIdentifiersOpen] = useState(false)
  const [processTeamOpen, setProcessTeamOpen] = useState(false)

  const selectedProduct = products.find((p) => p.productionItemId === selectedId) ?? null

  const closeDelete = useCallback(() => setDeleteRows(null), [])

  const handleDelete = useCallback(async () => {
    if (!deleteRows?.length) return
    const ids = deleteRows.map((r) => r.productionItemId)
    try {
      await deleteProductionItems(ids).unwrap()
      if (selectedId !== null && ids.includes(selectedId)) setSelectedId(null)
    } catch {
      // Toast middleware already surfaced the error; the list reflects the server's actual state on refetch.
    }
  }, [deleteRows, deleteProductionItems, selectedId])

  const handleAdd = useCallback(async (product: { itemCode: string; itemName: string; identifierTypeId: number }) => {
    await createProduct(product).unwrap()
  }, [createProduct])

  const handleEdit = useCallback(async (productionItemId: number, itemCode: string, itemName: string, identifierTypeId: number) => {
    await updateProduct({ productionItemId, body: { itemCode, itemName, identifierTypeId } }).unwrap()
  }, [updateProduct])

  const onRowClicked = useCallback((e: RowClickedEvent<ProductionItem>) => {
    if (!e.data) return
    const target = e.event?.target as HTMLElement
    if (target?.closest(".ag-selection-checkbox")) return
    if (target?.closest("button")) return
    setSelectedId((prev) => (prev === e.data!.productionItemId ? null : e.data!.productionItemId))
  }, [])

  const columnDefs = useMemo<ColDef<ProductionItem>[]>(
    () => [
      { field: "itemCode",           headerName: "Item Code",       cellStyle: { color: "#3b82f6", fontWeight: 500 } },
      { field: "itemName",  headerName: "Item Name" },
      { field: "uniqueIdentifierName", headerName: "Identifier" },
      { headerName: "Operations", cellRenderer: StagesCell, sortable: false },
      { headerName: "Action",  cellRenderer: EditActionCell, cellRendererParams: { onEdit: dialog.openEdit }, sortable: false, maxWidth: 80 },
    ],
    [dialog]
  )

  return (
    <div className="flex flex-1 min-h-0 gap-4">
      <div className="flex flex-1 min-w-0 min-h-0 flex-col">
      {isError && <p role="alert" className="mb-2 text-sm text-red-600">Unable to load production items. Use Refresh to try again.</p>}
      <DataTable<ProductionItem>
        title="Production Items"
        addLabel="Add Item"
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
          ...(p.data?.productionItemId === selectedId ? { background: "#dbeafe" } : {}),
        })}
        toolbarExtra={(
          <>
          <Button type="button" variant="outline" onClick={() => setManageIdentifiersOpen(true)}>
            <Tags className="h-4 w-4 mr-1.5" /> Manage Identifiers
          </Button>
          <Button type="button" variant="outline" onClick={() => setProcessTeamOpen(true)}>
            <Users className="h-4 w-4 mr-1.5" /> Process Team
          </Button>
          </>
        )}
      />

      </div>

      {selectedProduct && !isMobile && (
        <ProductionStagesPanel
          key={selectedProduct.productionItemId}
          productionItemId={selectedProduct.productionItemId}
          onClose={() => setSelectedId(null)}
        />
      )}
      {isMobile && (
        <Drawer
          open={selectedProduct !== null}
          onClose={() => setSelectedId(null)}
          title={selectedProduct?.itemName ?? "Operations"}
        >
          {selectedProduct && (
            <ProductionStagesPanel
              key={selectedProduct.productionItemId}
              productionItemId={selectedProduct.productionItemId}
              className="w-full self-auto max-h-none border-0 shadow-none rounded-none"
            />
          )}
        </Drawer>
      )}

      {dialog.isOpen && <ProductionItemDialog
        key={dialog.editing?.productionItemId ?? "new"}
        open={dialog.isOpen}
        onClose={dialog.close}
        product={dialog.editing}
        onAdd={handleAdd}
        onEdit={handleEdit}
      />}

      <ManageIdentifiersDialog
        open={manageIdentifiersOpen}
        onClose={() => setManageIdentifiersOpen(false)}
      />

      <Dialog open={processTeamOpen} onOpenChange={setProcessTeamOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader><DialogTitle>Manage Process Teams</DialogTitle></DialogHeader>
          {processTeamOpen && <ProcessTeam />}
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={!!deleteRows}
        onClose={closeDelete}
        onConfirm={handleDelete}
        title="Delete Production Item"
        description={`Are you sure you want to delete the selected production item${deleteRows && deleteRows.length > 1 ? "s" : ""}? This action cannot be undone.`}
      />
    </div>
  )
}
