import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { HandshakeIcon, PlusIcon } from "lucide-react"
import { Link, useSearchParams } from "react-router"

import { EntityEmpty, LoopHint } from "@/components/entity-empty"
import { LeadChips } from "@/components/lead-chips"
import { LeadFormDialog } from "@/components/lead-form-dialog"
import { PageHeader, PageSkeleton, PageStack } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCurrency } from "@/hooks/use-currency"
import { deriveChips, orderedStages, stageById } from "@/lib/chips"
import { formatCalendarDate } from "@/lib/dates"
import { db } from "@/lib/db"
import { byId, leadLabel } from "@/lib/maps"
import { formatMoney } from "@/lib/money"

export function LeadsPage() {
  const currency = useCurrency()
  const [params, setParams] = useSearchParams()
  const leads = useLiveQuery(() => db.leads.toArray())
  const products = useLiveQuery(() => db.products.orderBy("name").toArray())
  const companies = useLiveQuery(() => db.companies.orderBy("name").toArray())
  const contacts = useLiveQuery(() => db.contacts.toArray())
  const stages = useLiveQuery(() => db.stages.toArray())
  const [createOpen, setCreateOpen] = React.useState(false)

  if (!leads || !products || !companies || !contacts || !stages) {
    return <PageSkeleton />
  }

  const productFilter = params.get("product") ?? "all"
  const stageFilter = params.get("stage") ?? "all"
  const awaitingOnly = params.get("awaiting") === "1"
  const overdueOnly = params.get("overdue") === "1"

  const productMap = byId(products)
  const companyMap = byId(companies)

  const filtered = leads.filter((lead) => {
    if (productFilter !== "all" && lead.productId !== productFilter) {
      return false
    }
    if (stageFilter !== "all" && lead.stageId !== stageFilter) {
      return false
    }
    const chips = deriveChips(lead)
    if (awaitingOnly && !chips.awaitingReply) {
      return false
    }
    if (overdueOnly && !chips.overdue) {
      return false
    }
    return true
  })

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value === "all" || value === "0") {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    setParams(next, { replace: true })
  }

  return (
    <PageStack>
      <PageHeader
        title="Leads"
        description="One conversation: company + people + one product + stage."
        actions={
          <Button
            onClick={() => setCreateOpen(true)}
            disabled={products.length === 0 || companies.length === 0}
          >
            <PlusIcon data-icon="inline-start" />
            New lead
          </Button>
        }
      />
      {products.length === 0 || companies.length === 0 ? (
        <EntityEmpty
          icon={HandshakeIcon}
          title="Need a product and a company first"
          description="A lead is one conversation about one product with one company."
          actionLabel={products.length === 0 ? "Add a product" : "Add a company"}
          actionTo={products.length === 0 ? "/products" : "/companies"}
        />
      ) : leads.length === 0 ? (
        <EntityEmpty
          icon={HandshakeIcon}
          title="No leads yet"
          description="Open a conversation, then capture comms and what they will pay."
          actionLabel="New lead"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <>
          <FieldGroup>
            <Field className="w-48">
              <FieldLabel>Product</FieldLabel>
              <Select
                value={productFilter}
                onValueChange={(value) => updateParam("product", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All products</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field className="w-48">
              <FieldLabel>Stage</FieldLabel>
              <Select
                value={stageFilter}
                onValueChange={(value) => updateParam("stage", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All stages</SelectItem>
                    {orderedStages(stages).map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field orientation="horizontal" className="w-auto">
              <Checkbox
                id="filter-awaiting"
                checked={awaitingOnly}
                onCheckedChange={(value) =>
                  updateParam("awaiting", value === true ? "1" : "0")
                }
              />
              <FieldLabel htmlFor="filter-awaiting" className="font-normal">
                Awaiting reply
              </FieldLabel>
            </Field>
            <Field orientation="horizontal" className="w-auto">
              <Checkbox
                id="filter-overdue"
                checked={overdueOnly}
                onCheckedChange={(value) =>
                  updateParam("overdue", value === true ? "1" : "0")
                }
              />
              <FieldLabel htmlFor="filter-overdue" className="font-normal">
                Overdue
              </FieldLabel>
            </Field>
          </FieldGroup>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conversation</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Offer</TableHead>
                <TableHead>Next action</TableHead>
                <TableHead>Chips</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lead) => {
                const chips = deriveChips(lead)
                return (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Link
                        to={`/leads/${lead.id}`}
                        className="font-medium hover:underline"
                      >
                        {leadLabel(
                          companyMap.get(lead.companyId)?.name,
                          productMap.get(lead.productId)?.name
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {stageById(stages, lead.stageId)?.name ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {lead.currentOfferAmount == null
                        ? "—"
                        : formatMoney(lead.currentOfferAmount, currency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span>{lead.nextAction || "—"}</span>
                        <span className="text-xs text-muted-foreground">
                          {lead.nextActionDue
                            ? formatCalendarDate(lead.nextActionDue)
                            : ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <LeadChips chips={chips} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No leads match these filters.
            </p>
          ) : null}
          <LoopHint />
        </>
      )}
      <LeadFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companies={companies}
        products={products}
        contacts={contacts}
        stages={stages}
      />
    </PageStack>
  )
}
