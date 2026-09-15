import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useInteractionValidation } from "@/hooks/use-interaction-validation"
import { nowIso } from "@/lib/dates"
import { db } from "@/lib/db"
import { createId } from "@/lib/ids"
import type { Company } from "@/lib/schema"

export function CompanyFormDialog({
  open,
  onOpenChange,
  company,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  company?: Company
}) {
  const { show, onBlur, setSubmitted, reset } = useInteractionValidation()
  const [name, setName] = React.useState("")
  const [website, setWebsite] = React.useState("")
  const [notes, setNotes] = React.useState("")

  React.useEffect(() => {
    if (!open) {
      return
    }
    reset()
    setName(company?.name ?? "")
    setWebsite(company?.website ?? "")
    setNotes(company?.notes ?? "")
  }, [open, company, reset])

  const nameInvalid = show("name") && name.trim() === ""

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (name.trim() === "") {
      return
    }
    const stamp = nowIso()
    if (company) {
      await db.companies.update(company.id, {
        name: name.trim(),
        website: website.trim() || undefined,
        notes: notes.trim(),
        updatedAt: stamp,
      })
      toast.success("Company updated.")
    } else {
      await db.companies.add({
        id: createId(),
        name: name.trim(),
        website: website.trim() || undefined,
        notes: notes.trim(),
        createdAt: stamp,
        updatedAt: stamp,
      })
      toast.success("Company created.")
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{company ? "Edit company" : "New company"}</DialogTitle>
          <DialogDescription>
            The organization you are talking to.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
          <FieldGroup>
            <Field data-invalid={nameInvalid || undefined}>
              <FieldLabel htmlFor="company-name">
                Name <span aria-hidden="true">*</span>
              </FieldLabel>
              <Input
                id="company-name"
                name="name"
                required
                autoComplete="organization"
                value={name}
                aria-invalid={nameInvalid || undefined}
                onBlur={onBlur("name")}
                onChange={(event) => setName(event.target.value)}
              />
              {nameInvalid ? <FieldError>Name is required.</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="company-website">Website</FieldLabel>
              <Input
                id="company-website"
                name="website"
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder="https://"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="company-notes">Notes</FieldLabel>
              <Textarea
                id="company-notes"
                name="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {company ? "Save company" : "Create company"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
