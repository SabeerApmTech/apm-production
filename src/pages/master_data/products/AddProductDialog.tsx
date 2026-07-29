import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { FormDialog } from "@/shared/FormDialog"
import { useGetIdentifiersQuery } from "@/store/services/productApi"
import type { IdentifierRecord, ProductRecord } from "@/types/product"

// The GET /Product response only returns the identifier's name, not its id — resolve it back to
// an id via the identifiers list so the edit form can preselect the right option.
function resolveIdentifierTypeId(identifiers: IdentifierRecord[] | undefined, name: string | undefined) {
  if (!name || !identifiers) return ""
  const match = identifiers.find((i) => i.identifierName === name)
  return match ? String(match.identifierTypeId) : ""
}

interface AddProductDialogProps {
  open: boolean
  onClose: () => void
  product?: ProductRecord
  onAdd: (product: { itemCode: string; productName: string; identifierTypeId: number }) => Promise<void>
  onEdit?: (productId: number, itemCode: string, productName: string, identifierTypeId: number) => Promise<void>
}

export function AddProductDialog({
  open,
  onClose,
  product,
  onAdd,
  onEdit,
}: AddProductDialogProps) {
  const isEdit = Boolean(product)
  const { data: identifiers } = useGetIdentifiersQuery()

  const [itemCode, setItemCode]       = React.useState(product?.itemCode ?? "")
  const [productName, setProductName] = React.useState(product?.productName ?? "")
  const [identifierTypeId, setIdentifierTypeId] = React.useState(
    () => resolveIdentifierTypeId(identifiers, product?.identifierName)
  )
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Resets the form fields whenever the dialog (re)opens, without an effect — adjusting state
  // during render avoids the extra post-mount render pass a useEffect would cost here.
  const [prevOpen, setPrevOpen] = React.useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setItemCode(product?.itemCode ?? "")
      setProductName(product?.productName ?? "")
      setIdentifierTypeId(resolveIdentifierTypeId(identifiers, product?.identifierName))
    }
  }

  // The identifiers list may still be loading when the dialog first mounts for edit — backfill
  // the preselected value once it arrives, again without an effect.
  const [prevIdentifiers, setPrevIdentifiers] = React.useState(identifiers)
  if (identifiers !== prevIdentifiers) {
    setPrevIdentifiers(identifiers)
    if (product?.identifierName && !identifierTypeId) {
      const resolved = resolveIdentifierTypeId(identifiers, product.identifierName)
      if (resolved) setIdentifierTypeId(resolved)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!itemCode.trim() || !productName.trim() || !identifierTypeId) return
    setIsSubmitting(true)
    try {
      if (isEdit && product) {
        await onEdit?.(product.productId, itemCode.trim(), productName.trim(), Number(identifierTypeId))
      } else {
        await onAdd({ itemCode: itemCode.trim(), productName: productName.trim(), identifierTypeId: Number(identifierTypeId) })
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
      submitDisabled={isSubmitting || !itemCode.trim() || !productName.trim() || !identifierTypeId}
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="identifierTypeId">Identifier</Label>
        <Select value={identifierTypeId} onValueChange={setIdentifierTypeId}>
          <SelectTrigger id="identifierTypeId"><SelectValue placeholder="Select identifier" /></SelectTrigger>
          <SelectContent>
            {(identifiers ?? []).map((i) => (
              <SelectItem key={i.identifierTypeId} value={String(i.identifierTypeId)}>
                {i.identifierName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </FormDialog>
  )
}
