import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { EmployeeRow } from "./EmployeePage"

const schema = z.object({
  name: z.string().min(1, "Employee name is required"),
  dob: z.string().min(1, "Date of birth is required"),
  phone: z
    .string()
    .regex(/^\d{10}$/, "Enter a valid 10-digit mobile number"),
  employmentType: z.enum(["Full Time", "Part Time"], {
    error: "Please select employment type",
  }),
})

export type EmployeeFormValues = z.infer<typeof schema>

function toInputDate(dob: string): string {
  const months: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04",
    May: "05", Jun: "06", Jul: "07", Aug: "08",
    Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  }
  const [d, m, y] = dob.split("-")
  if (!d || !m || !y || !months[m]) return ""
  const yr = parseInt(y) > 30 ? `19${y}` : `20${y}`
  return `${yr}-${months[m]}-${d.padStart(2, "0")}`
}

interface EmployeeFormProps {
  row?: EmployeeRow
  onCancel: () => void
  onSubmit: (data: EmployeeFormValues) => Promise<void> | void
}

export function EmployeeForm({ row, onCancel, onSubmit }: EmployeeFormProps) {
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: row
      ? {
          name: row.name,
          dob: toInputDate(row.dob),
          phone: row.phone,
          employmentType: row.employmentType,
        }
      : { name: "", dob: "", phone: "", employmentType: undefined },
  })

  const { isSubmitting } = form.formState

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dob"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Pick a date"
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number</FormLabel>
              <div className="flex h-10 w-full overflow-hidden rounded-lg border border-input transition-[color,box-shadow] focus-within:border-blue-500 focus-within:ring-[3px] focus-within:ring-blue-200">
                <span className="inline-flex shrink-0 select-none items-center border-r border-input bg-gray-50 px-3 text-sm text-gray-500">
                  +91
                </span>
                <input
                  {...field}
                  placeholder="10-digit number"
                  maxLength={10}
                  inputMode="numeric"
                  className="flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground"
                  onChange={(e) =>
                    field.onChange(e.target.value.replace(/\D/g, ""))
                  }
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="employmentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employment Type</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-6 pt-0.5"
                >
                  {(["Full Time", "Part Time"] as const).map((opt) => (
                    <label key={opt} className="flex cursor-pointer items-center gap-2">
                      <RadioGroupItem value={opt} />
                      <Label className="cursor-pointer font-normal">{opt}</Label>
                    </label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-20 bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : row ? (
              "Update"
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
