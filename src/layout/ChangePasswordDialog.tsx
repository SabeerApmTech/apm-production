import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { FormDialog } from "@/shared/FormDialog"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { getAuthUser } from "@/utils/auth"
import { useChangePasswordMutation } from "@/store/services/authApi"
import { getApiErrorMessage } from "@/utils/apiError"

// Mirrors the backend's [MinLength]/[RegularExpression] rules on NewPassword — kept in sync
// with the checklist below so the frontend never accepts a password the API would reject.
const SPECIAL_CHAR_CLASS = /[!@#$%^&*()\-+]/

const PASSWORD_REQUIREMENTS = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "One uppercase letter (A-Z)", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One lowercase letter (a-z)", test: (v: string) => /[a-z]/.test(v) },
  { label: "One special character (!@#$%^&*()-+)", test: (v: string) => SPECIAL_CHAR_CLASS.test(v) },
]

const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long.")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter, one lowercase letter, and one special character.")
      .regex(/[a-z]/, "Password must contain at least one uppercase letter, one lowercase letter, and one special character.")
      .regex(SPECIAL_CHAR_CLASS, "Password must contain at least one uppercase letter, one lowercase letter, and one special character."),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type ChangePasswordValues = z.infer<typeof schema>

function PasswordRequirementsChecklist({ password }: { password: string }) {
  const metCount = PASSWORD_REQUIREMENTS.filter((r) => r.test(password)).length
  const allMet = metCount === PASSWORD_REQUIREMENTS.length
  const barColor = allMet ? "bg-green-500" : metCount >= 2 ? "bg-amber-500" : "bg-red-500"

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn("h-full rounded-full transition-all duration-300", barColor)}
          style={{ width: `${(metCount / PASSWORD_REQUIREMENTS.length) * 100}%` }}
        />
      </div>
      <ul className="flex flex-col gap-1">
        {PASSWORD_REQUIREMENTS.map((req) => {
          const met = req.test(password)
          return (
            <li key={req.label} className="flex items-center gap-2 text-xs">
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors",
                  met ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"
                )}
              >
                {met ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
              </span>
              <span className={cn("transition-colors", met ? "text-green-700" : "text-gray-500")}>
                {req.label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

interface ChangePasswordDialogProps {
  open: boolean
  onClose: () => void
}

export function ChangePasswordDialog({ open, onClose }: ChangePasswordDialogProps) {
  const [changePassword] = useChangePasswordMutation()
  const [apiError, setApiError] = useState<string | null>(null)

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  const { isSubmitting } = form.formState
  const newPassword = form.watch("newPassword")

  const handleClose = () => {
    form.reset()
    setApiError(null)
    onClose()
  }

  const onValid = async (data: ChangePasswordValues) => {
    const user = getAuthUser()
    if (!user) return
    setApiError(null)
    try {
      await changePassword({ id: user.userId, body: data }).unwrap()
      handleClose()
    } catch (err) {
      setApiError(getApiErrorMessage(err, "Failed to change password. Please try again."))
    }
  }

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      title="Change Password"
      onSubmit={form.handleSubmit(onValid)}
      submitLabel={isSubmitting ? "Saving..." : "Save"}
      submitDisabled={isSubmitting}
    >
      <Form {...form}>
        <div className="flex flex-col gap-4">
          {apiError && (
            <p className="text-sm text-red-600" role="alert">{apiError}</p>
          )}

          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter current password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter new password" {...field} />
                </FormControl>
                <FormMessage />
                <PasswordRequirementsChecklist password={newPassword} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Re-enter new password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </FormDialog>
  )
}
