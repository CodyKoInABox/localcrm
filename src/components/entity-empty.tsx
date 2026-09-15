import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Link } from "react-router"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export function EntityEmpty({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionTo,
}: {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  actionTo?: string
}) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {actionLabel ? (
        <EmptyContent>
          {actionTo ? (
            <Button asChild>
              <Link to={actionTo}>{actionLabel}</Link>
            </Button>
          ) : (
            <Button onClick={onAction}>{actionLabel}</Button>
          )}
        </EmptyContent>
      ) : null}
    </Empty>
  )
}

export function LoopHint(): ReactNode {
  return (
    <p className="text-sm text-muted-foreground">
      Loop: product → company + people → lead → offer.
    </p>
  )
}
