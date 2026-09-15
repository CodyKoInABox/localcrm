import { fileURLToPath } from "node:url"
import { copyFileSync, existsSync } from "node:fs"
import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const rootDir = path.dirname(fileURLToPath(import.meta.url))

function copy404Plugin() {
  return {
    name: "copy-404",
    closeBundle() {
      const indexFile = path.join(rootDir, "dist", "index.html")
      if (existsSync(indexFile)) {
        copyFileSync(indexFile, path.join(rootDir, "dist", "404.html"))
      }
    },
  }
}

export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [react(), tailwindcss(), copy404Plugin()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
})
