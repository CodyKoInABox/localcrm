import { useLiveQuery } from "dexie-react-hooks"

import { SETTINGS_ID } from "@/lib/constants"
import { db } from "@/lib/db"

export function useCurrency(): string {
  const settings = useLiveQuery(() => db.settings.get(SETTINGS_ID))
  return settings?.currency ?? "USD"
}
