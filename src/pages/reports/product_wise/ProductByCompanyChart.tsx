import { useMemo } from "react"
import { Bar } from "react-chartjs-2"
import { useTheme } from "@/hooks/useTheme"
import { categoricalColor, chartChrome, foldToOther } from "@/shared/charts/chartTheme"
import type { ProductProductionSummaryRecord } from "@/types/productWiseReport"

interface Props {
  data: ProductProductionSummaryRecord[]
}

export function ProductByCompanyChart({ data }: Props) {
  const { theme } = useTheme()
  const chrome = chartChrome(theme)

  const { labels, datasets } = useMemo(() => {
    const productOrder: string[] = []
    const productLabel = new Map<string, string>()
    for (const row of data) {
      if (!productLabel.has(row.itemCode)) {
        productOrder.push(row.itemCode)
        productLabel.set(row.itemCode, row.productName)
      }
    }

    const companyOrder: string[] = []
    for (const row of data) {
      for (const c of row.companies) {
        if (!companyOrder.includes(c.companyName)) companyOrder.push(c.companyName)
      }
    }

    const slots = foldToOther(companyOrder)
    const keptKeys = new Set(slots.filter((s) => !s.isOther).map((s) => s.key))

    const datasets = slots.map((slot, i) => ({
      label: slot.key,
      data: productOrder.map((itemCode) => {
        const product = data.find((r) => r.itemCode === itemCode)
        if (!product) return 0
        const matching = slot.isOther
          ? product.companies.filter((c) => !keptKeys.has(c.companyName))
          : product.companies.filter((c) => c.companyName === slot.key)
        return matching.reduce((sum, c) => sum + c.producedQty, 0)
      }),
      backgroundColor: categoricalColor(i, theme),
      borderRadius: 4,
      maxBarThickness: 48,
      stack: "companies",
    }))

    return { labels: productOrder.map((code) => productLabel.get(code) ?? code), datasets }
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
