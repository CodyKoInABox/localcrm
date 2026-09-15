import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { PlusIcon, UsersIcon } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router"
import { toast } from "sonner"

import { AppBreadcrumb } from "@/components/app-breadcrumb"
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
import { deleteContact } from "@/lib/mutations"

export function ContactDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const contact = useLiveQuery(
    async () => (id ? (await db.contacts.get(id)) ?? null : null),
    [id]
  )
  const companies = useLiveQuery(() => db.companies.toArray())
  const products = useLiveQuery(() => db.products.toArray())
  const stages = useLiveQuery(() => db.stages.toArray())
  const contacts = useLiveQuery(() => db.contacts.toArray())
  const leads = useLiveQuery(() => db.leads.toArray())
  const [editOpen, setEditOpen] = React.useState(false)
  const [leadOpen, setLeadOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  if (
    contact === undefined ||
    !companies ||
    !products ||
    !stages ||
    !contacts ||
    !leads
  ) {
    return <PageSkeleton />
  }

  if (!contact) {
    return (
      <EntityEmpty
        icon={UsersIcon}
        title="Contact not found"
        description="It may have been deleted."
        actionLabel="Back to contacts"
        actionTo="/contacts"
      />
    )
  }

  const company = byId(companies).get(contact.companyId)
  const involved = leads.filter((lead) => lead.contactIds.includes(contact.id))
  const productMap = byId(products)

  return (
    <PageStack>
      <AppBreadcrumb
        items={[
          { label: "Contacts", to: "/contacts" },
          { label: contact.name },
        ]}
      />
      <PageHeader
        title={contact.name}
        description={contact.role || contact.email || "Person in the deal."}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button onClick={() => setLeadOpen(true)}>
              <PlusIcon data-icon="inline-start" />
              New lead
            </Button>
          </>
        }
      />
      <div className="flex flex-wrap gap-2 text-sm">
        {company ? (
          <Link to={`/companies/${company.id}`} className="hover:underline">
            {company.name}
          </Link>
        ) : (
          <span>No company</span>
        )}
        {contact.email ? (
          <a className="text-muted-foreground" href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
        ) : null}
        {contact.phone ? (
          <a className="text-muted-foreground" href={`tel:${contact.phone}`}>
            {contact.phone}
          </a>
        ) : null}
      </div>
      {contact.notes ? (
        <p className="text-sm text-muted-foreground">{contact.notes}</p>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Leads</CardTitle>
          <CardDescription>
            Conversations this person is involved in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {involved.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Not on any leads yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {involved.map((lead) => (
                <li key={lead.id}>
                  <Link
                    to={`/leads/${lead.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <span className="font-medium">
                      {productMap.get(lead.productId)?.name ?? "Product"}
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
        Delete contact
      </Button>
      <ContactFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        contact={contact}
        companies={companies}
      />
      <LeadFormDialog
        open={leadOpen}
        onOpenChange={setLeadOpen}
        companies={companies}
        products={products}
        contacts={contacts}
        stages={stages}
        lockCompanyId={contact.companyId}
        preselectedContactIds={[contact.id]}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete contact?"
        description="They will be removed from any leads they are on."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          void deleteContact(contact.id).then(() => {
            toast.success("Contact deleted.")
            navigate("/contacts")
          })
        }}
      />
    </PageStack>
  )
}
