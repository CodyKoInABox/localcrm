import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { PackageIcon, PlusIcon } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router"
import { toast } from "sonner"

import { AppBreadcrumb } from "@/components/app-breadcrumb"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EntityEmpty } from "@/components/entity-empty"
import { EntityRow } from "@/components/entity-row"
import { LeadChips } from "@/components/lead-chips"
import { LeadFormDialog } from "@/components/lead-form-dialog"
import { DataPanel, MoreMenu } from "@/components/more-menu"
import { PageHeader, PageSkeleton, PageStack } from "@/components/page-header"
import { ProductFormDialog } from "@/components/product-form-dialog"
import { ProductStatusBadge } from "@/components/product-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCurrency } from "@/hooks/use-currency"
import { deriveChips, stageById } from "@/lib/chips"
import { formatCalendarDate } from "@/lib/dates"
import { db } from "@/lib/db"
import { byId } from "@/lib/maps"
import { formatMoney, formatPercent, percentOfAsk } from "@/lib/money"
import { deleteProduct } from "@/lib/mutations"

export function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currency = useCurrency()
  const product = useLiveQuery(
    async () => (id ? (await db.products.get(id)) ?? null : null),
    [id]
  )
  const companies = useLiveQuery(() => db.companies.toArray())
  const contacts = useLiveQuery(() => db.contacts.toArray())
  const stages = useLiveQuery(() => db.stages.toArray())
  const leads = useLiveQuery(
    () => (id ? db.leads.where("productId").equals(id).toArray() : []),
    [id]
  )
  const [editOpen, setEditOpen] = React.useState(false)
  const [leadOpen, setLeadOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  if (product === undefined || !companies || !contacts || !stages || !leads) {
    return <PageSkeleton />
  }

  if (!product) {
    return (
      <EntityEmpty
        icon={PackageIcon}
        title="Product not found"
        description="It may have been deleted."
        actionLabel="Back to products"
        actionTo="/products"
      />
    )
  }

  const companyMap = byId(companies)
  const ranked = leads
    .filter((lead) => lead.currentOfferAmount != null)
    .map((lead) => ({
      lead,
      company: companyMap.get(lead.companyId),
      stage: stageById(stages, lead.stageId),
      amount: lead.currentOfferAmount ?? 0,
      pct: percentOfAsk(lead.currentOfferAmount ?? 0, product.askingPrice),
    }))
    .sort((a, b) => b.amount - a.amount)

  return (
    <PageStack>
      <AppBreadcrumb
        items={[
          { label: "Products", to: "/products" },
          { label: product.name },
        ]}
      />
      <PageHeader
        title={product.name}
        description={product.notes || "Competing current offers vs asking."}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button onClick={() => setLeadOpen(true)}>
              <PlusIcon data-icon="inline-start" />
              New lead
            </Button>
            <MoreMenu
              items={[
                {
                  label: "Delete product",
                  destructive: true,
                  onSelect: () => setDeleteOpen(true),
                },
              ]}
            />
          </>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <ProductStatusBadge status={product.status} />
        <Badge variant="outline">
          Asking {formatMoney(product.askingPrice, currency)}
        </Badge>
        {product.location ? (
          <Badge variant="secondary">{product.location}</Badge>
        ) : null}
        {product.sku ? <Badge variant="outline">{product.sku}</Badge> : null}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Competing offers</CardTitle>
          <CardDescription>
            Current amounts only. History lives on each lead.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ranked.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No current offers yet. Open a lead and record what they will pay.
            </p>
          ) : (
            <DataPanel>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>% of ask</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Last contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranked.map((row, index) => (
                  <TableRow key={row.lead.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Link
                        to={`/leads/${row.lead.id}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {row.company?.name ?? "Unknown"}
                      </Link>
                      <div className="mt-1">
                        <LeadChips chips={deriveChips(row.lead)} />
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatMoney(row.amount, currency)}
                    </TableCell>
                    <TableCell>
                      {row.pct == null ? "—" : formatPercent(row.pct)}
                    </TableCell>
                    <TableCell>
                      {row.stage ? (
                        <Badge variant="outline">{row.stage.name}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {row.lead.lastContactDate
                        ? formatCalendarDate(row.lead.lastContactDate)
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </DataPanel>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>All leads</CardTitle>
          <CardDescription>
            Every conversation on this product, including those without an offer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No leads yet. Create one from here.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {leads.map((lead) => (
                <li key={lead.id}>
                  <EntityRow
                    to={`/leads/${lead.id}`}
                    title={companyMap.get(lead.companyId)?.name ?? "Unknown"}
                    meta={stageById(stages, lead.stageId)?.name}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <ProductFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        product={product}
      />
      <LeadFormDialog
        open={leadOpen}
        onOpenChange={setLeadOpen}
        companies={companies}
        products={[product]}
        contacts={contacts}
        stages={stages}
        lockProductId={product.id}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete product?"
        description="Products with leads cannot be deleted."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          void deleteProduct(product.id)
            .then(() => {
              toast.success("Product deleted.")
              navigate("/products")
            })
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
