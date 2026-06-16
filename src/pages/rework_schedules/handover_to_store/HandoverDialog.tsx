import { useState } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

export interface ReworkHandoverPendingRow {
  id: number
  reworkScheduleId: string
  company: string
  product: string
  targetQty: number
  deliveredQty: number
  pendingQty: number
  readyToMove: number
}

export interface ReworkHandoverFormData {
  storeLocation: string
  receivedBy: string
  handoverQty: number
  remarks: string
}

interface Props {
  open: boolean
  onClose: () => void
  row: ReworkHandoverPendingRow | null
  onConfirm: (rowId: number, data: ReworkHandoverFormData) => void
}

const STORE_LOCATIONS = ["Main Store", "Sub Store A", "Sub Store B", "Warehouse 1"]

export function HandoverDialog({ open, onClose, row, onConfirm }: Props) {
  const [storeLocation, setStoreLocation] = useState("Main Store")
  const [receivedBy,    setReceivedBy]    = useState("")
  const [handoverQty,   setHandoverQty]   = useState("")
  const [remarks,       setRemarks]       = useState("")

  function handleConfirm() {
    if (!row) return
    onConfirm(row.id, { storeLocation, receivedBy, handoverQty: Number(handoverQty), remarks })
    setStoreLocation("Main Store")
    setReceivedBy("")
    setHandoverQty("")
    setRemarks("")
    onClose()
  }

  if (!row) return null

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-blue-600 text-xl">Handover To Store</DialogTitle>
        </DialogHeader>

        {/* Summary strip */}
        <div className="grid grid-cols-3 rounded-xl bg-gray-100 px-4 py-3 text-sm gap-2">
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Rework Schedule Id</p>
            <p className="font-semibold text-gray-800">{row.reworkScheduleId}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Product</p>
            <p className="font-semibold text-gray-800">{row.product}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Ready To Move Qty</p>
            <p className="font-semibold text-gray-800">{row.readyToMove}</p>
          </div>
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold text-gray-700">Store Location</Label>
            <Select value={storeLocation} onValueChange={setStoreLocation}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STORE_LOCATIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold text-gray-700">Received By</Label>
            <Input placeholder="Enter Received By" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold text-gray-700">Handover Qty</Label>
            <Input type="number" placeholder="Enter Handover Qty" value={handoverQty} onChange={(e) => setHandoverQty(e.target.value)} />
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
            disabled={!receivedBy || !handoverQty}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Confirm Handover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
