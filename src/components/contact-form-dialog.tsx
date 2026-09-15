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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useInteractionValidation } from "@/hooks/use-interaction-validation"
import { nowIso } from "@/lib/dates"
import { db } from "@/lib/db"
import { createId } from "@/lib/ids"
import type { Company, Contact } from "@/lib/schema"

export function ContactFormDialog({
  open,
  onOpenChange,
  contact,
  companies,
  lockCompanyId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact?: Contact
  companies: Company[]
  lockCompanyId?: string
}) {
  const { show, onBlur, setSubmitted, reset } = useInteractionValidation()
  const [name, setName] = React.useState("")
  const [companyId, setCompanyId] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [role, setRole] = React.useState("")
  const [notes, setNotes] = React.useState("")

  React.useEffect(() => {
    if (!open) {
      return
    }
    reset()
    setName(contact?.name ?? "")
    setCompanyId(contact?.companyId ?? lockCompanyId ?? "")
    setEmail(contact?.email ?? "")
    setPhone(contact?.phone ?? "")
    setRole(contact?.role ?? "")
    setNotes(contact?.notes ?? "")
  }, [open, contact, lockCompanyId, reset])

  const nameInvalid = show("name") && name.trim() === ""
  const companyInvalid = show("company") && companyId === ""

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (name.trim() === "" || companyId === "") {
      return
    }
    const stamp = nowIso()
    if (contact) {
      await db.contacts.update(contact.id, {
        name: name.trim(),
        companyId,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        role: role.trim() || undefined,
        notes: notes.trim(),
        updatedAt: stamp,
      })
      toast.success("Contact updated.")
    } else {
      await db.contacts.add({
        id: createId(),
        name: name.trim(),
        companyId,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        role: role.trim() || undefined,
        notes: notes.trim(),
        createdAt: stamp,
        updatedAt: stamp,
      })
      toast.success("Contact created.")
    }
    onOpenChange(false)
  }

  const companyLocked = Boolean(lockCompanyId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90dvh,44rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{contact ? "Edit contact" : "New contact"}</DialogTitle>
          <DialogDescription>
            A person, usually under a company.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
          <FieldGroup>
            <Field data-invalid={nameInvalid || undefined}>
              <FieldLabel htmlFor="contact-name">
                Name <span aria-hidden="true">*</span>
              </FieldLabel>
              <Input
                id="contact-name"
                name="name"
                required
                autoComplete="name"
                value={name}
                aria-invalid={nameInvalid || undefined}
                onBlur={onBlur("name")}
                onChange={(event) => setName(event.target.value)}
              />
              {nameInvalid ? <FieldError>Name is required.</FieldError> : null}
            </Field>
            <Field data-invalid={companyInvalid || undefined}>
              <FieldLabel htmlFor="contact-company">
                Company <span aria-hidden="true">*</span>
              </FieldLabel>
              <Select
                value={companyId}
                onValueChange={setCompanyId}
                disabled={companyLocked}
              >
                <SelectTrigger
                  id="contact-company"
                  className="w-full"
                  aria-invalid={companyInvalid || undefined}
                  onBlur={onBlur("company")}
                >
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {companyInvalid ? (
                <FieldError>Pick a company.</FieldError>
              ) : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="contact-role">Role</FieldLabel>
              <Input
                id="contact-role"
                name="role"
                autoComplete="organization-title"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="contact-email">Email</FieldLabel>
              <Input
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="contact-phone">Phone</FieldLabel>
              <Input
                id="contact-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="contact-notes">Notes</FieldLabel>
              <Textarea
                id="contact-notes"
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
              {contact ? "Save contact" : "Create contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
