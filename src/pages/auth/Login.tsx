import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import companyLogo from "@/assets/company-logo.png"
import productionProducts from "@/assets/production-products.jpg"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
    <div className="force-light h-dvh overflow-hidden flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-4xl flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-2xl bg-white">

        {/* Left — Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-8 py-8 sm:py-12 sm:px-12 relative">

          {/* Operator Login — top-right corner of card */}
          <button
            type="button"
            onClick={() => navigate('/operator-login')}
            className="absolute top-4 right-4 text-xs rounded-lg px-3 py-1.5 border font-medium transition text-[#1a2a4a] border-[#1a2a4a] hover:bg-[#1a2a4a] hover:text-white"
          >
            Operator Login
          </button>

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
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
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
        </div>

        {/* Right — Image */}
        <div className="hidden md:block w-1/2 relative">
          <img
            src={productionProducts}
            alt="APM Products"
            className="w-full h-full object-cover"
          />
        </div>

      </div>
    </div>
  )
}
