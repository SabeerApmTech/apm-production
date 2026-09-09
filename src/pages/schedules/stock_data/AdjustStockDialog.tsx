import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormDialog } from "@/shared/FormDialog"
import { getAuthUser } from "@/utils/auth"
import type { StockRecord, StockRequest } from "@/types/stock"

interface AdjustStockDialogProps {
  mode: "add" | "consume"
  stock: StockRecord | null
  onClose: () => void
  onAdjust: (stockId: number, updatedByEmpId: string, body: StockRequest) => Promise<void>
}

// Endpoints 15/16 both take the full record (same shape as create/update) — the only thing that
// changes is `availableStockQty`, computed here from the current value plus/minus what the user
// enters, and sent as the new total rather than a delta.
export function AdjustStockDialog({ mode, stock, onClose, onAdjust }: AdjustStockDialogProps) {
  const [delta, setDelta] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const [prevStockId, setPrevStockId] = React.useState(stock?.stockId)
  if (stock?.stockId !== prevStockId) {
    setPrevStockId(stock?.stockId)
    setDelta("")
  }

  const deltaQty = Number(delta) || 0
  const nextQty = stock
    ? mode === "add" ? stock.availableStockQty + deltaQty : Math.max(0, stock.availableStockQty - deltaQty)
    : 0
  const canSubmit = !!stock && deltaQty > 0 && (mode === "add" || deltaQty <= stock.availableStockQty)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const user = getAuthUser()
    if (!canSubmit || !stock || !user) return
    setIsSubmitting(true)
    try {
      const body: StockRequest = {
        itemCode: stock.itemCode,
        companyName: stock.companyName,
        companyLocation: stock.companyLocation,
        state: stock.state,
        productName: stock.productName,
        sequenceNo: stock.sequenceNo,
        operationName: stock.operationName,
        productionCode: stock.productionCode,
        availableStockQty: nextQty,
      }
      await onAdjust(stock.stockId, user.employeeId, body)
      onClose()
    } catch {
      // Toast middleware already surfaced the error; keep the dialog open so the user can retry.
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormDialog
      open={!!stock}
      onClose={onClose}
      title={mode === "add" ? "Add Stock" : "Consume Stock"}
      onSubmit={handleSubmit}
      submitLabel={isSubmitting ? "Saving..." : mode === "add" ? "Add" : "Consume"}
      submitDisabled={isSubmitting || !canSubmit}
    >
      {stock && (
        <>
          <p className="text-sm text-gray-600">
            {stock.operationName} <span className="text-gray-400">({stock.productionCode})</span> — current stock:{" "}
            <span className="font-semibold text-gray-800">{stock.availableStockQty}</span>
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="adjustQty">Quantity to {mode === "add" ? "add" : "consume"}</Label>
            <Input
              id="adjustQty"
              type="number"
              min={1}
              max={mode === "consume" ? stock.availableStockQty : undefined}
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              autoFocus
            />
          </div>
          <p className="text-sm text-gray-500">
            New stock quantity will be <span className="font-semibold text-gray-800">{nextQty}</span>.
          </p>
        </>
      )}
    </FormDialog>
  )
}
