import { useState } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Drawer } from "@/components/ui/drawer"
import { cn } from "@/lib/utils"
import { toIsoDate, getTodayIso, startOfToday } from "@/utils/date"
import { PRIORITY_LEVELS, PRIORITY_TEXT_STYLES } from "@/shared/constants"
import {
  useGetMasterProductsQuery,
  useGetProductStatesQuery,
  useGetProductStateOperationsQuery,
} from "@/store/services/productHierarchyApi"
import type { OpenScheduleRecord } from "@/types/openSchedule"

/* ── Schema ─────────────────────────────────────────────── */
const schema = z.object({
  scheduleDate: z.string().min(1, "Schedule date is required")
    .refine((val) => !val || val >= getTodayIso(), "Schedule date cannot be in the past"),
  itemCode:     z.string().min(1, "Product is required"),
  state:        z.string().min(1, "State is required"),
  plannedQty:   z.coerce.number({ error: "Required" }).min(1, "Min 1"),
  targetDate:   z.string().min(1, "Target date is required")
    .refine((val) => !val || val >= getTodayIso(), "Target date cannot be in the past"),
  priorityLevel: z.enum(["High", "Medium", "Low"], { error: "Select a priority" }),
})

export type OpenScheduleFormValues = z.infer<typeof schema>

/* ── Component ──────────────────────────────────────────── */
interface OpenScheduleFormDrawerProps {
  open: boolean
  onClose: () => void
  schedule?: OpenScheduleRecord
  onSubmit: (data: OpenScheduleFormValues) => Promise<void> | void
}

export function OpenScheduleFormDrawer({
  open,
  onClose,
  schedule,
  onSubmit: onExternalSubmit,
}: OpenScheduleFormDrawerProps) {
  const isEdit = Boolean(schedule)

  const { data: products } = useGetMasterProductsQuery()

  const form = useForm<OpenScheduleFormValues>({
    resolver: zodResolver(schema) as Resolver<OpenScheduleFormValues>,
    defaultValues: schedule
      ? {
          scheduleDate:  toIsoDate(schedule.scheduleDate),
          itemCode:      schedule.itemCode,
          state:         schedule.state,
          plannedQty:    schedule.plannedQty,
          targetDate:    toIsoDate(schedule.targetDate),
          priorityLevel: schedule.priorityLevel,
        }
      : {
          scheduleDate: "", itemCode: "", state: "",
          plannedQty: undefined as unknown as number,
          targetDate: "", priorityLevel: undefined,
        },
  })

  const { isSubmitting } = form.formState
  const [itemCode, setItemCode] = useState(schedule?.itemCode ?? "")
  const [stateName, setStateName] = useState(schedule?.state ?? "")

  const selectedProduct = (products ?? []).find((p) => p.itemCode === itemCode)
  const { data: states } = useGetProductStatesQuery(selectedProduct?.productId ?? 0, { skip: !selectedProduct })
  const selectedState = (states ?? []).find((s) => s.state === stateName)
  const { data: operations } = useGetProductStateOperationsQuery(selectedState?.productStateId ?? 0, { skip: !selectedState })
  const noOfOperations = isEdit && stateName === schedule?.state ? schedule?.noOfOperations : operations?.length

  async function handleSubmit(data: OpenScheduleFormValues) {
    // The rest of the request body (companyName, companyLocation, productName) is resolved by
    // the caller from `itemCode` against the same products/companies lists — same split of
    // responsibility the old ScheduleFormDrawer used.
    await onExternalSubmit(data)
    form.reset()
    onClose()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Schedule" : "Add New Schedule"}
      width="560px"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-5">

          {/* Schedule Date + Item Code */}
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="scheduleDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Schedule Date</FormLabel>
                <DatePicker value={field.value} onChange={field.onChange} placeholder="Pick schedule date" minDate={startOfToday()} />
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="itemCode" render={({ field }) => (
              <FormItem>
                <FormLabel>Item Code</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => { field.onChange(v); setItemCode(v); form.setValue("state", ""); setStateName("") }}
                  disabled={isEdit}
                >
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select item code" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(products ?? []).map((p) => (
                      <SelectItem key={p.productId} value={p.itemCode}>
                        {p.itemCode} - {p.productionItemName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {/* Company + Product — read-only context once an item code is picked */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Company</Label>
              <Input value={selectedProduct?.companyName ?? ""} disabled placeholder="Company name" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Product</Label>
              <Input value={selectedProduct?.productionItemName ?? ""} disabled placeholder="Product" />
            </div>
          </div>

          {/* State */}
          <FormField control={form.control} name="state" render={({ field }) => (
            <FormItem>
              <FormLabel>State</FormLabel>
              <Select value={field.value} onValueChange={(v) => { field.onChange(v); setStateName(v) }} disabled={!selectedProduct}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(states ?? []).map((s) => (
                    <SelectItem key={s.productStateId} value={s.state}>{s.state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          {/* No of Operations + Planned Qty */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>No of Operations</Label>
              <Input type="number" value={noOfOperations ?? ""} disabled />
            </div>

            <FormField control={form.control} name="plannedQty" render={({ field }) => (
              <FormItem>
                <FormLabel>Planned Qty</FormLabel>
                <FormControl>
                  <Input type="number" min={1} placeholder="e.g. 1000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {/* Target Date */}
          <FormField control={form.control} name="targetDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Target Date</FormLabel>
              <DatePicker value={field.value} onChange={field.onChange} placeholder="Pick target date" minDate={startOfToday()} />
              <FormMessage />
            </FormItem>
          )} />

          {/* Priority Level */}
          <FormField control={form.control} name="priorityLevel" render={({ field }) => (
            <FormItem>
              <FormLabel>Priority Level</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-6 pt-1"
                >
                  {PRIORITY_LEVELS.map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <RadioGroupItem value={opt} id={`priorityLevel-${opt}`} />
                      <Label
                        htmlFor={`priorityLevel-${opt}`}
                        className={cn("cursor-pointer font-semibold text-sm", PRIORITY_TEXT_STYLES[opt])}
                      >
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 mt-2">
            <Button type="button" variant="outline" onClick={onClose}>Back</Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedProduct}
              className="min-w-24 bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEdit ? "Update" : "Submit"}
            </Button>
          </div>
        </form>
      </Form>
    </Drawer>
  )
}
