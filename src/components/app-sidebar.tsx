import {
  Building2Icon,
  Columns3Icon,
  HandshakeIcon,
  HouseIcon,
  PackageIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react"
import { Link, useLocation } from "react-router"

import { AppCredit } from "@/components/app-credit"
import { BrandMark } from "@/components/brand-mark"
import { ThemeMenu } from "@/components/theme-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { APP_NAME } from "@/lib/brand"

const NAV = [
  { to: "/", label: "Home", icon: HouseIcon },
  { to: "/pipeline", label: "Pipeline", icon: Columns3Icon },
  { to: "/leads", label: "Leads", icon: HandshakeIcon },
  { to: "/products", label: "Products", icon: PackageIcon },
  { to: "/companies", label: "Companies", icon: Building2Icon },
  { to: "/contacts", label: "Contacts", icon: UsersIcon },
] as const

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip={APP_NAME}
              className="group-data-[collapsible=icon]:justify-center"
            >
              <Link to="/" aria-label={APP_NAME}>
                <BrandMark />
                <span className="flex min-w-0 flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-medium">{APP_NAME}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    This browser only
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const Icon = item.icon
                const isActive =
                  item.to === "/"
                    ? location.pathname === "/"
                    : location.pathname === item.to ||
                      location.pathname.startsWith(`${item.to}/`)
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link to={item.to}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 group-data-[collapsible=icon]:hidden">
          <AppCredit />
        </div>
        <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />
        <SidebarMenu>
          <SidebarMenuItem>
            <ThemeMenu />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location.pathname === "/settings"}
              tooltip="Settings"
            >
              <Link to="/settings">
                <SettingsIcon />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
