"use client"

import { FormEvent, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

type Props = {
  reservation: {
    id: string
    customer_name: string | null
    order_reference: string | null
    quantity: number
    requested_date: string | null
    status: 'reserved' | 'partial' | 'delivered' | 'cancelled'
  }
}

export default function ReservationEditForm({ reservation }: Props) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [customerName, setCustomerName] = useState(reservation.customer_name ?? '')
  const [orderReference, setOrderReference] = useState(reservation.order_reference ?? '')
  const [quantity, setQuantity] = useState(String(reservation.quantity))
  const [requestedDate, setRequestedDate] = useState(reservation.requested_date ?? '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    const response = await fetch('/api/reservations/update', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reservation_id: reservation.id,
        customer_name: customerName,
        order_reference: orderReference,
        quantity: Number(quantity),
        requested_date: requestedDate || null,
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
      setError(result?.error ?? 'Er liep iets mis bij het wijzigen van de reservatie.')
      return
    }

    setSuccess('Reservatie succesvol bijgewerkt.')

    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => {
          setIsOpen((current) => !current)
          setError(null)
          setSuccess(null)
        }}
        className="rounded-2xl border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700"
      >
        {isOpen ? 'Sluiten' : 'Wijzigen'}
      </button>

      {isOpen && (
        <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">Klantnaam</label>
            <input
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">Orderreferentie</label>
            <input
              value={orderReference}
              onChange={(event) => setOrderReference(event.target.value)}
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">Aantal</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">Gewenste datum</label>
            <input
              type="date"
              value={requestedDate}
              onChange={(event) => setRequestedDate(event.target.value)}
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-2xl bg-[var(--brand)] px-4 py-3 font-medium text-white disabled:opacity-50"
          >
            {isPending ? 'Bezig...' : 'Reservatie opslaan'}
          </button>
        </form>
      )}
    </div>
  )
}
