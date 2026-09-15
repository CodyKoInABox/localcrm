import * as React from "react"
import { HashRouter, Route, Routes } from "react-router"

import { AppShell } from "@/components/app-shell"
import { CommandPalette } from "@/components/command-palette"
import { CompanyFormDialog } from "@/components/company-form-dialog"
import { ContactFormDialog } from "@/components/contact-form-dialog"
import { LeadFormDialog } from "@/components/lead-form-dialog"
import { ProductFormDialog } from "@/components/product-form-dialog"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { db, ensureSeeded } from "@/lib/db"
import { CompaniesPage } from "@/pages/companies-page"
import { CompanyDetailPage } from "@/pages/company-detail-page"
import { ContactDetailPage } from "@/pages/contact-detail-page"
import { ContactsPage } from "@/pages/contacts-page"
import { HomePage } from "@/pages/home-page"
import { LeadDetailPage } from "@/pages/lead-detail-page"
import { LeadsPage } from "@/pages/leads-page"
import { NotFoundPage } from "@/pages/not-found-page"
import { PipelinePage } from "@/pages/pipeline-page"
import { ProductDetailPage } from "@/pages/product-detail-page"
import { ProductsPage } from "@/pages/products-page"
import { SettingsPage } from "@/pages/settings-page"
import { useLiveQuery } from "dexie-react-hooks"

export function App() {
  const [ready, setReady] = React.useState(false)
  const [commandOpen, setCommandOpen] = React.useState(false)
  const [create, setCreate] = React.useState<
    "product" | "company" | "contact" | "lead" | null
  >(null)

  const products = useLiveQuery(() => db.products.orderBy("name").toArray()) ?? []
  const companies =
    useLiveQuery(() => db.companies.orderBy("name").toArray()) ?? []
  const contacts = useLiveQuery(() => db.contacts.orderBy("name").toArray()) ?? []
  const stages = useLiveQuery(() => db.stages.toArray()) ?? []

  React.useEffect(() => {
    void ensureSeeded().then(() => setReady(true))
  }, [])

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setCommandOpen((open) => !open)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <HashRouter>
      <TooltipProvider>
        <Routes>
          <Route
            element={<AppShell onOpenCommand={() => setCommandOpen(true)} />}
          >
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/companies" element={<CompaniesPage />} />
            <Route path="/companies/:id" element={<CompanyDetailPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/contacts/:id" element={<ContactDetailPage />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/leads/:id" element={<LeadDetailPage />} />
            <Route path="/pipeline" element={<PipelinePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
        <CommandPalette
          open={commandOpen}
          onOpenChange={setCommandOpen}
          onCreate={setCreate}
        />
        <ProductFormDialog
          open={create === "product"}
          onOpenChange={(open) => {
            if (!open) {
              setCreate(null)
            }
          }}
        />
        <CompanyFormDialog
          open={create === "company"}
          onOpenChange={(open) => {
            if (!open) {
              setCreate(null)
            }
          }}
        />
        <ContactFormDialog
          open={create === "contact"}
          onOpenChange={(open) => {
            if (!open) {
              setCreate(null)
            }
          }}
          companies={companies}
        />
        <LeadFormDialog
          open={create === "lead"}
          onOpenChange={(open) => {
            if (!open) {
              setCreate(null)
            }
          }}
          companies={companies}
          products={products}
          contacts={contacts}
          stages={stages}
        />
        <Toaster />
        {!ready ? <span className="sr-only">Loading database</span> : null}
      </TooltipProvider>
    </HashRouter>
  )
}

export default App
