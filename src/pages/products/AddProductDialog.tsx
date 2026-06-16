import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormDialog } from "@/shared/FormDialog"
import type { ProductRow } from "./Products"

interface AddProductDialogProps {
  open: boolean
  onClose: () => void
  onAdd: (product: Omit<ProductRow, "id">) => void
}

export function AddProductDialog({ open, onClose, onAdd }: AddProductDialogProps) {
  const [itemCode, setItemCode]       = React.useState("")
  const [productName, setProductName] = React.useState("")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!itemCode.trim() || !productName.trim()) return
    onAdd({ itemCode: itemCode.trim(), productName: productName.trim(), productionStages: [], reworkStages: [] })
    setItemCode("")
    setProductName("")
    onClose()
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title="Add Product"
      onSubmit={handleSubmit}
      submitDisabled={!itemCode.trim() || !productName.trim()}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="itemCode">Item Code</Label>
        <Input
          id="itemCode"
          placeholder="Enter item code"
          value={itemCode}
          onChange={(e) => setItemCode(e.target.value)}
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="productName">Product Name</Label>
        <Input
          id="productName"
          placeholder="Enter product name"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        />
      </div>
    </FormDialog>
  )
}
