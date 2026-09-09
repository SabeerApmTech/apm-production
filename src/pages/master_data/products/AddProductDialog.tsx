import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { FormDialog } from "@/shared/FormDialog"
import { useGetCompaniesQuery } from "@/store/services/companyApi"
import { useGetProductionItemsQuery } from "@/store/services/productionItemApi"
import type { MasterProduct, MasterProductRequest } from "@/types/productHierarchy"

// The GET /master/product response only returns the company/production-item names, not their
// ids — resolve them back to ids via their own lists so the edit form can preselect the right
// option. Same trick as the old identifierTypeId resolver this page used to have.
function resolveCompanyId(companies: { companyId: number; companyName: string }[] | undefined, name: string | undefined) {
  if (!name || !companies) return ""
  const match = companies.find((c) => c.companyName === name)
  return match ? String(match.companyId) : ""
}

function resolveProductionItemId(items: { productionItemId: number; itemName: string }[] | undefined, name: string | undefined) {
  if (!name || !items) return ""
  const match = items.find((i) => i.itemName === name)
  return match ? String(match.productionItemId) : ""
}

interface AddProductDialogProps {
  open: boolean
  onClose: () => void
  product?: MasterProduct
  onAdd: (body: MasterProductRequest) => Promise<void>
  onEdit?: (productId: number, body: MasterProductRequest) => Promise<void>
}

export function AddProductDialog({
  open,
  onClose,
  product,
  onAdd,
  onEdit,
}: AddProductDialogProps) {
  const isEdit = Boolean(product)
  const { data: companies, isLoading: companiesLoading } = useGetCompaniesQuery(undefined, { skip: !open })
  const { data: productionItems, isLoading: itemsLoading } = useGetProductionItemsQuery(undefined, { skip: !open })

  const [itemCode, setItemCode] = React.useState(product?.itemCode ?? "")
  const [companyId, setCompanyId] = React.useState(() => resolveCompanyId(companies, product?.companyName))
  const [productionItemId, setProductionItemId] = React.useState(
    () => resolveProductionItemId(productionItems, product?.productionItemName)
  )
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Resets the form fields whenever the dialog (re)opens, without an effect — adjusting state
  // during render avoids the extra post-mount render pass a useEffect would cost here.
  const [prevOpen, setPrevOpen] = React.useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setItemCode(product?.itemCode ?? "")
      setCompanyId(resolveCompanyId(companies, product?.companyName))
      setProductionItemId(resolveProductionItemId(productionItems, product?.productionItemName))
    }
  }

  // The companies/production-items lists may still be loading when the dialog first mounts for
  // edit — backfill the preselected values once they arrive, again without an effect.
  const [prevCompanies, setPrevCompanies] = React.useState(companies)
  if (companies !== prevCompanies) {
    setPrevCompanies(companies)
    if (product?.companyName && !companyId) {
      const resolved = resolveCompanyId(companies, product.companyName)
      if (resolved) setCompanyId(resolved)
    }
  }
  const [prevItems, setPrevItems] = React.useState(productionItems)
  if (productionItems !== prevItems) {
    setPrevItems(productionItems)
    if (product?.productionItemName && !productionItemId) {
      const resolved = resolveProductionItemId(productionItems, product.productionItemName)
      if (resolved) setProductionItemId(resolved)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!itemCode.trim() || !companyId || !productionItemId) return
    setIsSubmitting(true)
    try {
      const body: MasterProductRequest = {
        itemCode: itemCode.trim(),
        companyId: Number(companyId),
        productionItemId: Number(productionItemId),
      }
      if (isEdit && product) {
        await onEdit?.(product.productId, body)
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
      title={isEdit ? "Edit Product" : "Add Product"}
      onSubmit={handleSubmit}
      submitLabel={isSubmitting ? "Saving..." : isEdit ? "Update" : "Save"}
      submitDisabled={isSubmitting || !itemCode.trim() || !companyId || !productionItemId}
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
        <Label htmlFor="companyId">Company</Label>
        <Select value={companyId} onValueChange={setCompanyId}>
          <SelectTrigger id="companyId">
            <SelectValue placeholder={companiesLoading ? "Loading companies..." : "Select company"} />
          </SelectTrigger>
          <SelectContent>
            {(companies ?? []).map((c) => (
              <SelectItem key={c.companyId} value={String(c.companyId)}>
                {c.companyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="productionItemId">Item Name</Label>
        <Select value={productionItemId} onValueChange={setProductionItemId}>
          <SelectTrigger id="productionItemId">
            <SelectValue placeholder={itemsLoading ? "Loading items..." : "Select item"} />
          </SelectTrigger>
          <SelectContent>
            {(productionItems ?? []).map((i) => (
              <SelectItem key={i.productionItemId} value={String(i.productionItemId)}>
                {i.itemName} - ({i.productionCode})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </FormDialog>
  )
}
