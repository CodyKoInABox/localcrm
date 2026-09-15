import { Temporal } from "@js-temporal/polyfill"

const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/

export function todayIso(): string {
  return Temporal.Now.plainDateISO().toString()
}

export function nowIso(): string {
  return Temporal.Now.instant().toString()
}

export function isCalendarDate(value: string): boolean {
  if (!CALENDAR_DATE.test(value)) {
    return false
  }
  try {
    Temporal.PlainDate.from(value)
    return true
  } catch {
    return false
  }
}

export function addDays(iso: string, days: number): string {
  return Temporal.PlainDate.from(iso).add({ days }).toString()
}

export function daysBetween(from: string, to: string): number {
  return Temporal.PlainDate.from(from).until(Temporal.PlainDate.from(to), {
    largestUnit: "day",
  }).days
}

export function compareCalendarDates(a: string, b: string): number {
  return Temporal.PlainDate.compare(
    Temporal.PlainDate.from(a),
    Temporal.PlainDate.from(b)
  )
}

export function formatCalendarDate(iso: string): string {
  return Temporal.PlainDate.from(iso).toLocaleString("en-US", {
    dateStyle: "medium",
  })
}
