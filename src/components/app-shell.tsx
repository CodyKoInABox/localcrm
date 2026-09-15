import { SearchIcon } from "lucide-react"
import { Outlet } from "react-router"

import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export function AppShell({
  onOpenCommand,
}: {
  onOpenCommand: () => void
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <Button
            variant="outline"
            className="max-w-sm flex-1 justify-start text-muted-foreground"
            onClick={onOpenCommand}
          >
            <SearchIcon data-icon="inline-start" />
            Search
            <Kbd className="ml-auto">Ctrl K</Kbd>
          </Button>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
