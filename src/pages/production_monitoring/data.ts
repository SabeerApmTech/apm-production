export const PAUSE_REASONS = [
  "Machine Breakdown", "Material Shortage", "Power Cut",
  "Tea Break", "Lunch Break", "Maintenance",
  "Prayer", "Fitting", "Waiting For Material", "Printer Issue", "Zig Issue",
  "Other",
]

export const REJECTION_REASONS = [
  "Inf", "Dnr", "Sos", "Ign", "Power Issue", "Firmware Issue", "Gsm Low (Below 7)",
]

export const pad2 = (n: number) => String(n).padStart(2, "0")
