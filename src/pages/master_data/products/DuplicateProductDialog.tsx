import * as React from "react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { FormDialog } from "@/shared/FormDialog"
import { useGetCompaniesQuery } from "@/store/services/companyApi"
import { useGetProductionItemsQuery, useGetProductionItemOperationsQuery } from "@/store/services/productionItemApi"
import {
  useGetMasterProductsQuery,
  useCreateMasterProductMutation,
  useGetProductStatesQuery,
  useCreateProductStateMutation,
  useLazyGetProductStateOperationsQuery,
  useAddProductStateOperationMutation,
} from "@/store/services/productHierarchyApi"
import { nextProductCode } from "./itemCode"
import type { MasterProduct } from "@/types/productHierarchy"

type DuplicateMode = "selected" | "all"

interface DuplicateProductDialogProps {
  open: boolean
  onClose: () => void
  product: MasterProduct | null
}

// Duplicates a product under a different company: creates the new product (with a freshly
// generated item code for that company), then re-creates either every state or just the ones the
// user picked, each with its own operations copied over from the source state. There's no bulk
// "duplicate" endpoint, so this is a straightforward sequence of the same create calls the States
// and Operations panels already use — if one step fails partway, whatever was already created
// (the product, and any states/operations done so far) is left in place rather than rolled back;
// it shows up in the table and can be finished manually.
export function DuplicateProductDialog({ open, onClose, product }: DuplicateProductDialogProps) {
  const { data: companies } = useGetCompaniesQuery(undefined, { skip: !open })
  const { data: productionItems } = useGetProductionItemsQuery(undefined, { skip: !open })
  const { data: products } = useGetMasterProductsQuery(undefined, { skip: !open })
  const { data: sourceStates = [] } = useGetProductStatesQuery(product?.productId ?? 0, { skip: !open || !product })

  // Resolved once up front (not just inside handleSubmit) since the add-operation endpoint below
  // needs it too, to translate each copied operation's code back into a productionOperationId.
  const productionItemId = productionItems?.find((i) => i.itemCode === product?.itemCode)?.productionItemId
  const { data: catalog = [] } = useGetProductionItemOperationsQuery(
    productionItemId ?? 0, { skip: !open || !productionItemId }
  )

  const [createProduct] = useCreateMasterProductMutation()
  const [createState] = useCreateProductStateMutation()
  const [fetchOperations] = useLazyGetProductStateOperationsQuery()
  const [addOperation] = useAddProductStateOperationMutation()

  const [companyId, setCompanyId] = React.useState("")
  const [mode, setMode] = React.useState<DuplicateMode>("selected")
  const [selectedStateIds, setSelectedStateIds] = React.useState<Set<number>>(new Set())
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Resets the form whenever the dialog (re)opens — including for a different row's product,
  // since the key includes its id — without an effect; adjusting state during render avoids the
  // extra post-mount render pass a useEffect would cost here.
  const [prevKey, setPrevKey] = React.useState("")
  const key = `${open}:${product?.productId ?? ""}`
  if (key !== prevKey) {
    setPrevKey(key)
    if (open) {
      setCompanyId("")
      setMode("selected")
      setSelectedStateIds(new Set())
    }
  }

  // The target has to be a different company — duplicating into the same one would just be a
  // second copy sitting right next to the original under an identical company.
  const companyOptions = (companies ?? []).filter((c) => c.companyName !== product?.companyName)

  function toggleState(id: number) {
    setSelectedStateIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const statesToDuplicate = mode === "all" ? sourceStates : sourceStates.filter((s) => selectedStateIds.has(s.productStateId))
  const canSubmit = !!product && !!companyId && statesToDuplicate.length > 0

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canSubmit || !product) return
    const targetCompany = (companies ?? []).find((c) => String(c.companyId) === companyId)
    if (!targetCompany || !productionItemId) return

    setIsSubmitting(true)
    try {
      const productCode = nextProductCode(targetCompany.companyCode, products ?? [])
      const created = await createProduct({
        productCode,
        companyId: targetCompany.companyId,
        productionItemId,
      }).unwrap()
      const newProductId = created.data.productId

      for (const state of statesToDuplicate) {
        const newState = await createState({ productId: newProductId, state: state.state }).unwrap()
        const operations = await fetchOperations(state.productStateId).unwrap()
        // The add endpoint only takes a productionOperationId, not a code — resolve each copied
        // operation's code back to its catalog id; any that can't be resolved are just skipped.
        for (const op of operations) {
          const catalogId = catalog.find((c) => c.operationCode === op.operationCode)?.productionOperationId
          if (catalogId == null) continue
          await addOperation({ productStateId: newState.data.productStateId, productionOperationId: catalogId }).unwrap()
        }
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
      title="Duplicate Product"
      onSubmit={handleSubmit}
      submitLabel={isSubmitting ? "Duplicating..." : "Duplicate"}
      submitDisabled={isSubmitting || !canSubmit}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="duplicateCompanyId">Company</Label>
        <Select value={companyId} onValueChange={setCompanyId}>
          <SelectTrigger id="duplicateCompanyId" autoFocus>
            <SelectValue placeholder="Select company" />
          </SelectTrigger>
          <SelectContent>
            {companyOptions.map((c) => (
              <SelectItem key={c.companyId} value={String(c.companyId)}>
                {c.companyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>What to duplicate</Label>
        <RadioGroup value={mode} onValueChange={(v) => setMode(v as DuplicateMode)} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="selected" id="duplicateModeSelected" />
            <Label htmlFor="duplicateModeSelected" className="cursor-pointer font-normal">
              Particular states and their operations
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="all" id="duplicateModeAll" />
            <Label htmlFor="duplicateModeAll" className="cursor-pointer font-normal">
              All states and their operations
            </Label>
          </div>
        </RadioGroup>
      </div>

      {mode === "selected" && (
        <div className="flex flex-col gap-1.5">
          <Label>States</Label>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
            {sourceStates.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-gray-400">This product has no states yet.</p>
            ) : (
              sourceStates.map((s) => (
                <label
                  key={s.productStateId}
                  className="flex cursor-pointer items-center gap-2.5 border-b border-dashed border-gray-100 px-3 py-2 text-sm last:border-b-0 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedStateIds.has(s.productStateId)}
                    onChange={() => toggleState(s.productStateId)}
                    className="h-4 w-4 cursor-pointer accent-blue-500"
                  />
                  {s.state}
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </FormDialog>
  )
}
