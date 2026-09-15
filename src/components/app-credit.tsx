import type { ReactNode } from "react"

import {
  AUTHOR_HANDLE,
  AUTHOR_URL,
  LICENSE_NAME,
  LICENSE_URL,
  REPO_URL,
} from "@/lib/brand"
import { cn } from "@/lib/utils"

function CreditLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline underline-offset-2 hover:text-foreground"
    >
      {children}
    </a>
  )
}

export function AppCredit({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      Created by{" "}
      <CreditLink href={AUTHOR_URL}>{AUTHOR_HANDLE}</CreditLink>
      {" · "}
      <CreditLink href={REPO_URL}>GitHub</CreditLink>
      {" · "}
      <CreditLink href={LICENSE_URL}>{LICENSE_NAME}</CreditLink>
    </p>
  )
}
