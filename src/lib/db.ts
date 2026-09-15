import Dexie, { type Table } from "dexie"

import { DEFAULT_STAGES, SETTINGS_ID } from "@/lib/constants"
import type {
  Company,
  Contact,
  Lead,
  OfferHistory,
  Product,
  Settings,
  Stage,
} from "@/lib/schema"

export class CrmDatabase extends Dexie {
  products!: Table<Product, string>
  companies!: Table<Company, string>
  contacts!: Table<Contact, string>
  leads!: Table<Lead, string>
  offerHistory!: Table<OfferHistory, string>
  stages!: Table<Stage, string>
  settings!: Table<Settings, string>

  constructor() {
    super("localcrm")
    this.version(1).stores({
      products: "id, name, status, updatedAt",
      companies: "id, name, updatedAt",
      contacts: "id, companyId, name, updatedAt",
      leads:
        "id, companyId, productId, stageId, updatedAt, nextActionDue, lastContactDate",
      offerHistory: "id, leadId, date",
      stages: "id, order",
      settings: "id",
    })
    this.on("populate", (trans) => {
      trans.table("stages").bulkAdd(DEFAULT_STAGES)
      trans.table("settings").add({
        id: SETTINGS_ID,
        currency: "USD",
      } satisfies Settings)
    })
  }
}

export const db = new CrmDatabase()

export const DATA_TABLES = [
  db.products,
  db.companies,
  db.contacts,
  db.leads,
  db.offerHistory,
  db.stages,
  db.settings,
] as const

export async function ensureSeeded(): Promise<void> {
  await db.open()
  const stageCount = await db.stages.count()
  if (stageCount === 0) {
    await db.stages.bulkAdd(DEFAULT_STAGES)
  }
  const settings = await db.settings.get(SETTINGS_ID)
  if (!settings) {
    await db.settings.put({ id: SETTINGS_ID, currency: "USD" })
  }
}

export async function wipeAllData(): Promise<void> {
  await db.transaction("rw", DATA_TABLES, async () => {
    await Promise.all(DATA_TABLES.map((table) => table.clear()))
    await db.stages.bulkAdd(DEFAULT_STAGES)
    await db.settings.put({ id: SETTINGS_ID, currency: "USD" })
  })
}
