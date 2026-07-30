export const PAUSE_REASONS = [
  "Machine Breakdown", "Material Shortage", "Power Cut",
  "Tea Break", "Lunch Break", "Maintenance",
  "Prayer", "Fitting", "Waiting For Material", "Printer Issue", "Zig Issue",
  "Other",
]

export const REJECTION_REASONS = [
  "Inf", "Dnr", "Sos", "Ign", "Power Issue", "Firmware Issue", "Gsm Low (Below 7)",
  "Enclosure Thread Not Fix", "Glue Is Overflowed On The Enclosure",
]

// Rendered as the last option in the Rejection Reason dropdown — picking it reveals a free-text
// box, and the typed text (not the literal word "Others") is what's sent as the reason.
export const OTHERS_REASON = "Others"

export const pad2 = (n: number) => String(n).padStart(2, "0")
