import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { orderedStages } from "@/lib/chips"
import type { Stage } from "@/lib/schema"

export function StageSelect({
  id,
  value,
  onValueChange,
  stages,
  invalid,
  includeHidden = true,
}: {
  id?: string
  value: string
  onValueChange: (value: string) => void
  stages: Stage[]
  invalid?: boolean
  includeHidden?: boolean
}) {
  const options = orderedStages(stages).filter(
    (stage) => includeHidden || !stage.hidden || stage.id === value
  )

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        id={id}
        className="w-full"
        aria-invalid={invalid || undefined}
      >
        <SelectValue placeholder="Select stage" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((stage) => (
            <SelectItem key={stage.id} value={stage.id}>
              {stage.name}
              {stage.hidden ? " (hidden)" : ""}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
