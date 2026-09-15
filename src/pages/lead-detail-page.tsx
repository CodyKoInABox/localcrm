import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { HandshakeIcon } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router"
import { toast } from "sonner"

import { AppBreadcrumb } from "@/components/app-breadcrumb"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EntityEmpty } from "@/components/entity-empty"
import { LeadChips } from "@/components/lead-chips"
import { MoneyInput } from "@/components/money-input"
import { PageHeader, PageSkeleton, PageStack } from "@/components/page-header"
import { StageSelect } from "@/components/stage-select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { useCurrency } from "@/hooks/use-currency"
import { deriveChips } from "@/lib/chips"
import { formatCalendarDate, nowIso } from "@/lib/dates"
import { db } from "@/lib/db"
import { formatMoney } from "@/lib/money"
import { parseMoneyInput } from "@/lib/money"
import { applyOfferAmount, deleteLead } from "@/lib/mutations"
import type { Party } from "@/lib/schema"

export function LeadDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currency = useCurrency()
  const lead = useLiveQuery(
    async () => (id ? (await db.leads.get(id)) ?? null : null),
    [id]
  )
  const stages = useLiveQuery(() => db.stages.toArray())
  const company = useLiveQuery(
    () => (lead ? db.companies.get(lead.companyId) : undefined),
    [lead?.companyId]
  )
  const product = useLiveQuery(
    () => (lead ? db.products.get(lead.productId) : undefined),
    [lead?.productId]
  )
  const contacts = useLiveQuery(
    () => (lead ? db.contacts.where("companyId").equals(lead.companyId).toArray() : []),
    [lead?.companyId]
  )
  const history = useLiveQuery(
    () => (id ? db.offerHistory.where("leadId").equals(id).toArray() : []),
    [id]
  )
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [offerInput, setOfferInput] = React.useState("")
  const [offerNote, setOfferNote] = React.useState("")
  const [offerTried, setOfferTried] = React.useState(false)

  React.useEffect(() => {
    if (!lead) {
      return
    }
    setOfferInput(
      lead.currentOfferAmount == null ? "" : String(lead.currentOfferAmount)
    )
    setOfferNote(lead.currentOfferNote)
    setOfferTried(false)
  }, [lead?.id, lead?.currentOfferAmount, lead?.currentOfferNote])

  if (lead === undefined || !stages || !history) {
    return <PageSkeleton />
  }

  if (!lead) {
    return (
      <EntityEmpty
        icon={HandshakeIcon}
        title="Lead not found"
        description="It may have been deleted."
        actionLabel="Back to leads"
        actionTo="/leads"
      />
    )
  }

  const chips = deriveChips(lead)
  const current = lead
  const companyPeople = contacts ?? []
  const parsedOffer = parseMoneyInput(offerInput)
  const offerInvalid =
    offerTried && offerInput.trim() !== "" && parsedOffer == null

  async function patch(partial: Partial<typeof current>) {
    await db.leads.update(current.id, { ...partial, updatedAt: nowIso() })
  }

  async function saveOffer(event: React.FormEvent) {
    event.preventDefault()
    setOfferTried(true)
    if (offerInput.trim() === "") {
      await applyOfferAmount(current, null, offerNote.trim())
      toast.success("Offer cleared.")
      return
    }
    if (parsedOffer == null || parsedOffer < 0) {
      return
    }
    await applyOfferAmount(current, parsedOffer, offerNote.trim())
    toast.success("Offer saved.")
  }

  const sortedHistory = [...history].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0
  )

  return (
    <PageStack>
      <AppBreadcrumb
        items={[
          { label: "Leads", to: "/leads" },
          {
            label: `${company?.name ?? "Company"} · ${product?.name ?? "Product"}`,
          },
        ]}
      />
      <PageHeader
        title={company?.name ?? "Lead"}
        description={
          product
            ? `Talking about ${product.name}. Asking ${formatMoney(product.askingPrice, currency)}.`
            : "Workspace for this conversation."
        }
        actions={
          <div className="w-56">
            <StageSelect
              value={lead.stageId}
              onValueChange={(value) => void patch({ stageId: value })}
              stages={stages}
            />
          </div>
        }
      />
      <LeadChips chips={chips} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Comms</CardTitle>
            <CardDescription>
              No message log. These fields are the whole picture.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldTitle>Initiator</FieldTitle>
                <ToggleGroup
                  type="single"
                  value={lead.initiator}
                  onValueChange={(value) => {
                    if (value) {
                      void patch({ initiator: value as Party })
                    }
                  }}
                  spacing={2}
                  aria-label="Who initiated"
                >
                  <ToggleGroupItem value="me">Me</ToggleGroupItem>
                  <ToggleGroupItem value="them">Them</ToggleGroupItem>
                </ToggleGroup>
              </Field>
              <Field>
                <FieldTitle>They replied</FieldTitle>
                <ToggleGroup
                  type="single"
                  value={lead.theyReplied ? "yes" : "no"}
                  onValueChange={(value) => {
                    if (value) {
                      void patch({ theyReplied: value === "yes" })
                    }
                  }}
                  spacing={2}
                  aria-label="Have they replied"
                >
                  <ToggleGroupItem value="yes">Yes</ToggleGroupItem>
                  <ToggleGroupItem value="no">No</ToggleGroupItem>
                </ToggleGroup>
              </Field>
              <Field>
                <FieldTitle>Last to send</FieldTitle>
                <ToggleGroup
                  type="single"
                  value={lead.lastToSend}
                  onValueChange={(value) => {
                    if (value) {
                      void patch({ lastToSend: value as Party })
                    }
                  }}
                  spacing={2}
                  aria-label="Who last sent"
                >
                  <ToggleGroupItem value="me">Me</ToggleGroupItem>
                  <ToggleGroupItem value="them">Them</ToggleGroupItem>
                </ToggleGroup>
              </Field>
              <Field>
                <FieldLabel htmlFor="last-contact">Last contact date</FieldLabel>
                <FieldDescription>
                  Calendar date, not a timestamp.
                </FieldDescription>
                <Input
                  id="last-contact"
                  type="date"
                  value={lead.lastContactDate ?? ""}
                  onChange={(event) => {
                    const value = event.target.value
                    void patch({ lastContactDate: value === "" ? null : value })
                  }}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="how-going">How it&apos;s going</FieldLabel>
                <Textarea
                  id="how-going"
                  defaultValue={lead.howItsGoing}
                  key={`${lead.id}-notes`}
                  onBlur={(event) => {
                    const value = event.target.value
                    if (value !== lead.howItsGoing) {
                      void patch({ howItsGoing: value })
                    }
                  }}
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Next action</CardTitle>
            <CardDescription>
              Due date is a calendar date in this browser.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="next-action">Action</FieldLabel>
                <Input
                  id="next-action"
                  defaultValue={lead.nextAction}
                  key={`${lead.id}-action`}
                  onBlur={(event) => {
                    const value = event.target.value
                    if (value !== lead.nextAction) {
                      void patch({ nextAction: value })
                    }
                  }}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="next-due">Due date</FieldLabel>
                <Input
                  id="next-due"
                  type="date"
                  value={lead.nextActionDue ?? ""}
                  onChange={(event) => {
                    const value = event.target.value
                    void patch({ nextActionDue: value === "" ? null : value })
                  }}
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Current offer</CardTitle>
          <CardDescription>
            Changing the amount appends history. Product ranking uses this
            current number.
          </CardDescription>
        </CardHeader>
        <form onSubmit={(event) => void saveOffer(event)}>
          <CardContent>
            <FieldGroup>
              <Field data-invalid={offerInvalid || undefined}>
                <FieldLabel htmlFor="offer-amount">Amount they will pay</FieldLabel>
                <MoneyInput
                  id="offer-amount"
                  value={offerInput}
                  onChange={setOfferInput}
                  currency={currency}
                  invalid={offerInvalid}
                />
                {offerInvalid ? (
                  <FieldError>Enter a valid amount, or leave blank.</FieldError>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="offer-note">Note</FieldLabel>
                <Input
                  id="offer-note"
                  value={offerNote}
                  onChange={(event) => setOfferNote(event.target.value)}
                />
              </Field>
            </FieldGroup>
            {sortedHistory.length > 0 ? (
              <div className="mt-4 flex flex-col gap-2">
                <p className="text-sm font-medium">History</p>
                <ul className="flex flex-col gap-2">
                  {sortedHistory.map((row) => (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                    >
                      <span>{formatMoney(row.amount, currency)}</span>
                      <span className="text-muted-foreground">
                        {formatCalendarDate(row.date)}
                        {row.note ? ` · ${row.note}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No prior amounts.
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit">Save offer</Button>
          </CardFooter>
        </form>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Linked people</CardTitle>
          <CardDescription>
            {company ? (
              <>
                From{" "}
                <Link to={`/companies/${company.id}`} className="underline-offset-4 hover:underline">
                  {company.name}
                </Link>
              </>
            ) : (
              "Company people"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companyPeople.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No people on this company yet.
            </p>
          ) : (
            <FieldSet>
              <FieldLegend variant="label">Involved</FieldLegend>
              <FieldGroup className="gap-3">
                {companyPeople.map((person) => {
                  const checkboxId = `involved-${person.id}`
                  const checked = lead.contactIds.includes(person.id)
                  return (
                    <Field key={person.id} orientation="horizontal">
                      <Checkbox
                        id={checkboxId}
                        checked={checked}
                        onCheckedChange={(value) => {
                          const next = value === true
                            ? [...lead.contactIds, person.id]
                            : lead.contactIds.filter((item) => item !== person.id)
                          void patch({ contactIds: next })
                        }}
                      />
                      <FieldLabel htmlFor={checkboxId} className="font-normal">
                        <Link to={`/contacts/${person.id}`} className="hover:underline">
                          {person.name}
                        </Link>
                        {person.role ? ` · ${person.role}` : ""}
                      </FieldLabel>
                    </Field>
                  )
                })}
              </FieldGroup>
            </FieldSet>
          )}
        </CardContent>
      </Card>
      {product ? (
        <p className="text-sm text-muted-foreground">
          See competing bids on{" "}
          <Link to={`/products/${product.id}`} className="underline-offset-4 hover:underline">
            {product.name}
          </Link>
          .
        </p>
      ) : null}
      <Button variant="ghost" onClick={() => setDeleteOpen(true)}>
        Delete lead
      </Button>
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete lead?"
        description="Offer history for this conversation will be deleted too."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          void deleteLead(lead.id).then(() => {
            toast.success("Lead deleted.")
            navigate("/leads")
          })
        }}
      />
    </PageStack>
  )
}
