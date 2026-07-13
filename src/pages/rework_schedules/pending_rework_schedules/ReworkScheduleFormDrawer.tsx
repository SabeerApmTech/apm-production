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
import { COMPANIES, PRODUCTS, PRIORITY_LEVELS, PRIORITY_TEXT_STYLES } from "@/shared/constants"
import type { ReworkScheduleRow } from "./PendingReworkSchedules"

const schema = z.object({
  reworkScheduleDate: z.string().min(1, "Rework schedule date is required")
    .refine((val) => !val || val >= getTodayIso(), "Rework schedule date cannot be in the past"),
  company:            z.string().min(1, "Company is required"),
  product:            z.string().min(1, "Product is required"),
  noOfOperations:     z.coerce.number({ error: "Required" }).min(1, "Min 1"),
  targetQty:          z.coerce.number({ error: "Required" }).min(1, "Min 1"),
  targetDate:         z.string().min(1, "Target date is required")
    .refine((val) => !val || val >= getTodayIso(), "Target date cannot be in the past"),
  priorityLevel:      z.enum(["High", "Medium", "Low"], { error: "Select a priority" }),
})

export type ReworkScheduleFormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  schedule?: ReworkScheduleRow
  onSubmit: (data: ReworkScheduleFormValues) => Promise<void> | void
}

export function ReworkScheduleFormDrawer({ open, onClose, schedule, onSubmit: onExternalSubmit }: Props) {
  const isEdit = Boolean(schedule)

  const form = useForm<ReworkScheduleFormValues>({
    resolver: zodResolver(schema) as Resolver<ReworkScheduleFormValues>,
    defaultValues: schedule
      ? {
          reworkScheduleDate: toIsoDate(schedule.reworkScheduleDate),
          company:            schedule.company,
          product:            schedule.product,
          noOfOperations:     schedule.noOfOperations,
          targetQty:          schedule.targetQty,
          targetDate:         toIsoDate(schedule.targetDate),
          priorityLevel:      schedule.priorityLevel,
        }
      : {
          reworkScheduleDate: "", company: "", product: "",
          noOfOperations: undefined as unknown as number,
          targetQty:      undefined as unknown as number,
          targetDate: "", priorityLevel: undefined,
        },
  })

  const { isSubmitting } = form.formState

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

          <FormField control={form.control} name="reworkScheduleDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Rework Schedule Date</FormLabel>
              <DatePicker value={field.value} onChange={field.onChange} placeholder="Pick rework schedule date" minDate={startOfToday()} />
              <FormMessage />
            </FormItem>
          )} />

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="company" render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={isEdit}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COMPANIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="product" render={({ field }) => (
              <FormItem>
                <FormLabel>Product</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={isEdit}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PRODUCTS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="noOfOperations" render={({ field }) => (
              <FormItem>
                <FormLabel>No of Operations</FormLabel>
                <FormControl>
                  <Input type="number" min={1} placeholder="e.g. 10" {...field} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

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

          <FormField control={form.control} name="targetDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Target Date</FormLabel>
              <DatePicker value={field.value} onChange={field.onChange} placeholder="Pick target date" minDate={startOfToday()} />
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="priorityLevel" render={({ field }) => (
            <FormItem>
              <FormLabel>Priority Level</FormLabel>
              <FormControl>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-6 pt-1">
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
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Update" : "Submit"}
            </Button>
          </div>
        </form>
      </Form>
    </Drawer>
  )
}
