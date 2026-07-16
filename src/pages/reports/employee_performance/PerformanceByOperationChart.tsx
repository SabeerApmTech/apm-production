import { useMemo } from "react"
import { Bar } from "react-chartjs-2"
import { useTheme } from "@/hooks/useTheme"
import { categoricalColor, chartChrome, foldToOther } from "@/shared/charts/chartTheme"
import type { EmployeePerformanceRecord } from "@/types/employeePerformanceReport"

interface Props {
  data: EmployeePerformanceRecord[]
}

export function PerformanceByOperationChart({ data }: Props) {
  const { theme } = useTheme()
  const chrome = chartChrome(theme)

  const { labels, datasets } = useMemo(() => {
    const employeeOrder: string[] = []
    const employeeLabel = new Map<string, string>()
    for (const row of data) {
      if (!employeeLabel.has(row.employeeId)) {
        employeeOrder.push(row.employeeId)
        employeeLabel.set(row.employeeId, row.employeeName)
      }
    }

    const operationOrder: string[] = []
    for (const row of data) {
      if (!operationOrder.includes(row.operationName)) operationOrder.push(row.operationName)
    }

    const slots = foldToOther(operationOrder)
    const keptKeys = new Set(slots.filter((s) => !s.isOther).map((s) => s.key))

    const datasets = slots.map((slot, i) => ({
      label: slot.key,
      data: employeeOrder.map((empId) => {
        const rows = data.filter((row) => row.employeeId === empId)
        const matching = slot.isOther
          ? rows.filter((row) => !keptKeys.has(row.operationName))
          : rows.filter((row) => row.operationName === slot.key)
        return matching.reduce((sum, row) => sum + row.producedQty, 0)
      }),
      backgroundColor: categoricalColor(i, theme),
      borderRadius: 4,
      maxBarThickness: 36,
      stack: "operations",
    }))

    return { labels: employeeOrder.map((id) => employeeLabel.get(id) ?? id), datasets }
  }, [data, theme])

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: datasets.length > 1,
          position: "top" as const,
          labels: { color: chrome.textSecondary, boxWidth: 12, boxHeight: 12, usePointStyle: true, pointStyle: "rectRounded" },
        },
        tooltip: {
          backgroundColor: chrome.surface,
          titleColor: chrome.textPrimary,
          bodyColor: chrome.textSecondary,
          borderColor: chrome.grid,
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { color: chrome.tick },
          border: { color: chrome.axis },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: { color: chrome.grid },
          ticks: { color: chrome.tick },
          border: { display: false },
          title: { display: true, text: "Produced Qty", color: chrome.textSecondary },
        },
      },
    }),
    [chrome, datasets.length]
  )

  if (!data.length || datasets.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No production recorded for the selected filters.
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <Bar data={{ labels, datasets }} options={options} />
    </div>
  )
}
