import { useState, type FormEvent } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormDialog } from "@/shared/FormDialog"
import { useGetIdentifiersQuery } from "@/store/services/productApi"
import type { ProductionItem, ProductionItemRequest } from "@/types/productionItem"

interface Props {
  open: boolean
  onClose: () => void
  product?: ProductionItem
  onAdd: (body: ProductionItemRequest) => Promise<void>
  onEdit: (id: number, code: string, name: string, identifierTypeId: number) => Promise<void>
}

export function ProductionItemDialog({ open, onClose, product, onAdd, onEdit }: Props) {
  const { data: allIdentifiers = [], isLoading, isError } = useGetIdentifiersQuery(undefined, { skip: !open })
  // Inactive identifiers drop out of new selections but stay selectable on a record that's
  // already using one — same convention as the process-team select elsewhere.
  const identifiers = allIdentifiers.filter((i) => i.isActive || i.identifierTypeId === product?.identifierTypeId)
  const [productionCode, setProductionCode] = useState(product?.productionCode ?? "")
  const [itemName, setItemName] = useState(product?.itemName ?? "")
  const [identifierId, setIdentifierId] = useState(product ? String(product.identifierTypeId) : "")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || !productionCode.trim() || !itemName.trim() || !identifierId) return
    setSaving(true)
    try {
      const body = { productionCode: productionCode.trim(), itemName: itemName.trim(), identifierTypeId: Number(identifierId) }
      if (product) await onEdit(product.productionItemId, body.productionCode, body.itemName, body.identifierTypeId)
      else await onAdd(body)
      onClose()
    } catch {
      // The API middleware shows the error; retain the form for retry.
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormDialog open={open} onClose={() => { if (!saving) onClose() }} title={product ? "Edit Production Item" : "Add Production Item"}
      onSubmit={handleSubmit} submitLabel={saving ? "Saving..." : "Save"}
      submitDisabled={saving || !productionCode.trim() || !itemName.trim() || !identifierId}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="productionCode">Production Code</Label>
        <Input id="productionCode" placeholder="Enter production code" value={productionCode} onChange={(e) => setProductionCode(e.target.value)} disabled={saving} required autoFocus />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="productionItemName">Item Name</Label>
        <Input id="productionItemName" placeholder="Enter item name" value={itemName} onChange={(e) => setItemName(e.target.value)} disabled={saving} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="productionIdentifier">Identifier</Label>
        <Select value={identifierId} onValueChange={setIdentifierId} disabled={saving || isLoading}>
          <SelectTrigger id="productionIdentifier"><SelectValue placeholder={isLoading ? "Loading identifiers..." : "Select identifier"} /></SelectTrigger>
          <SelectContent>
            {product && !identifiers.some((i) => i.identifierTypeId === product.identifierTypeId) && (
              <SelectItem value={String(product.identifierTypeId)}>{product.uniqueIdentifierName}</SelectItem>
            )}
            {identifiers.map((i) => <SelectItem key={i.identifierTypeId} value={String(i.identifierTypeId)}>{i.uniqueIdentifierName}</SelectItem>)}
          </SelectContent>
        </Select>
        {isError && <p role="alert" className="text-sm text-red-600">Unable to load identifiers. Reopen this form to retry.</p>}
      </div>
    </FormDialog>
  )
}
