"use client"

import { FormEvent, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

type ProductVariantOption = {
  id: string
  display_name: string
}

type Props = {
  variants: ProductVariantOption[]
}

export default function ReservationForm({ variants }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [productVariantId, setProductVariantId] = useState(variants[0]?.id ?? '')
  const [customerName, setCustomerName] = useState('')
  const [orderReference, setOrderReference] = useState('')
  const [quantity, setQuantity] = useState('')
  const [requestedDate, setRequestedDate] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function onSubmit(formData: FormData) {
    setError(null)
    setSuccess(null)

    const response = await fetch('/api/reservations', {
      method: 'POST',
      body: JSON.stringify({
        product_variant_id: formData.get('product_variant_id'),
        customer_name: formData.get('customer_name'),
        order_reference: formData.get('order_reference'),
        quantity: Number(formData.get('quantity')),
        requested_date: formData.get('requested_date') || null,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const responseText = await response.text()

    let result: { error?: string } = {}

    try {
      result = responseText ? JSON.parse(responseText) : {}
    } catch {
      if (!response.ok) {
        setError(responseText || 'Er liep iets mis bij het aanmaken van de reservatie.')
        return
      }
    }

    if (!response.ok) {
      setError(result.error ?? 'Er liep iets mis bij het aanmaken van de reservatie.')
      return
    }

    setSuccess('Reservatie succesvol aangemaakt.')
    setCustomerName('')
    setOrderReference('')
    setQuantity('')
    setRequestedDate('')
    if (variants[0]?.id) {
      setProductVariantId(variants[0].id)
    }

    startTransition(() => {
      router.refresh()
    })
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    await onSubmit(formData)
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-neutral-900">Nieuwe reservatie</h2>
      <p className="mt-2 text-sm text-neutral-600">
        Maak een reservatie aan op basis van beschikbare stock.
      </p>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
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
          <label className="mb-2 block text-sm font-medium text-neutral-700">Klantnaam</label>
          <input
            name="customer_name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">Orderreferentie</label>
          <input
            name="order_reference"
            value={orderReference}
            onChange={(e) => setOrderReference(e.target.value)}
            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
            required
          />
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
          <label className="mb-2 block text-sm font-medium text-neutral-700">Gewenste datum</label>
          <input
            name="requested_date"
            type="date"
            value={requestedDate}
            onChange={(e) => setRequestedDate(e.target.value)}
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
          {isPending ? 'Bezig...' : 'Reservatie aanmaken'}
        </button>
      </form>
    </div>
  )
}
