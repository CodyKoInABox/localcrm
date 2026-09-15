export const SCHEMA_VERSION = 1 as const

export const SETTINGS_ID = "app" as const

export const PRODUCT_STATUSES = [
  "available",
  "reserved",
  "sold",
  "withdrawn",
] as const

export const PARTIES = ["me", "them"] as const

export const TERMINAL_KINDS = ["won", "lost"] as const

export const DEFAULT_STAGE_IDS = {
  new: "stage-new",
  contacted: "stage-contacted",
  waitingReply: "stage-waiting-reply",
  negotiating: "stage-negotiating",
  offerIn: "stage-offer-in",
  won: "stage-won",
  lost: "stage-lost",
  onHold: "stage-on-hold",
} as const

export const DEFAULT_STAGES = [
  {
    id: DEFAULT_STAGE_IDS.new,
    name: "New",
    order: 0,
    hidden: false,
    isTerminal: false,
    terminalKind: null,
  },
  {
    id: DEFAULT_STAGE_IDS.contacted,
    name: "Contacted",
    order: 1,
    hidden: false,
    isTerminal: false,
    terminalKind: null,
  },
  {
    id: DEFAULT_STAGE_IDS.waitingReply,
    name: "Waiting reply",
    order: 2,
    hidden: false,
    isTerminal: false,
    terminalKind: null,
  },
  {
    id: DEFAULT_STAGE_IDS.negotiating,
    name: "Negotiating",
    order: 3,
    hidden: false,
    isTerminal: false,
    terminalKind: null,
  },
  {
    id: DEFAULT_STAGE_IDS.offerIn,
    name: "Offer in",
    order: 4,
    hidden: false,
    isTerminal: false,
    terminalKind: null,
  },
  {
    id: DEFAULT_STAGE_IDS.won,
    name: "Won",
    order: 5,
    hidden: false,
    isTerminal: true,
    terminalKind: "won" as const,
  },
  {
    id: DEFAULT_STAGE_IDS.lost,
    name: "Lost",
    order: 6,
    hidden: false,
    isTerminal: true,
    terminalKind: "lost" as const,
  },
  {
    id: DEFAULT_STAGE_IDS.onHold,
    name: "On hold",
    order: 7,
    hidden: false,
    isTerminal: false,
    terminalKind: null,
  },
]

export const CURRENCY_OPTIONS = [
  "USD",
  "BRL",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
  "MXN",
  "CHF",
] as const

export const STALE_AFTER_DAYS = 14
