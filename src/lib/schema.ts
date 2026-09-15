import { z } from "zod"

import { isCalendarDate } from "@/lib/dates"
import {
  PARTIES,
  PRODUCT_STATUSES,
  SCHEMA_VERSION,
  SETTINGS_ID,
  TERMINAL_KINDS,
} from "@/lib/constants"

const calendarDate = z.string().refine(isCalendarDate, {
  message: "Use a calendar date (YYYY-MM-DD).",
})

export const productStatusSchema = z.enum(PRODUCT_STATUSES)
export const partySchema = z.enum(PARTIES)
export const terminalKindSchema = z.enum(TERMINAL_KINDS)

export const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  askingPrice: z.number().nonnegative(),
  status: productStatusSchema,
  notes: z.string(),
  location: z.string().optional(),
  sku: z.string().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const companySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  website: z.string().optional(),
  notes: z.string(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const contactSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().optional(),
  phone: z.string().optional(),
  role: z.string().optional(),
  notes: z.string(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const leadSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  productId: z.string().min(1),
  contactIds: z.array(z.string()),
  stageId: z.string().min(1),
  initiator: partySchema,
  theyReplied: z.boolean(),
  lastToSend: partySchema,
  lastContactDate: calendarDate.nullable(),
  howItsGoing: z.string(),
  nextAction: z.string(),
  nextActionDue: calendarDate.nullable(),
  currentOfferAmount: z.number().nonnegative().nullable(),
  currentOfferNote: z.string(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const offerHistorySchema = z.object({
  id: z.string().min(1),
  leadId: z.string().min(1),
  amount: z.number().nonnegative(),
  note: z.string(),
  date: calendarDate,
  createdAt: z.string().min(1),
})

export const stageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  order: z.number().int(),
  hidden: z.boolean(),
  isTerminal: z.boolean(),
  terminalKind: terminalKindSchema.nullable(),
})

export const settingsSchema = z.object({
  id: z.literal(SETTINGS_ID),
  currency: z.string().min(1),
})

export const exportPayloadSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  exportedAt: z.string().min(1),
  settings: settingsSchema,
  products: z.array(productSchema),
  companies: z.array(companySchema),
  contacts: z.array(contactSchema),
  leads: z.array(leadSchema),
  offerHistory: z.array(offerHistorySchema),
  stages: z.array(stageSchema),
})

export type ProductStatus = z.infer<typeof productStatusSchema>
export type Party = z.infer<typeof partySchema>
export type TerminalKind = z.infer<typeof terminalKindSchema>
export type Product = z.infer<typeof productSchema>
export type Company = z.infer<typeof companySchema>
export type Contact = z.infer<typeof contactSchema>
export type Lead = z.infer<typeof leadSchema>
export type OfferHistory = z.infer<typeof offerHistorySchema>
export type Stage = z.infer<typeof stageSchema>
export type Settings = z.infer<typeof settingsSchema>
export type ExportPayload = z.infer<typeof exportPayloadSchema>
