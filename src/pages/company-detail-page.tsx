import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { Building2Icon, PlusIcon } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router"
import { toast } from "sonner"

import { AppBreadcrumb } from "@/components/app-breadcrumb"
import { CompanyFormDialog } from "@/components/company-form-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { ContactFormDialog } from "@/components/contact-form-dialog"
import { EntityEmpty } from "@/components/entity-empty"
import { LeadFormDialog } from "@/components/lead-form-dialog"
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
import { stageById } from "@/lib/chips"
import { db } from "@/lib/db"
import { byId } from "@/lib/maps"
import { deleteCompany } from "@/lib/mutations"

export function CompanyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const company = useLiveQuery(
    async () => (id ? (await db.companies.get(id)) ?? null : null),
    [id]
  )
  const people = useLiveQuery(
    () => (id ? db.contacts.where("companyId").equals(id).toArray() : []),
    [id]
  )
  const leads = useLiveQuery(
    () => (id ? db.leads.where("companyId").equals(id).toArray() : []),
    [id]
  )
  const products = useLiveQuery(() => db.products.toArray())
  const stages = useLiveQuery(() => db.stages.toArray())
  const companies = useLiveQuery(() => db.companies.toArray())
  const contacts = useLiveQuery(() => db.contacts.toArray())
  const [editOpen, setEditOpen] = React.useState(false)
  const [personOpen, setPersonOpen] = React.useState(false)
  const [leadOpen, setLeadOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  if (
    company === undefined ||
    !people ||
    !leads ||
    !products ||
    !stages ||
    !companies ||
    !contacts
  ) {
    return <PageSkeleton />
  }

  if (!company) {
    return (
      <EntityEmpty
        icon={Building2Icon}
        title="Company not found"
        description="It may have been deleted."
        actionLabel="Back to companies"
        actionTo="/companies"
      />
    )
  }

  const productMap = byId(products)

  return (
    <PageStack>
      <AppBreadcrumb
        items={[
          { label: "Companies", to: "/companies" },
          { label: company.name },
        ]}
      />
      <PageHeader
        title={company.name}
        description={company.notes || "People and leads for this organization."}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button variant="outline" onClick={() => setPersonOpen(true)}>
              <PlusIcon data-icon="inline-start" />
              Add person
            </Button>
            <Button onClick={() => setLeadOpen(true)}>
              <PlusIcon data-icon="inline-start" />
              New lead
            </Button>
          </>
        }
      />
      {company.website ? (
        <a
          href={company.website}
          className="text-sm text-primary underline-offset-4 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          {company.website}
        </a>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>People</CardTitle>
          <CardDescription>Contacts under this company.</CardDescription>
        </CardHeader>
        <CardContent>
          {people.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No people yet. Add someone before you lose the thread.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {people.map((person) => (
                <li key={person.id}>
                  <Link
                    to={`/contacts/${person.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <span className="font-medium">{person.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {person.role || person.email || "—"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Leads</CardTitle>
          <CardDescription>
            One lead per product conversation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leads yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {leads.map((lead) => (
                <li key={lead.id}>
                  <Link
                    to={`/leads/${lead.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <span className="font-medium">
                      {productMap.get(lead.productId)?.name ?? "Unknown product"}
                    </span>
                    <Badge variant="outline">
                      {stageById(stages, lead.stageId)?.name ?? "Stage"}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Button variant="ghost" onClick={() => setDeleteOpen(true)}>
        Delete company
      </Button>
      <CompanyFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        company={company}
      />
      <ContactFormDialog
        open={personOpen}
        onOpenChange={setPersonOpen}
        companies={companies}
        lockCompanyId={company.id}
      />
      <LeadFormDialog
        open={leadOpen}
        onOpenChange={setLeadOpen}
        companies={companies}
        products={products}
        contacts={contacts}
        stages={stages}
        lockCompanyId={company.id}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete company?"
        description="Companies with people or leads cannot be deleted."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          void deleteCompany(company.id)
            .then(() => {
              toast.success("Company deleted.")
              navigate("/companies")
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
