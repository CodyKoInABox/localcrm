import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { PlusIcon, SearchIcon, UsersIcon } from "lucide-react"
import { Link } from "react-router"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { ContactFormDialog } from "@/components/contact-form-dialog"
import { EntityEmpty, LoopHint } from "@/components/entity-empty"
import { PageHeader, PageSkeleton, PageStack } from "@/components/page-header"
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
import { db } from "@/lib/db"
import { byId } from "@/lib/maps"
import { deleteContact } from "@/lib/mutations"
import type { Contact } from "@/lib/schema"

export function ContactsPage() {
  const contacts = useLiveQuery(() => db.contacts.orderBy("name").toArray())
  const companies = useLiveQuery(() => db.companies.orderBy("name").toArray())
  const [query, setQuery] = React.useState("")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Contact | undefined>()
  const [deleting, setDeleting] = React.useState<Contact | undefined>()

  if (!contacts || !companies) {
    return <PageSkeleton />
  }

  const companyMap = byId(companies)
  const filtered = contacts.filter((contact) => {
    const hay = `${contact.name} ${contact.email ?? ""} ${contact.role ?? ""} ${companyMap.get(contact.companyId)?.name ?? ""}`.toLowerCase()
    return hay.includes(query.toLowerCase())
  })

  return (
    <PageStack>
      <PageHeader
        title="Contacts"
        description="People, usually under a company."
        actions={
          <Button
            onClick={() => setCreateOpen(true)}
            disabled={companies.length === 0}
          >
            <PlusIcon data-icon="inline-start" />
            New contact
          </Button>
        }
      />
      {companies.length === 0 ? (
        <EntityEmpty
          icon={UsersIcon}
          title="Add a company first"
          description="People live under a company. Create the org, then add people."
          actionLabel="Go to companies"
          actionTo="/companies"
        />
      ) : contacts.length === 0 ? (
        <EntityEmpty
          icon={UsersIcon}
          title="No people yet"
          description="Add the humans in the conversation, then open a lead."
          actionLabel="New contact"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <>
          <InputGroup className="max-w-sm">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search contacts"
              aria-label="Search contacts"
            />
          </InputGroup>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <Link
                      to={`/contacts/${contact.id}`}
                      className="font-medium hover:underline"
                    >
                      {contact.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {companyMap.get(contact.companyId)?.name ?? "—"}
                  </TableCell>
                  <TableCell>{contact.role || "—"}</TableCell>
                  <TableCell>{contact.email || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(contact)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleting(contact)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <LoopHint />
        </>
      )}
      <ContactFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companies={companies}
      />
      <ContactFormDialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(undefined)
          }
        }}
        contact={editing}
        companies={companies}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(undefined)
          }
        }}
        title="Delete contact?"
        description="They will be removed from any leads they are on."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (!deleting) {
            return
          }
          void deleteContact(deleting.id).then(() =>
            toast.success("Contact deleted.")
          )
        }}
      />
    </PageStack>
  )
}
