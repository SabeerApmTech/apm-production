import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { clearAuth, getLoginPath, getRole, getTokenExpiresAt } from "@/utils/auth"

/**
 * Schedules an automatic logout at the exact moment the current admin session's token expires,
 * so an idle tab doesn't stay "logged in" past its server-issued expiry. Operator sessions have
 * no token and are left alone. Re-armed on every route change so a fresh login (no full page
 * reload) picks up its new expiry immediately.
 */
export function AuthExpiryWatcher() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (getRole() !== "admin") return
    const expiresAt = getTokenExpiresAt()
    if (!expiresAt) return

    const logout = () => {
      clearAuth()
      navigate(getLoginPath(), { replace: true })
    }

    const msRemaining = new Date(expiresAt).getTime() - Date.now()
    if (msRemaining <= 0) {
      logout()
      return
    }
    const timer = setTimeout(logout, msRemaining)
    return () => clearTimeout(timer)
  }, [location.pathname, navigate])

  return null
}
