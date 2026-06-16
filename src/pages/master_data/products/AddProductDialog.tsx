import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormDialog } from "@/shared/FormDialog"
import type { ProductRow } from "./Products"

interface AddProductDialogProps {
  open: boolean
  onClose: () => void
  product?: ProductRow
  onAdd: (product: Omit<ProductRow, "id">) => void
  onEdit?: (id: number, itemCode: string, productName: string) => void
}

export function AddProductDialog({
  open,
  onClose,
  product,
  onAdd,
  onEdit,
}: AddProductDialogProps) {
  const isEdit = Boolean(product)

  const [itemCode, setItemCode]       = React.useState(product?.itemCode ?? "")
  const [productName, setProductName] = React.useState(product?.productName ?? "")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!itemCode.trim() || !productName.trim()) return
    if (isEdit && product) {
      onEdit?.(product.id, itemCode.trim(), productName.trim())
    } else {
      onAdd({ itemCode: itemCode.trim(), productName: productName.trim(), productionStages: [], reworkStages: [] })
    }
    onClose()
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Product" : "Add Product"}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Update" : "Save"}
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
