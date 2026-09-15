import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { currencySymbol } from "@/lib/money"
import { cn } from "@/lib/utils"

export function MoneyInput({
  id,
  name,
  value,
  onChange,
  onBlur,
  currency,
  invalid,
  required,
  placeholder = "0",
}: {
  id: string
  name?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  currency: string
  invalid?: boolean
  required?: boolean
  placeholder?: string
}) {
  return (
    <InputGroup className={cn(invalid && "border-destructive")}>
      <InputGroupAddon>
        <span className="text-muted-foreground">{currencySymbol(currency)}</span>
      </InputGroupAddon>
      <InputGroupInput
        id={id}
        name={name ?? id}
        inputMode="decimal"
        autoComplete="off"
        required={required}
        aria-invalid={invalid || undefined}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
    </InputGroup>
  )
}
