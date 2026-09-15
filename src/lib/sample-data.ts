import { DEFAULT_STAGE_IDS } from "@/lib/constants"
import { addDays, nowIso, todayIso } from "@/lib/dates"
import { db } from "@/lib/db"
import { createId } from "@/lib/ids"
import type {
  Company,
  Contact,
  Lead,
  OfferHistory,
  Product,
} from "@/lib/schema"

const SAMPLE_IDS = {
  products: {
    northLot: "sample-prod-north-lot",
    atlas: "sample-prod-atlas",
    warehouse: "sample-prod-warehouse",
  },
  companies: {
    meridian: "sample-co-meridian",
    lumen: "sample-co-lumen",
    oak: "sample-co-oak",
  },
  contacts: {
    ana: "sample-ct-ana",
    jon: "sample-ct-jon",
    priya: "sample-ct-priya",
    marco: "sample-ct-marco",
    elena: "sample-ct-elena",
  },
  leads: {
    meridianLot: "sample-lead-meridian-lot",
    oakLot: "sample-lead-oak-lot",
    lumenLot: "sample-lead-lumen-lot",
    lumenAtlas: "sample-lead-lumen-atlas",
    oakWarehouse: "sample-lead-oak-warehouse",
    meridianAtlas: "sample-lead-meridian-atlas",
  },
}

export async function loadSampleData(): Promise<void> {
  const today = todayIso()
  const stamp = nowIso()
  const overdue = addDays(today, -3)
  const twoWeeksAgo = addDays(today, -16)
  const lastWeek = addDays(today, -6)
  const yesterday = addDays(today, -1)

  const products: Product[] = [
    {
      id: SAMPLE_IDS.products.northLot,
      name: "North Lot 12",
      askingPrice: 180000,
      status: "available",
      notes: "Corner plot, utilities at the boundary.",
      location: "Riverside parcel",
      sku: "LOT-12",
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: SAMPLE_IDS.products.atlas,
      name: "Atlas CRM — 50 seats",
      askingPrice: 24000,
      status: "available",
      notes: "Annual license. Implementation extra.",
      sku: "ATLAS-50",
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: SAMPLE_IDS.products.warehouse,
      name: "Warehouse B lease",
      askingPrice: 90000,
      status: "reserved",
      notes: "12-month industrial lease, asking annual.",
      location: "Bay 4",
      sku: "WH-B",
      createdAt: stamp,
      updatedAt: stamp,
    },
  ]

  const companies: Company[] = [
    {
      id: SAMPLE_IDS.companies.meridian,
      name: "Meridian Holdings",
      website: "https://meridian.example",
      notes: "Buys land for small residential infill.",
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: SAMPLE_IDS.companies.lumen,
      name: "Lumen Retail",
      website: "https://lumen.example",
      notes: "Regional chain. Slow legal, decisive ops.",
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: SAMPLE_IDS.companies.oak,
      name: "Oak & Pine Capital",
      notes: "Family office. Price-sensitive, cash-ready.",
      createdAt: stamp,
      updatedAt: stamp,
    },
  ]

  const contacts: Contact[] = [
    {
      id: SAMPLE_IDS.contacts.ana,
      companyId: SAMPLE_IDS.companies.meridian,
      name: "Ana Costa",
      email: "ana@meridian.example",
      phone: "+1 415 555 0142",
      role: "Acquisitions",
      notes: "Prefers email. Replies same day.",
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: SAMPLE_IDS.contacts.jon,
      companyId: SAMPLE_IDS.companies.meridian,
      name: "Jon Hale",
      email: "jon@meridian.example",
      role: "Principal",
      notes: "",
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: SAMPLE_IDS.contacts.priya,
      companyId: SAMPLE_IDS.companies.lumen,
      name: "Priya Shah",
      email: "priya@lumen.example",
      phone: "+1 312 555 0198",
      role: "Head of Real Estate",
      notes: "",
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: SAMPLE_IDS.contacts.marco,
      companyId: SAMPLE_IDS.companies.oak,
      name: "Marco Silva",
      email: "marco@oakpine.example",
      role: "Partner",
      notes: "WhatsApp only after first call.",
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: SAMPLE_IDS.contacts.elena,
      companyId: SAMPLE_IDS.companies.oak,
      name: "Elena Vogt",
      email: "elena@oakpine.example",
      role: "Analyst",
      notes: "",
      createdAt: stamp,
      updatedAt: stamp,
    },
  ]

  const leads: Lead[] = [
    {
      id: SAMPLE_IDS.leads.meridianLot,
      companyId: SAMPLE_IDS.companies.meridian,
      productId: SAMPLE_IDS.products.northLot,
      contactIds: [SAMPLE_IDS.contacts.ana, SAMPLE_IDS.contacts.jon],
      stageId: DEFAULT_STAGE_IDS.negotiating,
      initiator: "me",
      theyReplied: true,
      lastToSend: "them",
      lastContactDate: yesterday,
      howItsGoing:
        "They like the access road. Pushing on price vs drainage work.",
      nextAction: "Send revised pack with drainage quote",
      nextActionDue: today,
      currentOfferAmount: 165000,
      currentOfferNote: "Subject to soil report.",
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: SAMPLE_IDS.leads.oakLot,
      companyId: SAMPLE_IDS.companies.oak,
      productId: SAMPLE_IDS.products.northLot,
      contactIds: [SAMPLE_IDS.contacts.marco],
      stageId: DEFAULT_STAGE_IDS.offerIn,
      initiator: "them",
      theyReplied: true,
      lastToSend: "them",
      lastContactDate: yesterday,
      howItsGoing: "Cash offer. Want a 30-day close.",
      nextAction: "Compare vs Meridian and decide",
      nextActionDue: addDays(today, 1),
      currentOfferAmount: 172000,
      currentOfferNote: "Cash, 30-day close.",
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: SAMPLE_IDS.leads.lumenLot,
      companyId: SAMPLE_IDS.companies.lumen,
      productId: SAMPLE_IDS.products.northLot,
      contactIds: [SAMPLE_IDS.contacts.priya],
      stageId: DEFAULT_STAGE_IDS.contacted,
      initiator: "me",
      theyReplied: false,
      lastToSend: "me",
      lastContactDate: lastWeek,
      howItsGoing: "Intro sent. No reply yet.",
      nextAction: "Follow up once",
      nextActionDue: overdue,
      currentOfferAmount: 150000,
      currentOfferNote: "Indicative, not firm.",
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: SAMPLE_IDS.leads.lumenAtlas,
      companyId: SAMPLE_IDS.companies.lumen,
      productId: SAMPLE_IDS.products.atlas,
      contactIds: [SAMPLE_IDS.contacts.priya],
      stageId: DEFAULT_STAGE_IDS.waitingReply,
      initiator: "me",
      theyReplied: false,
      lastToSend: "me",
      lastContactDate: yesterday,
      howItsGoing: "Pilot proposal sitting with IT.",
      nextAction: "Nudge Priya",
      nextActionDue: addDays(today, 2),
      currentOfferAmount: 21000,
      currentOfferNote: "Asked for 2-year prepay discount.",
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: SAMPLE_IDS.leads.oakWarehouse,
      companyId: SAMPLE_IDS.companies.oak,
      productId: SAMPLE_IDS.products.warehouse,
      contactIds: [SAMPLE_IDS.contacts.marco, SAMPLE_IDS.contacts.elena],
      stageId: DEFAULT_STAGE_IDS.won,
      initiator: "them",
      theyReplied: true,
      lastToSend: "me",
      lastContactDate: lastWeek,
      howItsGoing: "Verbal yes. Paperwork with their counsel.",
      nextAction: "Send lease pack",
      nextActionDue: addDays(today, 4),
      currentOfferAmount: 90000,
      currentOfferNote: "Asking, no discount.",
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: SAMPLE_IDS.leads.meridianAtlas,
      companyId: SAMPLE_IDS.companies.meridian,
      productId: SAMPLE_IDS.products.atlas,
      contactIds: [SAMPLE_IDS.contacts.ana],
      stageId: DEFAULT_STAGE_IDS.onHold,
      initiator: "them",
      theyReplied: true,
      lastToSend: "them",
      lastContactDate: twoWeeksAgo,
      howItsGoing: "Paused until Q4 budget.",
      nextAction: "Reopen in October",
      nextActionDue: addDays(today, 20),
      currentOfferAmount: null,
      currentOfferNote: "",
      createdAt: stamp,
      updatedAt: stamp,
    },
  ]

  const offerHistory: OfferHistory[] = [
    {
      id: createId(),
      leadId: SAMPLE_IDS.leads.meridianLot,
      amount: 158000,
      note: "First number.",
      date: addDays(today, -10),
      createdAt: stamp,
    },
    {
      id: createId(),
      leadId: SAMPLE_IDS.leads.meridianLot,
      amount: 165000,
      note: "After site walk.",
      date: yesterday,
      createdAt: stamp,
    },
    {
      id: createId(),
      leadId: SAMPLE_IDS.leads.oakLot,
      amount: 168000,
      note: "Opening.",
      date: addDays(today, -4),
      createdAt: stamp,
    },
    {
      id: createId(),
      leadId: SAMPLE_IDS.leads.oakLot,
      amount: 172000,
      note: "Cash, 30-day close.",
      date: yesterday,
      createdAt: stamp,
    },
    {
      id: createId(),
      leadId: SAMPLE_IDS.leads.lumenLot,
      amount: 150000,
      note: "Indicative.",
      date: lastWeek,
      createdAt: stamp,
    },
    {
      id: createId(),
      leadId: SAMPLE_IDS.leads.lumenAtlas,
      amount: 21000,
      note: "2-year prepay ask.",
      date: yesterday,
      createdAt: stamp,
    },
    {
      id: createId(),
      leadId: SAMPLE_IDS.leads.oakWarehouse,
      amount: 90000,
      note: "Asking, accepted.",
      date: lastWeek,
      createdAt: stamp,
    },
  ]

  await db.transaction(
    "rw",
    [
      db.products,
      db.companies,
      db.contacts,
      db.leads,
      db.offerHistory,
    ],
    async () => {
      await db.products.bulkPut(products)
      await db.companies.bulkPut(companies)
      await db.contacts.bulkPut(contacts)
      await db.leads.bulkPut(leads)
      const existingHistory = await db.offerHistory
        .where("leadId")
        .anyOf(leads.map((lead) => lead.id))
        .toArray()
      const sampleHistoryIds = new Set(
        existingHistory
          .filter((row) =>
            Object.values(SAMPLE_IDS.leads).includes(row.leadId)
          )
          .map((row) => row.id)
      )
      if (sampleHistoryIds.size === 0) {
        await db.offerHistory.bulkAdd(offerHistory)
      }
    }
  )
}
