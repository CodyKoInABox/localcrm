import type { ReactNode } from "react"
import { Link } from "react-router"

export function EntityRow({
  to,
  title,
  meta,
}: {
  to: string
  title: string
  meta?: ReactNode
}) {
  return (
    <Link
      to={to}
      className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50"
    >
      <span className="min-w-0 truncate font-medium">{title}</span>
      {meta ? (
        <span className="text-sm text-muted-foreground">{meta}</span>
      ) : null}
    </Link>
  )
}
