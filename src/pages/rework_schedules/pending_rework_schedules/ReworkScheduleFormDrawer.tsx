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
import { getAuthUser } from "@/utils/auth"
import { PRIORITY_LEVELS, PRIORITY_TEXT_STYLES } from "@/shared/constants"
import { useGetCompaniesQuery } from "@/store/services/companyApi"
import { useGetProductsQuery } from "@/store/services/productApi"
import type { ReworkPendingScheduleRecord, ReworkType } from "@/types/reworkSchedule"

// Managers raise Customer Service / Rework From Store; every other role that can reach this
// drawer (Supervisor) is locked to Inhouse Rework — the two lists are mutually exclusive.
const MANAGER_REWORK_TYPES: { value: ReworkType; label: string }[] = [
  { value: "CustomerService", label: "Customer Service" },
  { value: "ReworkFromStore", label: "Rework From Store" },
]
const NON_MANAGER_REWORK_TYPES: { value: ReworkType; label: string }[] = [
  { value: "InhouseRework", label: "Inhouse Rework" },
]
// When editing, the field is disabled regardless of role (see `disabled` below) and just needs to
// display whatever type the schedule actually has — restricting the option list by the *viewer's*
// role here would leave the current value with no matching option to look up a label from,
// rendering blank instead of e.g. "Rework From Store".
const ALL_REWORK_TYPES = [...MANAGER_REWORK_TYPES, ...NON_MANAGER_REWORK_TYPES]

/* ── Schema ─────────────────────────────────────────────── */
const schema = z.object({
  reworkScheduleDate: z.string().min(1, "Rework schedule date is required")
    .refine((val) => !val || val >= getTodayIso(), "Rework schedule date cannot be in the past"),
  reworkType:     z.enum(["CustomerService", "ReworkFromStore", "InhouseRework"], { error: "Select a rework type" }),
  companyName:    z.string().min(1, "Company is required"),
  productName:    z.string().min(1, "Product is required"),
  targetQty:      z.coerce.number({ error: "Required" }).min(1, "Min 1"),
  targetDate:     z.string().min(1, "Target date is required")
    .refine((val) => !val || val >= getTodayIso(), "Target date cannot be in the past"),
  priorityLevel:  z.enum(["High", "Medium", "Low"], { error: "Select a priority" }),
})

export type ReworkScheduleFormValues = z.infer<typeof schema>

/* ── Component ──────────────────────────────────────────── */
interface ReworkScheduleFormDrawerProps {
  open: boolean
  onClose: () => void
  schedule?: ReworkPendingScheduleRecord
  onSubmit: (data: ReworkScheduleFormValues) => Promise<void> | void
}

export function ReworkScheduleFormDrawer({
  open,
  onClose,
  schedule,
  onSubmit: onExternalSubmit,
}: ReworkScheduleFormDrawerProps) {
  const isEdit = Boolean(schedule)
  // Only Managers may raise Customer Service / Rework From Store — every other role that can
  // reach this drawer (Supervisor) is locked to Inhouse Rework.
  const isManager = getAuthUser()?.employeeRole === "MANAGER"

  const { data: companies } = useGetCompaniesQuery()
  const { data: products } = useGetProductsQuery()

  const form = useForm<ReworkScheduleFormValues>({
    resolver: zodResolver(schema) as Resolver<ReworkScheduleFormValues>,
    defaultValues: schedule
      ? {
          reworkScheduleDate: toIsoDate(schedule.reworkScheduleDate),
          reworkType:         schedule.reworkType,
          companyName:        schedule.companyName,
          productName:        schedule.productName,
          targetQty:          schedule.targetQty,
          targetDate:         toIsoDate(schedule.targetDate),
          priorityLevel:      schedule.priorityLevel,
        }
      : {
          reworkScheduleDate: "", companyName: "", productName: "",
          reworkType: isManager ? undefined : "InhouseRework",
          targetQty: undefined as unknown as number,
          targetDate: "", priorityLevel: undefined,
        },
  })

  const { isSubmitting } = form.formState
  const [selectedProductName, setSelectedProductName] = useState(schedule?.productName ?? "")
  const selectedProduct = (products ?? []).find((p) => p.productName === selectedProductName)
  const noOfOperations = isEdit ? schedule?.noOfOperations : selectedProduct?.reworkOperationCount

  async function handleSubmit(data: ReworkScheduleFormValues) {
    await onExternalSubmit(data)
    form.reset()
    onClose()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Rework Schedule" : "Add Rework Schedule"}
      width="560px"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-5">

          {/* Rework Schedule Date */}
          <FormField control={form.control} name="reworkScheduleDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Rework Schedule Date</FormLabel>
              <DatePicker value={field.value} onChange={field.onChange} placeholder="Pick rework schedule date" minDate={startOfToday()} />
              <FormMessage />
            </FormItem>
          )} />

          {/* Rework Type — only Managers may pick Customer Service / Rework From Store; every other role is locked to Inhouse Rework */}
          <FormField control={form.control} name="reworkType" render={({ field }) => (
            <FormItem>
              <FormLabel>Rework Type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={isEdit || !isManager}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select rework type" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(isEdit ? ALL_REWORK_TYPES : isManager ? MANAGER_REWORK_TYPES : NON_MANAGER_REWORK_TYPES).map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          {/* Company + Product */}
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="companyName" render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={isEdit}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(companies ?? []).map((c) => (
                      <SelectItem key={c.companyId} value={c.companyName}>{c.companyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="productName" render={({ field }) => (
              <FormItem>
                <FormLabel>Product</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => { field.onChange(v); setSelectedProductName(v) }}
                  disabled={isEdit}
                >
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(products ?? []).map((p) => (
                      <SelectItem key={p.productId} value={p.productName}>{p.productName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {/* No of Operations + Target Qty */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>No of Operations</Label>
              <Input type="number" value={noOfOperations ?? ""} disabled />
            </div>

            <FormField control={form.control} name="targetQty" render={({ field }) => (
              <FormItem>
                <FormLabel>Target Qty</FormLabel>
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
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              disabled={isSubmitting}
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
