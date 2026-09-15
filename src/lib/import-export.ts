import { DEFAULT_STAGES, SCHEMA_VERSION, SETTINGS_ID } from "@/lib/constants"
import { DATA_TABLES, db } from "@/lib/db"
import { nowIso } from "@/lib/dates"
import {
  exportPayloadSchema,
  type ExportPayload,
  type Settings,
} from "@/lib/schema"

export async function buildExportPayload(): Promise<ExportPayload> {
  const [
    products,
    companies,
    contacts,
    leads,
    offerHistory,
    stages,
    settings,
  ] = await Promise.all([
    db.products.toArray(),
    db.companies.toArray(),
    db.contacts.toArray(),
    db.leads.toArray(),
    db.offerHistory.toArray(),
    db.stages.toArray(),
    db.settings.get(SETTINGS_ID),
  ])

  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: nowIso(),
    settings: settings ?? { id: SETTINGS_ID, currency: "USD" },
    products,
    companies,
    contacts,
    leads,
    offerHistory,
    stages,
  }
}

export function parseExportPayload(raw: unknown): ExportPayload {
  const parsed = exportPayloadSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    const path = first?.path.join(".") || "file"
    throw new Error(`${path}: ${first?.message ?? "Invalid export file."}`)
  }
  return parsed.data
}

export async function importReplace(payload: ExportPayload): Promise<void> {
  await db.transaction("rw", DATA_TABLES, async () => {
    await Promise.all(DATA_TABLES.map((table) => table.clear()))
    await writeCollections(payload)
  })
}

export async function importMerge(payload: ExportPayload): Promise<void> {
  await db.transaction("rw", DATA_TABLES, async () => {
    await writeCollections(payload, { merge: true })
  })
}

async function writeCollections(
  payload: ExportPayload,
  options?: { merge?: boolean }
) {
  const stages =
    payload.stages.length > 0 ? payload.stages : DEFAULT_STAGES
  const settings: Settings = payload.settings ?? {
    id: SETTINGS_ID,
    currency: "USD",
  }

  if (options?.merge) {
    await Promise.all([
      payload.products.length
        ? db.products.bulkPut(payload.products)
        : Promise.resolve(),
      payload.companies.length
        ? db.companies.bulkPut(payload.companies)
        : Promise.resolve(),
      payload.contacts.length
        ? db.contacts.bulkPut(payload.contacts)
        : Promise.resolve(),
      payload.leads.length ? db.leads.bulkPut(payload.leads) : Promise.resolve(),
      payload.offerHistory.length
        ? db.offerHistory.bulkPut(payload.offerHistory)
        : Promise.resolve(),
      db.stages.bulkPut(stages),
      db.settings.put(settings),
    ])
    return
  }

  await db.products.bulkAdd(payload.products)
  await db.companies.bulkAdd(payload.companies)
  await db.contacts.bulkAdd(payload.contacts)
  await db.leads.bulkAdd(payload.leads)
  await db.offerHistory.bulkAdd(payload.offerHistory)
  await db.stages.bulkAdd(stages)
  await db.settings.put(settings)
}

export function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export async function readJsonFile(file: File): Promise<unknown> {
  const text = await file.text()
  return JSON.parse(text) as unknown
}
