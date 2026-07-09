import { useCallback, useState } from 'react'

export function useToast() {
  const [message, setMessage] = useState<string | null>(null)

  const show = useCallback((text: string) => {
    setMessage(text)
    window.setTimeout(() => setMessage(null), 2800)
  }, [])

  const dismiss = useCallback(() => setMessage(null), [])

  return { message, show, dismiss }
}
