import { cn } from "@/lib/utils"
import { LOGO_SRC } from "@/lib/brand"

export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src={LOGO_SRC}
      alt=""
      width={32}
      height={32}
      className={cn("size-8 shrink-0 rounded-lg object-cover", className)}
    />
  )
}
