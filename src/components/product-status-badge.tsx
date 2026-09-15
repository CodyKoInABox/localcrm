import { Badge } from "@/components/ui/badge"
import type { ProductStatus } from "@/lib/schema"

const LABELS: Record<ProductStatus, string> = {
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
  withdrawn: "Withdrawn",
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const variant =
    status === "withdrawn"
      ? "destructive"
      : status === "available"
        ? "default"
        : "secondary"

  return <Badge variant={variant}>{LABELS[status]}</Badge>
}
