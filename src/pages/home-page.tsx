import {
  Building2Icon,
  HandshakeIcon,
  PackageIcon,
  PlusIcon,
} from "lucide-react"
import { Link } from "react-router"
import { useLiveQuery } from "dexie-react-hooks"

import { EntityEmpty, LoopHint } from "@/components/entity-empty"
import { LeadChips } from "@/components/lead-chips"
import { PageHeader, PageSkeleton, PageStack } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useCurrency } from "@/hooks/use-currency"
import { deriveChips, isOpenLead, stageById } from "@/lib/chips"
import { db } from "@/lib/db"
import { leadLabel, byId } from "@/lib/maps"
import { formatMoney, formatPercent, percentOfAsk } from "@/lib/money"
import { loadSampleData } from "@/lib/sample-data"
import { toast } from "sonner"

export function HomePage() {
  const currency = useCurrency()
  const products = useLiveQuery(() => db.products.toArray())
  const companies = useLiveQuery(() => db.companies.toArray())
  const leads = useLiveQuery(() => db.leads.toArray())
  const stages = useLiveQuery(() => db.stages.toArray())

  if (!products || !companies || !leads || !stages) {
    return <PageSkeleton />
  }

  const productMap = byId(products)
  const companyMap = byId(companies)
  const openLeads = leads.filter((lead) => isOpenLead(lead, stages))
  const withChips = openLeads.map((lead) => ({
    lead,
    chips: deriveChips(lead),
  }))

  const overdue = withChips.filter((row) => row.chips.overdue)
  const dueToday = withChips.filter((row) => row.chips.dueToday)
  const awaiting = withChips.filter((row) => row.chips.awaitingReply)
  const stale = withChips.filter((row) => row.chips.stale)

  const topOffers = openLeads
    .filter((lead) => lead.currentOfferAmount != null)
    .map((lead) => {
      const product = productMap.get(lead.productId)
      const ask = product?.askingPrice ?? 0
      const amount = lead.currentOfferAmount ?? 0
      return {
        lead,
        product,
        company: companyMap.get(lead.companyId),
        amount,
        pct: percentOfAsk(amount, ask),
      }
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6)

  const empty = products.length === 0 && companies.length === 0 && leads.length === 0

  async function handleSample() {
    await loadSampleData()
    toast.success("Sample data loaded.")
  }

  return (
    <PageStack>
      <PageHeader
        title="Home"
        description="What needs a reply, what's due, and where the money sits."
        actions={
          empty ? (
            <Button variant="outline" onClick={() => void handleSample()}>
              Load sample data
            </Button>
          ) : null
        }
      />
      {empty ? (
        <EntityEmpty
          icon={HandshakeIcon}
          title="Nothing in this browser yet"
          description="Start with a product, add a company and people, open a lead, then capture what they'll pay."
          actionLabel="Add a product"
          actionTo="/products"
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <HomeList
            title="Overdue"
            description="Next action date has passed."
            rows={overdue}
            companies={companyMap}
            products={productMap}
            empty="No overdue next actions."
          />
          <HomeList
            title="Due today"
            description="Next action is today."
            rows={dueToday}
            companies={companyMap}
            products={productMap}
            empty="Nothing due today."
          />
          <HomeList
            title="Awaiting reply"
            description="You initiated or you last sent, and they haven't replied."
            rows={awaiting}
            companies={companyMap}
            products={productMap}
            empty="Nobody is waiting on a reply."
          />
          <HomeList
            title="Stale"
            description="No last contact in 14 days."
            rows={stale}
            companies={companyMap}
            products={productMap}
            empty="No stale conversations."
          />
        </div>
      )}
      {!empty ? (
        <Card>
          <CardHeader>
            <CardTitle>Top open offers vs asking</CardTitle>
            <CardDescription>
              Current bids on open leads, highest first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topOffers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No current offers yet. Capture an amount on a lead.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {topOffers.map((row) => {
                  const stage = stageById(stages, row.lead.stageId)
                  return (
                    <li key={row.lead.id}>
                      <Link
                        to={`/leads/${row.lead.id}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 hover:bg-muted/50"
                      >
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="truncate font-medium">
                            {leadLabel(row.company?.name, row.product?.name)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatMoney(row.amount, currency)}
                            {row.product
                              ? ` of ${formatMoney(row.product.askingPrice, currency)}`
                              : ""}
                            {row.pct != null ? ` · ${formatPercent(row.pct)} of ask` : ""}
                          </span>
                        </div>
                        {stage ? (
                          <Badge variant="outline">{stage.name}</Badge>
                        ) : null}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <LoopHint />
        <Button variant="outline" size="sm" asChild>
          <Link to="/products">
            <PackageIcon data-icon="inline-start" />
            Products
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/companies">
            <Building2Icon data-icon="inline-start" />
            Companies
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/leads">
            <PlusIcon data-icon="inline-start" />
            Leads
          </Link>
        </Button>
      </div>
    </PageStack>
  )
}

function HomeList({
  title,
  description,
  rows,
  companies,
  products,
  empty,
}: {
  title: string
  description: string
  rows: { lead: { id: string; companyId: string; productId: string }; chips: ReturnType<typeof deriveChips> }[]
  companies: Map<string, { name: string }>
  products: Map<string, { name: string }>
  empty: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {title}{" "}
          <Badge variant="secondary">{rows.length}</Badge>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.slice(0, 8).map((row) => (
              <li key={row.lead.id}>
                <Link
                  to={`/leads/${row.lead.id}`}
                  className="flex flex-col gap-1.5 rounded-lg border p-3 hover:bg-muted/50"
                >
                  <span className="truncate text-sm font-medium">
                    {leadLabel(
                      companies.get(row.lead.companyId)?.name,
                      products.get(row.lead.productId)?.name
                    )}
                  </span>
                  <LeadChips chips={row.chips} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
