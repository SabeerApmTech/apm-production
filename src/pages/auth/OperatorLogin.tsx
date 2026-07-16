import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Check, Search, UserRound } from "lucide-react"
import companyLogo from "@/assets/company-logo.png"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { setOperatorUser } from "@/utils/auth"
import { useGetOperatorsQuery } from "@/store/services/userManagementApi"
import { LoadingRow } from "@/shared/LoadingRow"
import { AuthLayout } from "@/shared/AuthLayout"

export const OperatorLogin = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [employeeId, setEmployeeId] = useState<string | null>(null)

  const { data: operators, isLoading } = useGetOperatorsQuery()
  const activeOperators = (operators ?? []).filter((o) => o.isActive)
  const filtered = activeOperators.filter(
    (o) =>
      o.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      o.employeeId.toLowerCase().includes(search.toLowerCase())
  )
  const selected = activeOperators.find((o) => o.employeeId === employeeId)

  const handleSubmit = () => {
    if (!selected) return
    setOperatorUser({ employeeId: selected.employeeId, employeeName: selected.employeeName })
    navigate("/production-monitoring")
  }

  return (
    <AuthLayout
      cardClassName="w-[95vw] h-[92vh] max-w-[1400px]"
      leftClassName="flex flex-col min-h-0"
      cornerLabel="Back To Main Screen"
      cornerTo="/login"
      rightOverlay={
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-10 left-8 right-8">
            <p className="text-white text-3xl font-bold tracking-wide">Production Tracker</p>
            <p className="text-white/80 text-sm mt-1">Track. Manage. Deliver.</p>
          </div>
        </>
      }
    >
      <div className="flex items-center gap-3 px-8 pt-8 pb-4 shrink-0">
        <img src={companyLogo} alt="APM Logo" className="h-8 w-auto object-contain" />
      </div>

      <div className="px-8 pb-2 shrink-0">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Select Your Profile</h1>
        <p className="text-sm text-gray-500 mb-4">Choose your name from the list to continue.</p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or employee ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-4">
        {isLoading && (
          <LoadingRow label="Loading operators…" className="justify-center py-8 text-gray-400" />
        )}
        {!isLoading && filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">No operators found</p>
        )}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5">
            {filtered.map((op) => {
              const isSelected = op.employeeId === employeeId
              return (
                <button
                  key={op.employeeId}
                  type="button"
                  onClick={() => setEmployeeId(op.employeeId)}
                  className={cn(
                    "flex items-start gap-2 rounded-xl p-2 text-left transition-all duration-150 border",
                    isSelected
                      ? "bg-[#1a2a4a] border-[#1a2a4a] text-white"
                      : "bg-gray-100 border-transparent text-gray-900 hover:bg-gray-200"
                  )}
                >
                  <div className="relative shrink-0">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      isSelected ? "bg-white/20" : "bg-gray-300"
                    )}>
                      <UserRound className={cn("h-4 w-4", isSelected ? "text-white" : "text-gray-500")} />
                    </div>
                    {isSelected && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-500 ring-2 ring-[#1a2a4a]">
                        <Check className="h-2 w-2 text-white" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="wrap-break-word text-[13px] font-semibold leading-tight">{op.employeeName}</p>
                    <p className={cn("text-[11px] leading-tight", isSelected ? "text-gray-300" : "text-gray-500")}>
                      ID: {op.employeeId}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="px-8 py-4 border-t border-gray-100 shrink-0">
        <Button
          onClick={handleSubmit}
          disabled={!selected}
          className="w-full bg-[#1a2a4a] hover:bg-[#22355e] active:bg-[#111e36] text-white font-semibold py-3 tracking-wide"
        >
          Submit
        </Button>
      </div>
    </AuthLayout>
  )
}
