# Local sales CRM

Client-only sales CRM. IndexedDB in this browser, no backend, no accounts.

## GitHub Pages

1. Push to `main`.
2. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The workflow builds with `BASE_PATH: /<repo-name>/` and deploys the `dist` artifact. Routes are hash URLs (`https://<user>.github.io/<repo>/#/leads`). `404.html` is a copy of `index.html` as a fallback.

Local preview of a production build (you run this): `npm run build` then `npm run preview`. Do not assume `/` if you set `BASE_PATH`.

## First run

```bash
npm ci
npm run dev
```

Open the app, or **Settings → Load sample data** for a demo set (products, companies, people, leads, offers). Theme follows the OS until you pick light/dark.

Data never leaves the browser except a JSON file you export.

## Export / import (other PC)

**Settings → Data**

- **Export JSON** — `schemaVersion`, `exportedAt`, plus `settings`, `products`, `companies`, `contacts`, `leads`, `offerHistory`, `stages`.
- **Merge from file** — upsert by `id`.
- **Replace all** — wipes this browser’s DB, then loads the file (confirm).
- **Wipe all data** — empty DB, default pipeline and USD.

Export before switching machines or clearing site data.

## Model

- **Product** — asking price, status, notes, optional location/SKU.
- **Company** / **Contact** — org and people.
- **Lead** — one conversation: company + involved people + **one product** + stage + comms fields + next action + current offer.
- **Offer** — what that company will pay on that lead. Amount changes append history. The product page ranks **current** offers vs asking.

No activity log. Comms are fields: initiator, they replied, last to send, last contact date, how it’s going, next action + due.

Dates are calendar dates (`YYYY-MM-DD`), not timezone-shifted timestamps.

## Stack

Vite, React 19, TypeScript, Tailwind 4, shadcn/ui, hash router, Dexie, Zod, lucide, @dnd-kit, sonner.
