import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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

const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type ChangePasswordValues = z.infer<typeof schema>

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
