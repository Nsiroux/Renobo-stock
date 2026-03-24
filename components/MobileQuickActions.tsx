'use client'

import { useState } from 'react'
import ReservationForm from '@/components/ReservationForm'
import ReservationStockOutForm from '@/components/ReservationStockOutForm'
import StockOutForm from '@/components/StockOutForm'
import TransferForm from '@/components/TransferForm'

type ProductVariantOption = {
  id: string
  display_name: string
}

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
  variants: ProductVariantOption[]
  locations: LocationOption[]
  reservations: ReservationOption[]
}

const tabs = [
  { key: 'stockout', label: 'Afboeken' },
  { key: 'reservation-stockout', label: 'Afboeken vanuit reservatie' },
  { key: 'transfer', label: 'Transfer' },
  { key: 'reservation', label: 'Reservatie' },
] as const

type TabKey = (typeof tabs)[number]['key']

export default function MobileQuickActions({
  variants,
  locations,
  reservations,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('stockout')

  return (
    <section className="space-y-4 xl:hidden">
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-neutral-900">Snelle acties</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Wissel snel tussen de dagelijkse pad acties.
        </p>
      </div>

      <div className="sticky bottom-3 z-20 rounded-3xl border border-neutral-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <div className="grid grid-cols-2 gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-2xl px-4 py-4 text-sm font-medium ${
                activeTab === tab.key
                  ? 'bg-[var(--brand)] text-white'
                  : 'border border-neutral-300 bg-white text-neutral-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'stockout' && <StockOutForm variants={variants} locations={locations} />}
      {activeTab === 'reservation-stockout' && (
        <ReservationStockOutForm reservations={reservations} locations={locations} />
      )}
      {activeTab === 'transfer' && (
        <TransferForm variants={variants} locations={locations} />
      )}
      {activeTab === 'reservation' && <ReservationForm variants={variants} />}
    </section>
  )
}
