import * as React from "react"

export function useInteractionValidation() {
  const [submitted, setSubmitted] = React.useState(false)
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})

  const show = React.useCallback(
    (name: string) => submitted || Boolean(touched[name]),
    [submitted, touched]
  )

  const onBlur = React.useCallback((name: string) => {
    return () => {
      setTouched((current) => ({ ...current, [name]: true }))
    }
  }, [])

  const reset = React.useCallback(() => {
    setSubmitted(false)
    setTouched({})
  }, [])

  return { submitted, setSubmitted, show, onBlur, reset }
}
