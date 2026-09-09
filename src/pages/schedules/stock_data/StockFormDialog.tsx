import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { FormDialog } from "@/shared/FormDialog"
import { useGetCompaniesQuery } from "@/store/services/companyApi"
import {
  useGetMasterProductsQuery,
  useGetProductStatesQuery,
  useGetProductStateOperationsQuery,
} from "@/store/services/productHierarchyApi"
import type { StockRecord, StockRequest } from "@/types/stock"

interface StockFormDialogProps {
  open: boolean
  onClose: () => void
  stock?: StockRecord
  onAdd: (body: StockRequest) => Promise<void>
  onEdit?: (stockId: number, body: StockRequest) => Promise<void>
}

export function StockFormDialog({ open, onClose, stock, onAdd, onEdit }: StockFormDialogProps) {
  const isEdit = Boolean(stock)
  const { data: companies } = useGetCompaniesQuery(undefined, { skip: !open })
  const { data: products } = useGetMasterProductsQuery(undefined, { skip: !open })

  const [itemCode, setItemCode] = React.useState(stock?.itemCode ?? "")
  const [stateValue, setStateValue] = React.useState(stock?.state ?? "")
  const [operationId, setOperationId] = React.useState("")
  const [availableStockQty, setAvailableStockQty] = React.useState(stock ? String(stock.availableStockQty) : "")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const selectedProduct = (products ?? []).find((p) => p.itemCode === itemCode)
  const { data: states } = useGetProductStatesQuery(selectedProduct?.productId ?? 0, { skip: !selectedProduct })
  const selectedState = (states ?? []).find((s) => s.state === stateValue)
  const { data: operations } = useGetProductStateOperationsQuery(selectedState?.productStateId ?? 0, { skip: !selectedState })
  const selectedOperation = (operations ?? []).find((o) => String(o.productionOperationId) === operationId)

  // Resolve the operation select's value once its list arrives, matching the existing stock
  // row's operation by name + code — the row itself only stores those strings, not the id.
  const [prevOperations, setPrevOperations] = React.useState(operations)
  if (operations !== prevOperations) {
    setPrevOperations(operations)
    if (stock && !operationId) {
      const match = operations?.find((o) => o.operationName === stock.operationName && o.operationCode === stock.productionCode)
      if (match) setOperationId(String(match.productionOperationId))
    }
  }

  // Resets the form whenever the dialog (re)opens, without an effect — adjusting state during
  // render avoids the extra post-mount render pass a useEffect would cost here.
  const [prevOpen, setPrevOpen] = React.useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setItemCode(stock?.itemCode ?? "")
      setStateValue(stock?.state ?? "")
      setOperationId("")
      setAvailableStockQty(stock ? String(stock.availableStockQty) : "")
    }
  }

  const canSubmit = !!selectedProduct && !!selectedState && !!selectedOperation && availableStockQty !== ""

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canSubmit || !selectedProduct || !selectedState || !selectedOperation) return
    setIsSubmitting(true)
    try {
      const companyLocation = (companies ?? []).find((c) => c.companyName === selectedProduct.companyName)?.location ?? ""
      const body: StockRequest = {
        itemCode: selectedProduct.itemCode,
        companyName: selectedProduct.companyName,
        companyLocation,
        state: selectedState.state,
        productName: selectedProduct.productionItemName,
        sequenceNo: selectedOperation.sequenceNumber,
        operationName: selectedOperation.operationName,
        productionCode: selectedOperation.operationCode,
        availableStockQty: Number(availableStockQty),
      }
      if (isEdit && stock) {
        await onEdit?.(stock.stockId, body)
      } else {
        await onAdd(body)
      }
      onClose()
    } catch {
      // Toast middleware already surfaced the error; keep the dialog open so the user can retry.
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Stock" : "Add Stock"}
      onSubmit={handleSubmit}
      submitLabel={isSubmitting ? "Saving..." : isEdit ? "Update" : "Save"}
      submitDisabled={isSubmitting || !canSubmit}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="stockItemCode">Item Code</Label>
        <Select value={itemCode} onValueChange={(v) => { setItemCode(v); setStateValue(""); setOperationId("") }}>
          <SelectTrigger id="stockItemCode"><SelectValue placeholder="Select item code" /></SelectTrigger>
          <SelectContent>
            {(products ?? []).map((p) => (
              <SelectItem key={p.productId} value={p.itemCode}>{p.itemCode} - {p.productionItemName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="stockState">State</Label>
        <Select value={stateValue} onValueChange={(v) => { setStateValue(v); setOperationId("") }} disabled={!selectedProduct}>
          <SelectTrigger id="stockState"><SelectValue placeholder="Select state" /></SelectTrigger>
          <SelectContent>
            {(states ?? []).map((s) => (
              <SelectItem key={s.productStateId} value={s.state}>{s.state}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="stockOperation">Operation</Label>
        <Select value={operationId} onValueChange={setOperationId} disabled={!selectedState}>
          <SelectTrigger id="stockOperation"><SelectValue placeholder="Select operation" /></SelectTrigger>
          <SelectContent>
            {(operations ?? []).map((o) => (
              <SelectItem key={o.productionOperationId} value={String(o.productionOperationId)}>
                {o.operationCode} - {o.operationName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="stockQty">Available Stock Qty</Label>
        <Input
          id="stockQty"
          type="number"
          min={0}
          placeholder="Enter quantity"
          value={availableStockQty}
          onChange={(e) => setAvailableStockQty(e.target.value)}
        />
      </div>
    </FormDialog>
  )
}
