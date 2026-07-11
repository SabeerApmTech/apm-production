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
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import type { UserRecord } from "@/types/userManagement"

const EMPLOYMENT_TYPES = [
  { value: "FullTime", label: "Full Time" },
  { value: "PartTime", label: "Part Time" },
] as const

const schema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  employeeName: z.string().min(1, "Employee name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  phoneNumber: z
    .string()
    .regex(/^\d{10}$/, "Enter a valid 10-digit mobile number"),
  employmentType: z.enum(["FullTime", "PartTime"], {
    error: "Please select employment type",
  }),
  department: z.string().optional(),
})

export type EmployeeFormValues = z.infer<typeof schema>

interface EmployeeFormProps {
  row?: UserRecord
  apiError?: string | null
  onCancel: () => void
  onSubmit: (data: EmployeeFormValues) => Promise<void> | void
}

export function EmployeeForm({ row, apiError, onCancel, onSubmit }: EmployeeFormProps) {
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: row
      ? {
          employeeId: row.employeeId,
          employeeName: row.employeeName,
          dateOfBirth: row.dateOfBirth,
          phoneNumber: row.phoneNumber,
          employmentType: row.employmentType,
        }
      : { employeeId: "", employeeName: "", dateOfBirth: "", phoneNumber: "", employmentType: undefined, department: "production" },
  })

  const { isSubmitting } = form.formState

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">

        {apiError && (
          <p className="text-sm text-red-600" role="alert">{apiError}</p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="employeeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee ID</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. APM0001" {...field} disabled={!!row} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="employeeName"
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
        </div>

        {!row && (
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="dateOfBirth"
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

        <FormField
          control={form.control}
          name="phoneNumber"
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
                  {EMPLOYMENT_TYPES.map((opt) => (
                    <div key={opt.value} className="flex items-center gap-2">
                      <RadioGroupItem value={opt.value} id={`employmentType-${opt.value}`} />
                      <Label htmlFor={`employmentType-${opt.value}`} className="cursor-pointer font-normal">
                        {opt.label}
                      </Label>
                    </div>
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
