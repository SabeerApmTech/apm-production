import { useForm } from "react-hook-form"
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
import type { ScheduleRow } from "./PendingSchedules"

/* ── Schema ─────────────────────────────────────────────── */
const schema = z.object({
  scheduleDate:   z.string().min(1, "Schedule date is required"),
  company:        z.string().min(1, "Company is required"),
  product:        z.string().min(1, "Product is required"),
  noOfOperations: z.coerce.number({ error: "Required" }).min(1, "Min 1"),
  targetQty:      z.coerce.number({ error: "Required" }).min(1, "Min 1"),
  targetDate:     z.string().min(1, "Target date is required"),
  priorityLevel:  z.enum(["High", "Medium", "Low"], { error: "Select a priority" }),
})

export type ScheduleFormValues = z.infer<typeof schema>

/* ── Options ─────────────────────────────────────────────── */
const COMPANIES = ["Lakshika", "Kingstrack", "ABC"]
const PRODUCTS  = ["AIS 140 Standard", "Dashcam", "CCTV"]

/* ── Helpers ─────────────────────────────────────────────── */
function toIso(dateStr: string): string {
  const parts = dateStr.split("/")
  if (parts.length !== 3) return ""
  const [d, m, y] = parts
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
}

/* ── Component ──────────────────────────────────────────── */
interface ScheduleFormDrawerProps {
  open: boolean
  onClose: () => void
  schedule?: ScheduleRow
  onSubmit: (data: ScheduleFormValues) => Promise<void> | void
}

export function ScheduleFormDrawer({
  open,
  onClose,
  schedule,
  onSubmit: onExternalSubmit,
}: ScheduleFormDrawerProps) {
  const isEdit = Boolean(schedule)

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: schedule
      ? {
          scheduleDate:   toIso(schedule.scheduleDate),
          company:        schedule.company,
          product:        schedule.product,
          noOfOperations: schedule.noOfOperations,
          targetQty:      schedule.targetQty,
          targetDate:     toIso(schedule.targetDate),
          priorityLevel:  schedule.priorityLevel,
        }
      : {
          scheduleDate: "", company: "", product: "",
          noOfOperations: undefined as unknown as number,
          targetQty: undefined as unknown as number,
          targetDate: "", priorityLevel: undefined,
        },
  })

  const { isSubmitting } = form.formState

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
              <DatePicker value={field.value} onChange={field.onChange} placeholder="Pick schedule date" />
              <FormMessage />
            </FormItem>
          )} />

          {/* Company + Product */}
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

          {/* No of Operations + Target Qty */}
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

          {/* Target Date */}
          <FormField control={form.control} name="targetDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Target Date</FormLabel>
              <DatePicker value={field.value} onChange={field.onChange} placeholder="Pick target date" />
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
                  {(["High", "Medium", "Low"] as const).map((opt) => (
                    <label key={opt} className="flex cursor-pointer items-center gap-2">
                      <RadioGroupItem value={opt} />
                      <Label className={cn(
                        "cursor-pointer font-semibold text-sm",
                        opt === "High"   ? "text-red-600"    :
                        opt === "Medium" ? "text-yellow-600" : "text-green-600"
                      )}>
                        {opt}
                      </Label>
                    </label>
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
