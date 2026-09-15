import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { PackageIcon, PlusIcon, SearchIcon } from "lucide-react"
import { Link } from "react-router"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { EntityEmpty, NoMatches } from "@/components/entity-empty"
import { DataPanel, MoreMenu } from "@/components/more-menu"
import { PageHeader, PageSkeleton, PageStack } from "@/components/page-header"
import { ProductFormDialog } from "@/components/product-form-dialog"
import { ProductStatusBadge } from "@/components/product-status-badge"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCurrency } from "@/hooks/use-currency"
import { db } from "@/lib/db"
import { formatMoney } from "@/lib/money"
import { deleteProduct } from "@/lib/mutations"
import type { Product } from "@/lib/schema"

export function ProductsPage() {
  const currency = useCurrency()
  const products = useLiveQuery(() => db.products.orderBy("name").toArray())
  const leads = useLiveQuery(() => db.leads.toArray())
  const [query, setQuery] = React.useState("")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Product | undefined>()
  const [deleting, setDeleting] = React.useState<Product | undefined>()

  if (!products || !leads) {
    return <PageSkeleton />
  }

  const filtered = products.filter((product) => {
    const hay = `${product.name} ${product.sku ?? ""} ${product.location ?? ""}`.toLowerCase()
    return hay.includes(query.toLowerCase())
  })

  return (
    <PageStack>
      <PageHeader
        title="Products"
        description="What you sell. Asking price is the baseline for competing offers."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            New product
          </Button>
        }
      />
      {products.length === 0 ? (
        <EntityEmpty
          icon={PackageIcon}
          title="No products yet"
          description="Add a product first. Then a company and people, then a lead, then their offer."
          actionLabel="New product"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <>
          <InputGroup className="w-full max-w-sm">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products"
              aria-label="Search products"
            />
          </InputGroup>
          {filtered.length === 0 ? (
            <NoMatches />
          ) : (
            <DataPanel>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Asking</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((product) => {
                  const count = leads.filter(
                    (lead) => lead.productId === product.id
                  ).length
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="max-w-64 whitespace-normal">
                        <Link
                          to={`/products/${product.id}`}
                          className="font-medium underline-offset-4 hover:underline"
                        >
                          {product.name}
                        </Link>
                        {product.sku ? (
                          <div className="text-xs text-muted-foreground">
                            {product.sku}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {formatMoney(product.askingPrice, currency)}
                      </TableCell>
                      <TableCell>
                        <ProductStatusBadge status={product.status} />
                      </TableCell>
                      <TableCell>{count}</TableCell>
                      <TableCell className="text-right">
                        <MoreMenu
                          items={[
                            {
                              label: "Edit",
                              onSelect: () => setEditing(product),
                            },
                            {
                              label: "Delete",
                              destructive: true,
                              onSelect: () => setDeleting(product),
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            </DataPanel>
          )}
        </>
      )}
      <ProductFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ProductFormDialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(undefined)
          }
        }}
        product={editing}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(undefined)
          }
        }}
        title="Delete product?"
        description="This cannot be undone. Products with leads cannot be deleted."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (!deleting) {
            return
          }
          void deleteProduct(deleting.id)
            .then(() => toast.success("Product deleted."))
            .catch((error: unknown) => {
              toast.error(
                error instanceof Error ? error.message : "Could not delete."
              )
            })
        }}
      />
    </PageStack>
  )
}
