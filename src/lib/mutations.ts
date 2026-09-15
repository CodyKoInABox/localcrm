import { nowIso, todayIso } from "@/lib/dates"
import { db } from "@/lib/db"
import { createId } from "@/lib/ids"
import type { Lead } from "@/lib/schema"

export async function deleteProduct(id: string): Promise<void> {
  const leadCount = await db.leads.where("productId").equals(id).count()
  if (leadCount > 0) {
    throw new Error(
      "This product has leads. Move or delete those leads first."
    )
  }
  await db.products.delete(id)
}

export async function deleteCompany(id: string): Promise<void> {
  const leadCount = await db.leads.where("companyId").equals(id).count()
  if (leadCount > 0) {
    throw new Error(
      "This company has leads. Move or delete those leads first."
    )
  }
  const contactCount = await db.contacts.where("companyId").equals(id).count()
  if (contactCount > 0) {
    throw new Error(
      "This company still has people. Delete or move them first."
    )
  }
  await db.companies.delete(id)
}

export async function deleteContact(id: string): Promise<void> {
  const leads = await db.leads.toArray()
  const linked = leads.filter((lead) => lead.contactIds.includes(id))
  await db.transaction("rw", db.contacts, db.leads, async () => {
    for (const lead of linked) {
      await db.leads.update(lead.id, {
        contactIds: lead.contactIds.filter((item) => item !== id),
        updatedAt: nowIso(),
      })
    }
    await db.contacts.delete(id)
  })
}

export async function deleteLead(id: string): Promise<void> {
  await db.transaction("rw", db.leads, db.offerHistory, async () => {
    await db.offerHistory.where("leadId").equals(id).delete()
    await db.leads.delete(id)
  })
}

export async function setLeadStage(
  leadId: string,
  stageId: string
): Promise<void> {
  await db.leads.update(leadId, { stageId, updatedAt: nowIso() })
}

export async function applyOfferAmount(
  lead: Lead,
  amount: number | null,
  note: string
): Promise<void> {
  const stamp = nowIso()
  await db.transaction("rw", db.leads, db.offerHistory, async () => {
    if (
      amount != null &&
      Number.isFinite(amount) &&
      amount !== lead.currentOfferAmount
    ) {
      await db.offerHistory.add({
        id: createId(),
        leadId: lead.id,
        amount,
        note,
        date: todayIso(),
        createdAt: stamp,
      })
    }
    await db.leads.update(lead.id, {
      currentOfferAmount: amount,
      currentOfferNote: note,
      updatedAt: stamp,
    })
  })
}
