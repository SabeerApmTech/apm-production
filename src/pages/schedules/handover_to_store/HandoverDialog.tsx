import { useMemo, useState } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useGetStoresQuery } from "@/store/services/storeApi"
import { useGetPendingHandoverDetailQuery } from "@/store/services/handoverToStoreApi"
import type { PendingHandoverRecord } from "@/types/handoverToStore"

export interface HandoverFormData {
  storeLocation: string
  receivedBy: string
  handoverQty: number
  remarks: string
}

interface HandoverDialogProps {
  open: boolean
  onClose: () => void
  row: PendingHandoverRecord | null
  onConfirm: (data: HandoverFormData) => Promise<void>
}

export function HandoverDialog({ open, onClose, row, onConfirm }: HandoverDialogProps) {
  // Refetches this one schedule right before confirming, so the qty the user hands over against
  // is current rather than whatever the list happened to show when it was last fetched.
  const { data: detail } = useGetPendingHandoverDetailQuery(row?.scheduleId ?? "", { skip: !open || !row })
  const current = detail ?? row

  const { data: storesData } = useGetStoresQuery()
  const stores = useMemo(() => (storesData ?? []).filter((s) => s.isActive), [storesData])

  const [storeLocation, setStoreLocation] = useState("")
  const [receivedBy, setReceivedBy]       = useState("")
  const [handoverQty, setHandoverQty]     = useState("")
  const [remarks, setRemarks]             = useState("")
  const [isSubmitting, setIsSubmitting]   = useState(false)

  // Reset the form whenever the dialog opens (covers both reopening after a Cancel and
  // reopening for a different pending row), without an effect — adjusting state during render
  // avoids the extra post-mount render pass a useEffect would cost here.
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setStoreLocation("")
      setReceivedBy("")
      setHandoverQty("")
      setRemarks("")
    }
  }

  // Defaults to the first active store once the list loads, until the user picks one explicitly —
  // derived at render time instead of synced into state via an effect.
  const effectiveStoreLocation = storeLocation || stores[0]?.storeName || ""

  const qty = Number(handoverQty)
  const qtyExceedsReady = handoverQty !== "" && current !== null && qty > current.readyToMove
  const isValid = effectiveStoreLocation.trim() !== "" && receivedBy.trim() !== "" && handoverQty !== "" && qty > 0 && !qtyExceedsReady

  async function handleConfirm() {
    if (!current || !isValid) return
    setIsSubmitting(true)
    try {
      await onConfirm({ storeLocation: effectiveStoreLocation, receivedBy, handoverQty: qty, remarks })
      onClose()
    } catch {
      // Toast middleware already surfaced the error; keep the dialog open so the user can retry.
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!current) return null

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-blue-600 text-xl">Handover To Store</DialogTitle>
        </DialogHeader>

        {/* Summary strip */}
        <div className="grid grid-cols-3 rounded-xl bg-gray-100 px-4 py-3 text-sm gap-2">
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Schedule Id</p>
            <p className="font-semibold text-gray-800">{current.scheduleId}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Product</p>
            <p className="font-semibold text-gray-800">{current.productName}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Ready To Move Qty</p>
            <p className="font-semibold text-gray-800">{current.readyToMove}</p>
          </div>
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold text-gray-700">Store Location <span className="text-red-500">*</span></Label>
            <Select value={effectiveStoreLocation} onValueChange={setStoreLocation}>
              <SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger>
              <SelectContent>
                {stores.map((s) => (
                  <SelectItem key={s.storeId} value={s.storeName}>{s.storeName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold text-gray-700">Received By <span className="text-red-500">*</span></Label>
            <Input
              placeholder="Enter Received By"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold text-gray-700">Handover Qty <span className="text-red-500">*</span></Label>
            <Input
              type="number"
              min={1}
              max={current.readyToMove}
              placeholder="Enter Handover Qty"
              value={handoverQty}
              onChange={(e) => setHandoverQty(e.target.value)}
              aria-invalid={qtyExceedsReady}
              className={qtyExceedsReady ? "border-red-400 focus-visible:ring-red-200" : undefined}
            />
            {qtyExceedsReady && (
              <p className="text-xs text-red-500">Cannot exceed Ready To Move Qty ({current.readyToMove}).</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-semibold text-gray-700">Remarks</Label>
          <textarea
            placeholder="Enter Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <DialogFooter className="mt-2 gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || !isValid}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? "Saving..." : "Confirm Handover"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
