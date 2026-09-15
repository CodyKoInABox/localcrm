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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { MoneyInput } from "@/components/money-input"
import { useCurrency } from "@/hooks/use-currency"
import { useInteractionValidation } from "@/hooks/use-interaction-validation"
import { PRODUCT_STATUSES } from "@/lib/constants"
import { nowIso } from "@/lib/dates"
import { db } from "@/lib/db"
import { createId } from "@/lib/ids"
import { parseMoneyInput } from "@/lib/money"
import type { Product, ProductStatus } from "@/lib/schema"

const STATUS_LABELS: Record<ProductStatus, string> = {
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
  withdrawn: "Withdrawn",
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product
}) {
  const currency = useCurrency()
  const { show, onBlur, setSubmitted, reset } = useInteractionValidation()
  const [name, setName] = React.useState("")
  const [price, setPrice] = React.useState("")
  const [status, setStatus] = React.useState<ProductStatus>("available")
  const [location, setLocation] = React.useState("")
  const [sku, setSku] = React.useState("")
  const [notes, setNotes] = React.useState("")

  React.useEffect(() => {
    if (!open) {
      return
    }
    reset()
    setName(product?.name ?? "")
    setPrice(product ? String(product.askingPrice) : "")
    setStatus(product?.status ?? "available")
    setLocation(product?.location ?? "")
    setSku(product?.sku ?? "")
    setNotes(product?.notes ?? "")
  }, [open, product, reset])

  const parsedPrice = parseMoneyInput(price)
  const nameInvalid = show("name") && name.trim() === ""
  const priceInvalid =
    show("price") && (parsedPrice == null || parsedPrice < 0)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (name.trim() === "" || parsedPrice == null || parsedPrice < 0) {
      return
    }
    const stamp = nowIso()
    if (product) {
      await db.products.update(product.id, {
        name: name.trim(),
        askingPrice: parsedPrice,
        status,
        location: location.trim() || undefined,
        sku: sku.trim() || undefined,
        notes: notes.trim(),
        updatedAt: stamp,
      })
      toast.success("Product updated.")
    } else {
      await db.products.add({
        id: createId(),
        name: name.trim(),
        askingPrice: parsedPrice,
        status,
        location: location.trim() || undefined,
        sku: sku.trim() || undefined,
        notes: notes.trim(),
        createdAt: stamp,
        updatedAt: stamp,
      })
      toast.success("Product created.")
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90dvh,44rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "New product"}</DialogTitle>
          <DialogDescription>
            What you sell. Asking price is the comparison baseline.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
          <FieldGroup>
            <Field data-invalid={nameInvalid || undefined}>
              <FieldLabel htmlFor="product-name">
                Name <span aria-hidden="true">*</span>
              </FieldLabel>
              <Input
                id="product-name"
                name="name"
                required
                autoComplete="off"
                value={name}
                aria-invalid={nameInvalid || undefined}
                onBlur={onBlur("name")}
                onChange={(event) => setName(event.target.value)}
              />
              {nameInvalid ? <FieldError>Name is required.</FieldError> : null}
            </Field>
            <Field data-invalid={priceInvalid || undefined}>
              <FieldLabel htmlFor="product-price">
                Asking price <span aria-hidden="true">*</span>
              </FieldLabel>
              <FieldDescription id="product-price-hint">
                Numbers only. Used to rank competing offers.
              </FieldDescription>
              <MoneyInput
                id="product-price"
                name="askingPrice"
                value={price}
                onChange={setPrice}
                onBlur={onBlur("price")}
                currency={currency}
                invalid={priceInvalid}
                required
              />
              {priceInvalid ? (
                <FieldError>Enter a valid asking price.</FieldError>
              ) : null}
            </Field>
            <Field>
              <FieldTitle>Status</FieldTitle>
              <ToggleGroup
                type="single"
                value={status}
                onValueChange={(value) => {
                  if (value) {
                    setStatus(value as ProductStatus)
                  }
                }}
                spacing={2}
                className="flex-wrap"
                aria-label="Product status"
              >
                {PRODUCT_STATUSES.map((item) => (
                  <ToggleGroupItem key={item} value={item}>
                    {STATUS_LABELS[item]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="product-location">Location</FieldLabel>
              <Input
                id="product-location"
                name="location"
                autoComplete="off"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="product-sku">SKU</FieldLabel>
              <Input
                id="product-sku"
                name="sku"
                autoComplete="off"
                value={sku}
                onChange={(event) => setSku(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="product-notes">Notes</FieldLabel>
              <Textarea
                id="product-notes"
                name="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{product ? "Save product" : "Create product"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
