'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  reservationId: string
}

const options = [
  { value: 'delivered', label: 'Volledig verwerkt' },
  { value: 'cancelled', label: 'Geannuleerd' },
] as const

export default function CloseReservationAction({ reservationId }: Props) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleClose(status: (typeof options)[number]['value']) {
    setError(null)

    const response = await fetch('/api/reservations/close', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reservation_id: reservationId,
        status,
      }),
    })

    const raw = await response.text()
    let result: { error?: string } | null = null

    try {
      result = raw ? JSON.parse(raw) : null
    } catch {
      result = { error: raw || 'Ongeldige serverrespons ontvangen.' }
    }

    if (!response.ok) {
      setError(result?.error ?? 'Er liep iets mis bij het afsluiten van de reservatie.')
      return
    }

    setIsOpen(false)
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="min-w-[170px]">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="rounded-2xl border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700"
      >
        Afsluiten
      </button>

      {isOpen && (
        <div className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
          <div className="space-y-2">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={isPending}
                onClick={() => void handleClose(option.value)}
                className="w-full rounded-xl bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {option.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
