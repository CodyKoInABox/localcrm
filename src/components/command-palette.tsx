import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import {
  Building2Icon,
  Columns3Icon,
  HandshakeIcon,
  HouseIcon,
  PackageIcon,
  PlusIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react"
import { useNavigate } from "react-router"

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { db } from "@/lib/db"

export function CommandPalette({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (kind: "product" | "company" | "contact" | "lead") => void
}) {
  const navigate = useNavigate()
  const products = useLiveQuery(() => db.products.orderBy("name").toArray()) ?? []
  const companies =
    useLiveQuery(() => db.companies.orderBy("name").toArray()) ?? []
  const contacts = useLiveQuery(() => db.contacts.orderBy("name").toArray()) ?? []
  const leads = useLiveQuery(() => db.leads.toArray()) ?? []

  const go = React.useCallback(
    (to: string) => {
      navigate(to)
      onOpenChange(false)
    },
    [navigate, onOpenChange]
  )

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command palette"
      description="Jump to a page or record."
    >
      <Command>
        <CommandInput placeholder="Search pages, products, companies…" />
        <CommandList className="max-h-[min(28rem,70vh)]">
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Go">
            <CommandItem onSelect={() => go("/")}>
              <HouseIcon />
              Home
            </CommandItem>
            <CommandItem onSelect={() => go("/pipeline")}>
              <Columns3Icon />
              Pipeline
            </CommandItem>
            <CommandItem onSelect={() => go("/leads")}>
              <HandshakeIcon />
              Leads
            </CommandItem>
            <CommandItem onSelect={() => go("/products")}>
              <PackageIcon />
              Products
            </CommandItem>
            <CommandItem onSelect={() => go("/companies")}>
              <Building2Icon />
              Companies
            </CommandItem>
            <CommandItem onSelect={() => go("/contacts")}>
              <UsersIcon />
              Contacts
            </CommandItem>
            <CommandItem onSelect={() => go("/settings")}>
              <SettingsIcon />
              Settings
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Create">
            <CommandItem
              onSelect={() => {
                onOpenChange(false)
                onCreate("product")
              }}
            >
              <PlusIcon />
              New product
            </CommandItem>
            <CommandItem
              onSelect={() => {
                onOpenChange(false)
                onCreate("company")
              }}
            >
              <PlusIcon />
              New company
            </CommandItem>
            <CommandItem
              onSelect={() => {
                onOpenChange(false)
                onCreate("contact")
              }}
            >
              <PlusIcon />
              New contact
            </CommandItem>
            <CommandItem
              onSelect={() => {
                onOpenChange(false)
                onCreate("lead")
              }}
            >
              <PlusIcon />
              New lead
            </CommandItem>
          </CommandGroup>
          {products.length > 0 ? (
            <CommandGroup heading="Products">
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={`product ${product.name} ${product.sku ?? ""}`}
                  onSelect={() => go(`/products/${product.id}`)}
                >
                  <PackageIcon />
                  {product.name}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {companies.length > 0 ? (
            <CommandGroup heading="Companies">
              {companies.map((company) => (
                <CommandItem
                  key={company.id}
                  value={`company ${company.name}`}
                  onSelect={() => go(`/companies/${company.id}`)}
                >
                  <Building2Icon />
                  {company.name}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {contacts.length > 0 ? (
            <CommandGroup heading="Contacts">
              {contacts.map((contact) => (
                <CommandItem
                  key={contact.id}
                  value={`contact ${contact.name}`}
                  onSelect={() => go(`/contacts/${contact.id}`)}
                >
                  <UsersIcon />
                  {contact.name}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {leads.length > 0 ? (
            <CommandGroup heading="Leads">
              {leads.map((lead) => {
                const company = companies.find((item) => item.id === lead.companyId)
                const product = products.find((item) => item.id === lead.productId)
                const label = `${company?.name ?? "Company"} · ${product?.name ?? "Product"}`
                return (
                  <CommandItem
                    key={lead.id}
                    value={`lead ${label}`}
                    onSelect={() => go(`/leads/${lead.id}`)}
                  >
                    <HandshakeIcon />
                    {label}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          ) : null}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
