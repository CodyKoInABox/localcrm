import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { Building2Icon, PlusIcon, SearchIcon } from "lucide-react"
import { Link } from "react-router"
import { toast } from "sonner"

import { CompanyFormDialog } from "@/components/company-form-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
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
import { deleteCompany } from "@/lib/mutations"
import type { Company } from "@/lib/schema"

export function CompaniesPage() {
  const companies = useLiveQuery(() => db.companies.orderBy("name").toArray())
  const contacts = useLiveQuery(() => db.contacts.toArray())
  const leads = useLiveQuery(() => db.leads.toArray())
  const [query, setQuery] = React.useState("")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Company | undefined>()
  const [deleting, setDeleting] = React.useState<Company | undefined>()

  if (!companies || !contacts || !leads) {
    return <PageSkeleton />
  }

  const filtered = companies.filter((company) =>
    company.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <PageStack>
      <PageHeader
        title="Companies"
        description="Organizations you sell to."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            New company
          </Button>
        }
      />
      {companies.length === 0 ? (
        <EntityEmpty
          icon={Building2Icon}
          title="No companies yet"
          description="Add the organization, then its people, then a lead on a product."
          actionLabel="New company"
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
              placeholder="Search companies"
              aria-label="Search companies"
            />
          </InputGroup>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>People</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <Link
                      to={`/companies/${company.id}`}
                      className="font-medium hover:underline"
                    >
                      {company.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {
                      contacts.filter((item) => item.companyId === company.id)
                        .length
                    }
                  </TableCell>
                  <TableCell>
                    {
                      leads.filter((item) => item.companyId === company.id)
                        .length
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(company)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleting(company)}
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
      <CompanyFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <CompanyFormDialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(undefined)
          }
        }}
        company={editing}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(undefined)
          }
        }}
        title="Delete company?"
        description="Companies with people or leads cannot be deleted."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (!deleting) {
            return
          }
          void deleteCompany(deleting.id)
            .then(() => toast.success("Company deleted."))
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
