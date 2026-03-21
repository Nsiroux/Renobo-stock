'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type LocationOption = {
  id: string
  name: string
}

type ReservationOption = {
  id: string
  customer_name: string
  order_reference: string
  quantity: number
  status: 'reserved' | 'partial'
  product_variants: {
    display_name: string
  } | null
}

type Props = {
  reservations: ReservationOption[]
  locations: LocationOption[]
}

const reasons = [
  { value: 'levering', label: 'Levering' },
  { value: 'verbruik', label: 'Verbruik' },
  { value: 'beschadigd', label: 'Beschadigd' },
  { value: 'intern gebruik', label: 'Intern gebruik' },
] as const

export default function ReservationStockOutForm({
  reservations,
  locations,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [reservationId, setReservationId] = useState(reservations[0]?.id ?? '')
  const [fromLocationId, setFromLocationId] = useState(locations[0]?.id ?? '')
  const [quantity, setQuantity] = useState(
    reservations[0]?.quantity ? String(reservations[0].quantity) : ''
  )
  const [reason, setReason] = useState<(typeof reasons)[number]['value']>('levering')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function submitReservationStockOut(formData: FormData) {
    setError(null)
    setSuccess(null)

    const response = await fetch('/api/reservations/deliver', {
      method: 'POST',
      body: JSON.stringify({
        reservation_id: formData.get('reservation_id'),
        from_location_id: formData.get('from_location_id'),
        quantity: Number(formData.get('quantity')),
        reason: formData.get('reason'),
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const raw = await response.text()

    let result: { error?: string } | null = null
    try {
      result = raw ? JSON.parse(raw) : null
    } catch {
      result = { error: raw || 'Ongeldige serverrespons ontvangen.' }
    }

    if (!response.ok) {
      setError(result?.error ?? 'Er liep iets mis bij afboeken vanuit reservatie.')
      return
    }

    setSuccess('Afboeking vanuit reservatie succesvol geregistreerd.')
    if (reservations[0]?.id) {
      setReservationId(reservations[0].id)
      setQuantity(String(reservations[0].quantity))
    } else {
      setReservationId('')
      setQuantity('')
    }
    setReason('levering')

    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-neutral-900">Afboeken vanuit reservatie</h2>
      <p className="mt-2 text-sm text-neutral-600">
        Boek stock af vanuit een open reservatie en werk de reservatie meteen bij.
      </p>

      <form
        className="mt-5 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          await submitReservationStockOut(formData)
        }}
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">Reservatie</label>
          <select
            name="reservation_id"
            value={reservationId}
            onChange={(e) => {
              const newId = e.target.value
              setReservationId(newId)
              const selected = reservations.find((reservation) => reservation.id === newId)
              if (selected) {
                setQuantity(String(selected.quantity))
              }
            }}
            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
            required
          >
            {reservations.map((reservation) => (
              <option key={reservation.id} value={reservation.id}>
                {(reservation.product_variants?.display_name ?? 'Onbekend product')} · {reservation.customer_name} · {reservation.order_reference}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">Van locatie</label>
          <select
            name="from_location_id"
            value={fromLocationId}
            onChange={(e) => setFromLocationId(e.target.value)}
            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
            required
          >
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">Aantal</label>
          <input
            name="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">Reden</label>
          <select
            name="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value as (typeof reasons)[number]['value'])}
            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
            required
          >
            {reasons.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
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
          disabled={isPending || reservations.length === 0}
          className="w-full rounded-2xl bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
        >
          {isPending ? 'Bezig...' : 'Afboeken vanuit reservatie'}
        </button>
      </form>
    </div>
  )
}
