import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormDialog } from "@/shared/FormDialog"
import type { ProductRecord } from "@/types/product"

interface AddProductDialogProps {
  open: boolean
  onClose: () => void
  product?: ProductRecord
  onAdd: (product: { itemCode: string; productName: string }) => Promise<void>
  onEdit?: (productId: number, itemCode: string, productName: string) => Promise<void>
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
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!itemCode.trim() || !productName.trim()) return
    setIsSubmitting(true)
    try {
      if (isEdit && product) {
        await onEdit?.(product.productId, itemCode.trim(), productName.trim())
      } else {
        await onAdd({ itemCode: itemCode.trim(), productName: productName.trim() })
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
      title={isEdit ? "Edit Product" : "Add Product"}
      onSubmit={handleSubmit}
      submitLabel={isSubmitting ? "Saving..." : isEdit ? "Update" : "Save"}
      submitDisabled={isSubmitting || !itemCode.trim() || !productName.trim()}
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
