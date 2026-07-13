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
import { useGetCompaniesQuery } from "@/store/services/companyApi"
import { useGetProductsQuery } from "@/store/services/productApi"
import type { PendingScheduleRecord } from "@/types/pendingSchedule"

/* ── Schema ─────────────────────────────────────────────── */
const schema = z.object({
  scheduleDate:   z.string().min(1, "Schedule date is required")
    .refine((val) => !val || val >= getTodayIso(), "Schedule date cannot be in the past"),
  companyName:    z.string().min(1, "Company is required"),
  productName:    z.string().min(1, "Product is required"),
  targetQty:      z.coerce.number({ error: "Required" }).min(1, "Min 1"),
  targetDate:     z.string().min(1, "Target date is required")
    .refine((val) => !val || val >= getTodayIso(), "Target date cannot be in the past"),
  priorityLevel:  z.enum(["High", "Medium", "Low"], { error: "Select a priority" }),
})

export type ScheduleFormValues = z.infer<typeof schema>

/* ── Component ──────────────────────────────────────────── */
interface ScheduleFormDrawerProps {
  open: boolean
  onClose: () => void
  schedule?: PendingScheduleRecord
  onSubmit: (data: ScheduleFormValues) => Promise<void> | void
}

export function ScheduleFormDrawer({
  open,
  onClose,
  schedule,
  onSubmit: onExternalSubmit,
}: ScheduleFormDrawerProps) {
  const isEdit = Boolean(schedule)

  const { data: companies } = useGetCompaniesQuery()
  const { data: products } = useGetProductsQuery()

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(schema) as Resolver<ScheduleFormValues>,
    defaultValues: schedule
      ? {
          scheduleDate:  toIsoDate(schedule.scheduleDate),
          companyName:   schedule.companyName,
          productName:   schedule.productName,
          targetQty:     schedule.targetQty,
          targetDate:    toIsoDate(schedule.targetDate),
          priorityLevel: schedule.priorityLevel,
        }
      : {
          scheduleDate: "", companyName: "", productName: "",
          targetQty: undefined as unknown as number,
          targetDate: "", priorityLevel: undefined,
        },
  })

  const { isSubmitting } = form.formState
  const [selectedProductName, setSelectedProductName] = useState(schedule?.productName ?? "")
  const selectedProduct = (products ?? []).find((p) => p.productName === selectedProductName)
  const noOfOperations = isEdit ? schedule?.noOfOperations : selectedProduct?.productionOperationCount

  async function handleSubmit(data: ScheduleFormValues) {
    await onExternalSubmit(data)
    form.reset()
    onClose()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Schedule" : "Add Schedule"}
      width="560px"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-5">

          {/* Schedule Date */}
          <FormField control={form.control} name="scheduleDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Schedule Date</FormLabel>
              <DatePicker value={field.value} onChange={field.onChange} placeholder="Pick schedule date" minDate={startOfToday()} />
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
