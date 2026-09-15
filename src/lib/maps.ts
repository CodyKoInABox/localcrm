export function byId<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]))
}

export function leadLabel(
  companyName: string | undefined,
  productName: string | undefined
): string {
  return `${companyName ?? "Unknown company"} · ${productName ?? "Unknown product"}`
}
