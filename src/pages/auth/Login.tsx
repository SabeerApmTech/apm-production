import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import companyLogo from "@/assets/company-logo.png"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthLayout } from "@/shared/AuthLayout"
import { setAuthUser } from "@/utils/auth"
import { useLoginMutation } from "@/store/services/authApi"
import { getApiErrorMessage } from "@/utils/apiError"

export const Login = () => {
  const navigate = useNavigate()
  const [login, { isLoading }] = useLoginMutation()
  const [showPassword, setShowPassword] = useState(false)
  const [employeeId, setEmployeeId] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const res = await login({ employeeId, password }).unwrap()
      setAuthUser(res.data)
      navigate('/dashboard/employee-wise-tracking')
    } catch (err) {
      setError(getApiErrorMessage(err, "Invalid employee ID or password"))
    }
  }

  return (
    <AuthLayout
      cardClassName="w-full max-w-4xl"
      leftClassName="flex flex-col justify-center px-8 py-8 sm:py-12 sm:px-12"
    >
      <img
        src={companyLogo}
        alt="APM Logo"
        className="h-10 w-auto mb-6 object-contain object-left"
      />

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h1>
      <p className="text-sm text-gray-500 mb-6">Sign in to continue to your account.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Employee Id */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="employeeId" className="text-gray-700">Employee Id</Label>
          <Input
            id="employeeId"
            type="text"
            placeholder="Enter Id"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="text-gray-700">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">{error}</p>
        )}

        {/* Sign In */}
        <Button
          type="submit"
          disabled={isLoading}
          className="mt-2 w-full bg-[#1a2a4a] hover:bg-[#22355e] active:bg-[#111e36] text-white font-semibold py-3 tracking-wide"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Sign In"}
        </Button>
      </form>
    </AuthLayout>
  )
}
