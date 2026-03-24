'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type ProductVariantOption = {
  id: string
  display_name: string
}

type LocationOption = {
  id: string
  name: string
}

type Props = {
  variants: ProductVariantOption[]
  locations: LocationOption[]
}

const reasons = [
  { value: 'levering', label: 'Levering' },
  { value: 'verbruik', label: 'Verbruik' },
  { value: 'beschadigd', label: 'Beschadigd' },
  { value: 'intern gebruik', label: 'Intern gebruik' },
] as const

export default function StockOutForm({ variants, locations }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [productVariantId, setProductVariantId] = useState(variants[0]?.id ?? '')
  const [fromLocationId, setFromLocationId] = useState(locations[0]?.id ?? '')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState<(typeof reasons)[number]['value']>('verbruik')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function submitStockOut(formData: FormData) {
    setError(null)
    setSuccess(null)

    const response = await fetch('/api/consumption', {
      method: 'POST',
      body: JSON.stringify({
        product_variant_id: formData.get('product_variant_id'),
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
      setError(result?.error ?? 'Er liep iets mis bij het afboeken.')
      return
    }

    setSuccess('Afboeking succesvol geregistreerd.')
    setQuantity('')
    setReason('verbruik')

    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-neutral-900">Afboeken</h2>
      <p className="mt-2 text-sm text-neutral-600">
        Boek stock uit voor levering, verbruik of intern gebruik.
      </p>

      <form
        className="mt-5 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          await submitStockOut(formData)
        }}
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">Productvariant</label>
          <select
            name="product_variant_id"
            value={productVariantId}
            onChange={(e) => setProductVariantId(e.target.value)}
            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
            required
          >
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.display_name}
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
          disabled={isPending}
          className="w-full rounded-2xl bg-[var(--brand)] px-4 py-3 font-medium text-white disabled:opacity-50"
        >
          {isPending ? 'Bezig...' : 'Afboeken'}
        </button>
      </form>
    </div>
  )
}
