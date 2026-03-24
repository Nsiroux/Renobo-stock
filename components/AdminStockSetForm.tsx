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

export default function AdminStockSetForm({ variants, locations }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [productVariantId, setProductVariantId] = useState(variants[0]?.id ?? '')
  const [locationId, setLocationId] = useState(locations[0]?.id ?? '')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function submitStockSet(formData: FormData) {
    setError(null)
    setSuccess(null)

    const response = await fetch('/api/admin/stock-set', {
      method: 'POST',
      body: JSON.stringify({
        product_variant_id: formData.get('product_variant_id'),
        location_id: formData.get('location_id'),
        quantity: Number(formData.get('quantity')),
        note: formData.get('note') || null,
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
      setError(result?.error ?? 'Er liep iets mis bij het juist zetten van de stock.')
      return
    }

    setSuccess('Stock succesvol juist gezet.')
    setQuantity('')
    setNote('')

    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-neutral-900">Stock juist zetten</h2>
      <p className="mt-2 text-sm text-neutral-600">
        Alleen voor admin: stel de fysieke stock rechtstreeks in voor een pad en locatie.
      </p>

      <form
        className="mt-5 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          await submitStockSet(formData)
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
          <label className="mb-2 block text-sm font-medium text-neutral-700">Locatie</label>
          <select
            name="location_id"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
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
          <label className="mb-2 block text-sm font-medium text-neutral-700">Quantity</label>
          <input
            name="quantity"
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">Note</label>
          <input
            name="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
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
          {isPending ? 'Bezig...' : 'Stock juist zetten'}
        </button>
      </form>
    </div>
  )
}
