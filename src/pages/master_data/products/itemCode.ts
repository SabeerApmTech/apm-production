import type { MasterProduct } from "@/types/productHierarchy"

// Product Code is system-generated, not typed — "{companyCode}-{next sequence for that company}",
// e.g. "LAK-001", then "LAK-002" for that same company's next product. Sequence is derived from
// the existing products list rather than the backend, so it has to exclude the record being
// edited/duplicated itself (otherwise its own existing code would count toward "already taken").
export function nextProductCode(companyCode: string, products: MasterProduct[], excludeProductId?: number): string {
  const prefix = `${companyCode}-`
  const maxSeq = products.reduce((max, p) => {
    if (p.companyCode !== companyCode || p.productId === excludeProductId) return max
    const suffix = p.productCode.startsWith(prefix) ? Number(p.productCode.slice(prefix.length)) : NaN
    return Number.isFinite(suffix) ? Math.max(max, suffix) : max
  }, 0)
  return `${prefix}${String(maxSeq + 1).padStart(3, "0")}`
}
