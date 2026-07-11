import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js"
import type { Theme } from "@/hooks/useTheme"

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title)

/** Fixed-order categorical hues — never cycled or generated; a series always keeps its slot. */
const CATEGORICAL_LIGHT = [
  "#2a78d6", "#1baf7a", "#eda100", "#008300",
  "#4a3aa7", "#e34948", "#e87ba4", "#eb6834",
]
const CATEGORICAL_DARK = [
  "#3987e5", "#199e70", "#c98500", "#008300",
  "#9085e9", "#e66767", "#d55181", "#d95926",
]

const SEQUENTIAL_BLUE = { light: "#2a78d6", dark: "#3987e5" }

export const MAX_CATEGORICAL_SLOTS = CATEGORICAL_LIGHT.length

export function categoricalColor(index: number, theme: Theme): string {
  const palette = theme === "dark" ? CATEGORICAL_DARK : CATEGORICAL_LIGHT
  return palette[index % palette.length]
}

export function sequentialColor(theme: Theme): string {
  return SEQUENTIAL_BLUE[theme]
}

export function chartChrome(theme: Theme) {
  return theme === "dark"
    ? {
        grid: "#2c2c2a",
        axis: "#383835",
        tick: "#898781",
        textPrimary: "#ffffff",
        textSecondary: "#c3c2b7",
        surface: "#1a1a19",
      }
    : {
        grid: "#e1e0d9",
        axis: "#c3c2b7",
        tick: "#898781",
        textPrimary: "#0b0b0b",
        textSecondary: "#52514e",
        surface: "#fcfcfb",
      }
}

/** Folds series beyond MAX_CATEGORICAL_SLOTS into a trailing "Other" bucket, so a long tail never forces a generated hue. */
export function foldToOther<T extends string>(keys: T[], maxSlots = MAX_CATEGORICAL_SLOTS - 1): { key: T | "Other"; isOther: boolean }[] {
  if (keys.length <= MAX_CATEGORICAL_SLOTS) return keys.map((key) => ({ key, isOther: false }))
  const kept = keys.slice(0, maxSlots).map((key) => ({ key, isOther: false }))
  return [...kept, { key: "Other" as const, isOther: true }]
}
