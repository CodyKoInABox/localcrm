import { Badge } from "@/components/ui/badge"
import type { DerivedChips } from "@/lib/chips"

export function LeadChips({ chips }: { chips: DerivedChips }) {
  const items = [
    chips.awaitingReply ? (
      <Badge key="awaiting" variant="secondary">
        Awaiting reply
      </Badge>
    ) : null,
    chips.overdue ? (
      <Badge key="overdue" variant="destructive">
        Overdue
      </Badge>
    ) : null,
    chips.dueToday ? (
      <Badge key="due">Due today</Badge>
    ) : null,
    chips.stale ? (
      <Badge key="stale" variant="outline">
        Stale
      </Badge>
    ) : null,
  ].filter(Boolean)

  if (items.length === 0) {
    return null
  }

  return <div className="flex flex-wrap gap-1.5">{items}</div>
}
