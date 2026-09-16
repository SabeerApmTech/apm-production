import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { FormDialog } from "@/shared/FormDialog"
import { useGetCompaniesQuery } from "@/store/services/companyApi"
import { useGetProductionItemsQuery } from "@/store/services/productionItemApi"
import { useGetMasterProductsQuery } from "@/store/services/productHierarchyApi"
import { nextProductCode } from "./itemCode"
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
  const { data: products } = useGetMasterProductsQuery(undefined, { skip: !open })

  const [companyId, setCompanyId] = React.useState(() => resolveCompanyId(companies, product?.companyName))
  const [productionItemId, setProductionItemId] = React.useState(
    () => resolveProductionItemId(productionItems, product?.itemName)
  )
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Resets the form fields whenever the dialog (re)opens, without an effect — adjusting state
  // during render avoids the extra post-mount render pass a useEffect would cost here.
  const [prevOpen, setPrevOpen] = React.useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setCompanyId(resolveCompanyId(companies, product?.companyName))
      setProductionItemId(resolveProductionItemId(productionItems, product?.itemName))
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
    if (product?.itemName && !productionItemId) {
      const resolved = resolveProductionItemId(productionItems, product.itemName)
      if (resolved) setProductionItemId(resolved)
    }
  }

  // Product Code is fully derived, never typed: the product's own existing code stays put as long
  // as its company hasn't changed; picking a (different) company always recomputes the next code
  // for that company instead.
  const originalCompanyId = resolveCompanyId(companies, product?.companyName)
  const selectedCompany = (companies ?? []).find((c) => String(c.companyId) === companyId)
  const productCode = !selectedCompany
    ? ""
    : isEdit && product && companyId === originalCompanyId
      ? product.productCode
      : nextProductCode(selectedCompany.companyCode, products ?? [], product?.productId)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!productCode || !companyId || !productionItemId) return
    setIsSubmitting(true)
    try {
      const body: MasterProductRequest = {
        productCode,
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
      submitDisabled={isSubmitting || !productCode || !companyId || !productionItemId}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="companyId">Company</Label>
        <Select value={companyId} onValueChange={setCompanyId}>
          <SelectTrigger id="companyId" autoFocus>
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
        <Label htmlFor="productCode">Product Code</Label>
        <Input
          id="productCode"
          placeholder="Select a company first"
          value={productCode}
          readOnly
          className="cursor-not-allowed bg-gray-50 text-gray-500"
        />
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
                {i.itemName} - ({i.itemCode})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </FormDialog>
  )
}
