import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Check, Loader2, Search, UserRound } from "lucide-react"
import companyLogo from "@/assets/company-logo.png"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { setOperatorUser } from "@/utils/auth"
import { useGetOperatorsQuery } from "@/store/services/userManagementApi"

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
    <div className="h-dvh overflow-hidden flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-lg flex flex-col rounded-2xl overflow-hidden shadow-2xl bg-white max-h-[90vh]">
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 shrink-0">
          <button
            type="button"
            onClick={() => navigate("/login")}
            aria-label="Back to login"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <img src={companyLogo} alt="APM Logo" className="h-8 w-auto object-contain" />
        </div>

        <div className="px-6 pb-2 shrink-0">
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

        <div className="grid grid-cols-2 gap-2.5 px-6 py-4 overflow-y-auto flex-1 min-h-0">
          {isLoading && (
            <div className="col-span-2 flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading operators…
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <p className="col-span-2 py-8 text-center text-sm text-gray-400">No operators found</p>
          )}
          {!isLoading && filtered.map((op) => {
            const isSelected = op.employeeId === employeeId
            return (
              <button
                key={op.employeeId}
                type="button"
                onClick={() => setEmployeeId(op.employeeId)}
                className={cn(
                  "flex items-center gap-3 rounded-xl p-3 text-left transition-all duration-150 border",
                  isSelected
                    ? "bg-[#1a2a4a] border-[#1a2a4a] text-white"
                    : "bg-gray-100 border-transparent text-gray-900 hover:bg-gray-200"
                )}
              >
                <div className="relative shrink-0">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    isSelected ? "bg-white/20" : "bg-gray-300"
                  )}>
                    <UserRound className={cn("h-5 w-5", isSelected ? "text-white" : "text-gray-500")} />
                  </div>
                  {isSelected && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 ring-2 ring-[#1a2a4a]">
                      <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{op.employeeName}</p>
                  <p className={cn("text-xs", isSelected ? "text-gray-300" : "text-gray-500")}>
                    Employee Id : {op.employeeId}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 shrink-0">
          <Button
            onClick={handleSubmit}
            disabled={!selected}
            className="w-full bg-[#1a2a4a] hover:bg-[#22355e] active:bg-[#111e36] text-white font-semibold py-3 tracking-wide"
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  )
}
