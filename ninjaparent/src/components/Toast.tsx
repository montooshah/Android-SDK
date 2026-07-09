interface ToastProps {
  message: string | null
}

export function Toast({ message }: ToastProps) {
  if (!message) return null

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-24 z-[60] mx-auto max-w-sm animate-fade-up rounded-2xl bg-ink px-4 py-3 text-center text-sm font-medium text-white shadow-xl lg:bottom-8"
    >
      {message}
    </div>
  )
}
