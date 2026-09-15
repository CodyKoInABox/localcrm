export function normalizeWebsite(raw: string): string | undefined {
  const value = raw.trim()
  if (!value) {
    return undefined
  }
  if (/^https?:\/\//i.test(value)) {
    return value
  }
  return `https://${value}`
}

export function hrefForWebsite(raw: string): string {
  return normalizeWebsite(raw) ?? raw
}
