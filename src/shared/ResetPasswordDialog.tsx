import { useState } from "react"
import { KeyRound } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useResetPasswordMutation } from "@/store/services/authApi"
import { getApiErrorMessage } from "@/utils/apiError"

interface ResetPasswordDialogProps {
  open: boolean
  onClose: () => void
  userId: number | null
  employeeName?: string
}

export function ResetPasswordDialog({ open, onClose, userId, employeeName }: ResetPasswordDialogProps) {
  const [resetPassword, { isLoading }] = useResetPasswordMutation()
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const handleClose = () => {
    setResult(null)
    onClose()
  }

  const handleConfirm = async () => {
    if (userId == null) return
    try {
      const res = await resetPassword(userId).unwrap()
      setResult({ ok: true, message: res.message })
    } catch (err) {
      setResult({ ok: false, message: getApiErrorMessage(err, "Failed to reset password. Please try again.") })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="max-w-sm w-[calc(100%-2rem)]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <KeyRound className="h-5 w-5 text-blue-600" />
            </div>
            <DialogTitle>Reset Password</DialogTitle>
          </div>
        </DialogHeader>

        {result ? (
          <>
            <p className={`mt-1 text-sm ${result.ok ? "text-gray-700" : "text-red-600"}`} role={result.ok ? undefined : "alert"}>
              {result.message}
            </p>
            <DialogFooter className="mt-4">
              <Button onClick={handleClose}>Close</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-gray-600">
              {employeeName
                ? `Reset the password for ${employeeName}? A new temporary password will be generated.`
                : "Reset this user's password? A new temporary password will be generated."}
            </p>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>Cancel</Button>
              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
