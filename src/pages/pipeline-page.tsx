import * as React from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { useLiveQuery } from "dexie-react-hooks"
import { Columns3Icon, GripVerticalIcon } from "lucide-react"
import { Link } from "react-router"

import { EntityEmpty } from "@/components/entity-empty"
import { LeadChips } from "@/components/lead-chips"
import { PageHeader, PageSkeleton, PageStack } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useCurrency } from "@/hooks/use-currency"
import { deriveChips, orderedStages } from "@/lib/chips"
import { formatCalendarDate } from "@/lib/dates"
import { db } from "@/lib/db"
import { byId, leadLabel } from "@/lib/maps"
import { formatMoney } from "@/lib/money"
import { setLeadStage } from "@/lib/mutations"
import type { Lead, Stage } from "@/lib/schema"
import { cn } from "@/lib/utils"

export function PipelinePage() {
  const currency = useCurrency()
  const leads = useLiveQuery(() => db.leads.toArray())
  const stages = useLiveQuery(() => db.stages.toArray())
  const products = useLiveQuery(() => db.products.toArray())
  const companies = useLiveQuery(() => db.companies.toArray())
  const [activeId, setActiveId] = React.useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  if (!leads || !stages || !products || !companies) {
    return <PageSkeleton />
  }

  const allLeads = leads
  const productMap = byId(products)
  const companyMap = byId(companies)
  const columns = orderedStages(stages).filter((stage) => {
    const count = leads.filter((lead) => lead.stageId === stage.id).length
    return !stage.hidden || count > 0
  })

  const activeLead = leads.find((lead) => lead.id === activeId)

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) {
      return
    }
    const data = over.data.current as
      | { type?: string; stageId?: string }
      | undefined
    const stageId =
      data?.type === "column" || data?.type === "card"
        ? data.stageId
        : undefined
    if (!stageId) {
      return
    }
    const leadId = String(active.id)
    const lead = allLeads.find((item) => item.id === leadId)
    if (!lead || lead.stageId === stageId) {
      return
    }
    void setLeadStage(leadId, stageId)
  }

  return (
    <PageStack>
      <PageHeader
        title="Pipeline"
        description="Drag a card onto a column. Hide or rename stages in Settings."
      />
      {leads.length === 0 ? (
        <EntityEmpty
          icon={Columns3Icon}
          title="No leads on the board"
          description="Create a lead, then drag it through stages."
          actionLabel="Go to leads"
          actionTo="/leads"
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <ScrollArea className="w-full">
            <div className="flex min-h-[28rem] gap-3 pb-4">
              {columns.map((stage) => (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  leads={leads.filter((lead) => lead.stageId === stage.id)}
                  companies={companyMap}
                  products={productMap}
                  currency={currency}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <DragOverlay>
            {activeLead ? (
              <LeadCard
                lead={activeLead}
                companyName={companyMap.get(activeLead.companyId)?.name}
                productName={productMap.get(activeLead.productId)?.name}
                currency={currency}
                overlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </PageStack>
  )
}

function KanbanColumn({
  stage,
  leads,
  companies,
  products,
  currency,
}: {
  stage: Stage
  leads: Lead[]
  companies: Map<string, { name: string }>
  products: Map<string, { name: string }>
  currency: string
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${stage.id}`,
    data: { type: "column", stageId: stage.id },
  })

  return (
    <div
      ref={setNodeRef}
      className="flex w-72 shrink-0 flex-col gap-2"
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <h2 className="text-sm font-medium">{stage.name}</h2>
        <div className="flex items-center gap-1">
          {stage.hidden ? <Badge variant="outline">Hidden</Badge> : null}
          {stage.isTerminal ? (
            <Badge variant="secondary">
              {stage.terminalKind === "lost" ? "Lost" : "Won"}
            </Badge>
          ) : null}
          <Badge variant="secondary">{leads.length}</Badge>
        </div>
      </div>
      <div
        className={cn(
          "flex min-h-40 flex-1 flex-col gap-2 rounded-xl border bg-muted/30 p-2",
          isOver && "ring-2 ring-ring"
        )}
      >
        {leads.map((lead) => (
          <DraggableLead
            key={lead.id}
            lead={lead}
            companyName={companies.get(lead.companyId)?.name}
            productName={products.get(lead.productId)?.name}
            currency={currency}
          />
        ))}
      </div>
    </div>
  )
}

function DraggableLead({
  lead,
  companyName,
  productName,
  currency,
}: {
  lead: Lead
  companyName?: string
  productName?: string
  currency: string
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: lead.id,
      data: { type: "card", stageId: lead.stageId },
    })
  const { setNodeRef: setDropRef } = useDroppable({
    id: `card-${lead.id}`,
    data: { type: "card", stageId: lead.stageId },
  })

  return (
    <div
      ref={(node) => {
        setNodeRef(node)
        setDropRef(node)
      }}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(isDragging && "opacity-40")}
    >
      <LeadCard
        lead={lead}
        companyName={companyName}
        productName={productName}
        currency={currency}
        dragHandleProps={{ ...listeners, ...attributes }}
      />
    </div>
  )
}

function LeadCard({
  lead,
  companyName,
  productName,
  currency,
  overlay = false,
  dragHandleProps,
}: {
  lead: Lead
  companyName?: string
  productName?: string
  currency: string
  overlay?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
}) {
  const chips = deriveChips(lead)
  return (
    <Card className={cn("shadow-sm", overlay && "cursor-grabbing")}>
      <CardHeader className="p-3">
        <div className="flex items-start gap-1">
          {dragHandleProps ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="mt-0.5 cursor-grab"
              aria-label="Drag to another stage"
              {...dragHandleProps}
            >
              <GripVerticalIcon />
            </Button>
          ) : null}
          <CardTitle className="min-w-0 flex-1 text-sm">
            {overlay ? (
              leadLabel(companyName, productName)
            ) : (
              <Link
                to={`/leads/${lead.id}`}
                className="underline-offset-4 hover:underline"
              >
                {leadLabel(companyName, productName)}
              </Link>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 p-3 pt-0">
        <p className="text-sm text-muted-foreground">
          {lead.currentOfferAmount == null
            ? "No offer"
            : formatMoney(lead.currentOfferAmount, currency)}
        </p>
        {lead.nextAction ? (
          <p className="text-xs text-muted-foreground">
            {lead.nextAction}
            {lead.nextActionDue
              ? ` · ${formatCalendarDate(lead.nextActionDue)}`
              : ""}
          </p>
        ) : null}
        <LeadChips chips={chips} />
      </CardContent>
    </Card>
  )
}
