import * as React from "react"
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useLiveQuery } from "dexie-react-hooks"
import { GripVerticalIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { PageHeader, PageSkeleton, PageStack } from "@/components/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
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
import { Switch } from "@/components/ui/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { useTheme } from "@/components/theme-provider"
import { CURRENCY_OPTIONS, SETTINGS_ID } from "@/lib/constants"
import { orderedStages } from "@/lib/chips"
import { todayIso } from "@/lib/dates"
import { db, wipeAllData } from "@/lib/db"
import { createId } from "@/lib/ids"
import {
  buildExportPayload,
  downloadJson,
  importMerge,
  importReplace,
  parseExportPayload,
  readJsonFile,
} from "@/lib/import-export"
import { loadSampleData } from "@/lib/sample-data"
import type { Stage, TerminalKind } from "@/lib/schema"

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const settings = useLiveQuery(() => db.settings.get(SETTINGS_ID))
  const stages = useLiveQuery(() => db.stages.toArray())
  const [replaceOpen, setReplaceOpen] = React.useState(false)
  const [wipeOpen, setWipeOpen] = React.useState(false)
  const [pendingReplace, setPendingReplace] = React.useState<File | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const mergeRef = React.useRef<HTMLInputElement>(null)

  if (!settings || !stages) {
    return <PageSkeleton />
  }

  async function handleExport() {
    const payload = await buildExportPayload()
    downloadJson(`localcrm-${todayIso()}.json`, payload)
    toast.success("Export downloaded.")
  }

  async function handleMerge(file: File) {
    try {
      const raw = await readJsonFile(file)
      const payload = parseExportPayload(raw)
      await importMerge(payload)
      toast.success("Merged by id.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed.")
    }
  }

  async function handleReplace() {
    if (!pendingReplace) {
      return
    }
    try {
      const raw = await readJsonFile(pendingReplace)
      const payload = parseExportPayload(raw)
      await importReplace(payload)
      toast.success("Database replaced.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed.")
    } finally {
      setPendingReplace(null)
    }
  }

  return (
    <PageStack>
      <PageHeader
        title="Settings"
        description="Currency, pipeline, and moving data between browsers."
      />
      <Tabs defaultValue="workspace">
        <TabsList>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>
        <TabsContent value="workspace">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Currency</CardTitle>
                <CardDescription>
                  Display only. Amounts are stored as numbers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Field>
                  <FieldLabel>Default currency</FieldLabel>
                  <Select
                    value={settings.currency}
                    onValueChange={(value) => {
                      void db.settings.put({ ...settings, currency: value })
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {CURRENCY_OPTIONS.map((code) => (
                          <SelectItem key={code} value={code}>
                            {code}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>
                  Defaults to your system preference.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Field>
                  <FieldTitle>Appearance</FieldTitle>
                  <ToggleGroup
                    type="single"
                    value={theme}
                    onValueChange={(value) => {
                      if (value) {
                        setTheme(value as "light" | "dark" | "system")
                      }
                    }}
                    spacing={2}
                    aria-label="Theme"
                  >
                    <ToggleGroupItem value="system">System</ToggleGroupItem>
                    <ToggleGroupItem value="light">Light</ToggleGroupItem>
                    <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
                  </ToggleGroup>
                </Field>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="pipeline">
          <Card>
            <CardHeader>
              <CardTitle>Stages</CardTitle>
              <CardDescription>
                Stable ids. Hide instead of deleting if leads still use a stage.
                Won/Lost are terminal flags, not magic names.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PipelineEditor stages={orderedStages(stages)} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="data">
          <div className="flex flex-col gap-4">
            <Alert>
              <AlertTitle>This browser only</AlertTitle>
              <AlertDescription>
                Data stays on this device. Export before switching machines or
                clearing site data.
              </AlertDescription>
            </Alert>
            <Card>
              <CardHeader>
                <CardTitle>Export / import</CardTitle>
                <CardDescription>
                  Versioned JSON. Replace all (confirm) or merge by id.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => void handleExport()}>
                    Export JSON
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => mergeRef.current?.click()}
                  >
                    Merge from file
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                  >
                    Replace all…
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/json"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      event.target.value = ""
                      if (file) {
                        setPendingReplace(file)
                        setReplaceOpen(true)
                      }
                    }}
                  />
                  <input
                    ref={mergeRef}
                    type="file"
                    accept="application/json"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      event.target.value = ""
                      if (file) {
                        void handleMerge(file)
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Sample data</CardTitle>
                <CardDescription>
                  Upserts a small demo set (sample-* ids). Does not wipe yours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() =>
                    void loadSampleData().then(() =>
                      toast.success("Sample data loaded.")
                    )
                  }
                >
                  Load sample data
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Danger</CardTitle>
                <CardDescription>
                  Wipe IndexedDB in this browser and restore default stages.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={() => setWipeOpen(true)}>
                  Wipe all data
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      <ConfirmDialog
        open={replaceOpen}
        onOpenChange={(open) => {
          setReplaceOpen(open)
          if (!open) {
            setPendingReplace(null)
          }
        }}
        title="Replace all data?"
        description="Everything in this browser will be overwritten by the file."
        confirmLabel="Replace all"
        destructive
        onConfirm={() => void handleReplace()}
      />
      <ConfirmDialog
        open={wipeOpen}
        onOpenChange={setWipeOpen}
        title="Wipe this browser’s CRM?"
        description="All products, companies, people, leads, and offers will be deleted."
        confirmLabel="Wipe"
        destructive
        onConfirm={() =>
          void wipeAllData().then(() => toast.success("Wiped. Defaults restored."))
        }
      />
    </PageStack>
  )
}

function PipelineEditor({ stages }: { stages: Stage[] }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  )
  const ids = stages.map((stage) => stage.id)

  async function persistOrder(next: Stage[]) {
    await db.transaction("rw", db.stages, async () => {
      await Promise.all(
        next.map((stage, index) =>
          db.stages.update(stage.id, { order: index })
        )
      )
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    void persistOrder(arrayMove(stages, oldIndex, newIndex))
  }

  async function addStage() {
    const id = createId()
    await db.stages.add({
      id,
      name: "New stage",
      order: stages.length,
      hidden: false,
      isTerminal: false,
      terminalKind: null,
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-2">
            {stages.map((stage) => (
              <SortableStage key={stage.id} stage={stage} stages={stages} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <Button variant="outline" onClick={() => void addStage()}>
        <PlusIcon data-icon="inline-start" />
        Add stage
      </Button>
    </div>
  )
}

function SortableStage({
  stage,
  stages,
}: {
  stage: Stage
  stages: Stage[]
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: stage.id })
  const leadCount = useLiveQuery(
    () => db.leads.where("stageId").equals(stage.id).count(),
    [stage.id]
  )

  async function save(partial: Partial<Stage>) {
    await db.stages.update(stage.id, partial)
  }

  async function remove() {
    if ((leadCount ?? 0) > 0) {
      toast.error("Hide this stage instead. Leads still use it.")
      return
    }
    if (stages.length <= 1) {
      toast.error("Keep at least one stage.")
      return
    }
    await db.stages.delete(stage.id)
  }

  const terminalValue = stage.isTerminal
    ? (stage.terminalKind ?? "won")
    : "open"

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className="rounded-xl border p-3"
    >
      <FieldGroup className="gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Reorder ${stage.name}`}
            {...attributes}
            {...listeners}
          >
            <GripVerticalIcon />
          </Button>
          <Field className="flex-1">
            <FieldLabel className="sr-only" htmlFor={`stage-name-${stage.id}`}>
              Stage name
            </FieldLabel>
            <Input
              id={`stage-name-${stage.id}`}
              value={stage.name}
              onChange={(event) => void save({ name: event.target.value })}
            />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Field orientation="horizontal" className="w-auto">
            <Switch
              id={`hidden-${stage.id}`}
              checked={stage.hidden}
              onCheckedChange={(checked) => void save({ hidden: checked })}
            />
            <FieldLabel htmlFor={`hidden-${stage.id}`} className="font-normal">
              Hidden
            </FieldLabel>
          </Field>
          <Field className="w-auto">
            <FieldTitle>Terminal</FieldTitle>
            <ToggleGroup
              type="single"
              value={terminalValue}
              onValueChange={(value) => {
                if (!value) {
                  return
                }
                if (value === "open") {
                  void save({ isTerminal: false, terminalKind: null })
                  return
                }
                void save({
                  isTerminal: true,
                  terminalKind: value as TerminalKind,
                })
              }}
              spacing={2}
              aria-label={`${stage.name} terminal flag`}
            >
              <ToggleGroupItem value="open">Open</ToggleGroupItem>
              <ToggleGroupItem value="won">Won</ToggleGroupItem>
              <ToggleGroupItem value="lost">Lost</ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void remove()}
          >
            Delete
          </Button>
        </div>
        <FieldDescription>
          id: {stage.id}
          {leadCount ? ` · ${leadCount} lead(s)` : ""}
        </FieldDescription>
      </FieldGroup>
    </li>
  )
}
