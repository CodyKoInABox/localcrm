import * as React from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StageSelect } from "@/components/stage-select"
import { useInteractionValidation } from "@/hooks/use-interaction-validation"
import { DEFAULT_STAGE_IDS } from "@/lib/constants"
import { nowIso } from "@/lib/dates"
import { db } from "@/lib/db"
import { createId } from "@/lib/ids"
import type { Company, Contact, Product, Stage } from "@/lib/schema"

export function LeadFormDialog({
  open,
  onOpenChange,
  companies,
  products,
  contacts,
  stages,
  lockCompanyId,
  lockProductId,
  preselectedContactIds,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  companies: Company[]
  products: Product[]
  contacts: Contact[]
  stages: Stage[]
  lockCompanyId?: string
  lockProductId?: string
  preselectedContactIds?: string[]
}) {
  const navigate = useNavigate()
  const { show, onBlur, setSubmitted, reset } = useInteractionValidation()
  const [companyId, setCompanyId] = React.useState("")
  const [productId, setProductId] = React.useState("")
  const [stageId, setStageId] = React.useState<string>(
    DEFAULT_STAGE_IDS.new
  )
  const [contactIds, setContactIds] = React.useState<string[]>([])

  React.useEffect(() => {
    if (!open) {
      return
    }
    reset()
    const nextCompany = lockCompanyId ?? ""
    setCompanyId(nextCompany)
    setProductId(lockProductId ?? "")
    setStageId(
      stages.find((stage) => stage.id === DEFAULT_STAGE_IDS.new)?.id ??
        stages[0]?.id ??
        ""
    )
    const allowed = new Set(
      contacts
        .filter((contact) => contact.companyId === nextCompany)
        .map((contact) => contact.id)
    )
    setContactIds(
      (preselectedContactIds ?? []).filter((id) => allowed.has(id))
    )
  }, [
    open,
    lockCompanyId,
    lockProductId,
    contacts,
    stages,
    preselectedContactIds,
    reset,
  ])

  const companyContacts = contacts.filter(
    (contact) => contact.companyId === companyId
  )
  const companyInvalid = show("company") && companyId === ""
  const productInvalid = show("product") && productId === ""
  const stageInvalid = show("stage") && stageId === ""

  function toggleContact(id: string, checked: boolean) {
    setContactIds((current) =>
      checked ? [...current, id] : current.filter((item) => item !== id)
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (companyId === "" || productId === "" || stageId === "") {
      return
    }
    const stamp = nowIso()
    const id = createId()
    await db.leads.add({
      id,
      companyId,
      productId,
      contactIds,
      stageId,
      initiator: "me",
      theyReplied: false,
      lastToSend: "me",
      lastContactDate: null,
      howItsGoing: "",
      nextAction: "",
      nextActionDue: null,
      currentOfferAmount: null,
      currentOfferNote: "",
      createdAt: stamp,
      updatedAt: stamp,
    })
    toast.success("Lead created.")
    onOpenChange(false)
    navigate(`/leads/${id}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New lead</DialogTitle>
          <DialogDescription>
            One conversation: one company, one product, a pipeline stage.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
          <FieldGroup>
            <Field data-invalid={companyInvalid || undefined}>
              <FieldLabel htmlFor="lead-company">
                Company <span aria-hidden="true">*</span>
              </FieldLabel>
              <Select
                value={companyId}
                onValueChange={(value) => {
                  setCompanyId(value)
                  setContactIds([])
                }}
                disabled={Boolean(lockCompanyId)}
              >
                <SelectTrigger
                  id="lead-company"
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
            <Field data-invalid={productInvalid || undefined}>
              <FieldLabel htmlFor="lead-product">
                Product <span aria-hidden="true">*</span>
              </FieldLabel>
              <Select
                value={productId}
                onValueChange={setProductId}
                disabled={Boolean(lockProductId)}
              >
                <SelectTrigger
                  id="lead-product"
                  className="w-full"
                  aria-invalid={productInvalid || undefined}
                  onBlur={onBlur("product")}
                >
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {productInvalid ? (
                <FieldError>Pick a product.</FieldError>
              ) : null}
            </Field>
            <Field data-invalid={stageInvalid || undefined}>
              <FieldLabel htmlFor="lead-stage">
                Stage <span aria-hidden="true">*</span>
              </FieldLabel>
              <StageSelect
                id="lead-stage"
                value={stageId}
                onValueChange={setStageId}
                stages={stages}
                invalid={stageInvalid}
                includeHidden={false}
              />
              {stageInvalid ? <FieldError>Pick a stage.</FieldError> : null}
            </Field>
            <FieldSet>
              <FieldLegend variant="label">Involved people</FieldLegend>
              {companyId === "" ? (
                <p className="text-sm text-muted-foreground">
                  Pick a company to see its people.
                </p>
              ) : companyContacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No people on this company yet. You can add them later.
                </p>
              ) : (
                <FieldGroup className="gap-3">
                  {companyContacts.map((contact) => {
                    const checkboxId = `lead-contact-${contact.id}`
                    const checked = contactIds.includes(contact.id)
                    return (
                      <Field key={contact.id} orientation="horizontal">
                        <Checkbox
                          id={checkboxId}
                          checked={checked}
                          onCheckedChange={(value) =>
                            toggleContact(contact.id, value === true)
                          }
                        />
                        <FieldLabel htmlFor={checkboxId} className="font-normal">
                          {contact.name}
                          {contact.role ? ` · ${contact.role}` : ""}
                        </FieldLabel>
                      </Field>
                    )
                  })}
                </FieldGroup>
              )}
            </FieldSet>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create lead</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
