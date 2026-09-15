import { Temporal } from "@js-temporal/polyfill"

import { STALE_AFTER_DAYS } from "@/lib/constants"
import {
  compareCalendarDates,
  daysBetween,
  isCalendarDate,
  todayIso,
} from "@/lib/dates"
import type { Lead, Stage } from "@/lib/schema"

export type DerivedChips = {
  awaitingReply: boolean
  overdue: boolean
  dueToday: boolean
  stale: boolean
}

function lastTouchDate(lead: Pick<Lead, "lastContactDate" | "createdAt">): string {
  if (lead.lastContactDate) {
    return lead.lastContactDate
  }
  try {
    return Temporal.Instant.from(lead.createdAt)
      .toZonedDateTimeISO(Temporal.Now.timeZoneId())
      .toPlainDate()
      .toString()
  } catch {
    return isCalendarDate(lead.createdAt) ? lead.createdAt : todayIso()
  }
}

export function deriveChips(
  lead: Pick<
    Lead,
    | "initiator"
    | "theyReplied"
    | "lastToSend"
    | "lastContactDate"
    | "nextActionDue"
    | "createdAt"
  >,
  today = todayIso()
): DerivedChips {
  const awaitingReply =
    (lead.initiator === "me" || lead.lastToSend === "me") &&
    !lead.theyReplied

  const overdue =
    lead.nextActionDue != null &&
    compareCalendarDates(lead.nextActionDue, today) < 0

  const dueToday =
    lead.nextActionDue != null &&
    compareCalendarDates(lead.nextActionDue, today) === 0

  const stale =
    daysBetween(lastTouchDate(lead), today) >= STALE_AFTER_DAYS

  return { awaitingReply, overdue, dueToday, stale }
}

export function isTerminalStage(
  stage: Pick<Stage, "isTerminal"> | undefined
): boolean {
  return Boolean(stage?.isTerminal)
}

export function orderedStages(stages: Stage[]): Stage[] {
  return [...stages].sort((a, b) => a.order - b.order)
}

export function stageById(
  stages: Stage[],
  id: string
): Stage | undefined {
  return stages.find((stage) => stage.id === id)
}

export function isOpenLead(lead: Lead, stages: Stage[]): boolean {
  return !isTerminalStage(stageById(stages, lead.stageId))
}
