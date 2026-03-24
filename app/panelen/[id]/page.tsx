import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'
import RenoboBrand from '@/components/RenoboBrand'
import ReservationForm from '@/components/ReservationForm'
import ReservationStockOutForm from '@/components/ReservationStockOutForm'
import StockOutForm from '@/components/StockOutForm'
import TransferForm from '@/components/TransferForm'
import { createClient } from '@/lib/supabase/server'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

type ProductVariantRow = {
  id: string
  display_name: string | null
}

type StockSummaryRow = {
  product_variant_id: string
  physical_stock: number
}

type InventoryRow = {
  quantity: number
  locations: {
    id: string
    name: string | null
  } | null
}

type LocationRow = {
  id: string
  name: string
}

type ProductVariantOption = {
  id: string
  display_name: string
}

type ReservationRow = {
  id: string
  customer_name: string | null
  order_reference: string | null
  quantity: number
  requested_date: string | null
  status: 'reserved' | 'partial' | 'delivered' | 'cancelled'
}

function ReservationStatusBadge({ status }: { status: ReservationRow['status'] }) {
  const styles =
    status === 'cancelled'
      ? 'bg-red-100 text-red-700 border-red-200'
      : status === 'delivered'
        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
        : status === 'partial'
          ? 'bg-amber-100 text-amber-700 border-amber-200'
          : 'bg-blue-100 text-blue-700 border-blue-200'

  const label =
    status === 'cancelled'
      ? 'Geannuleerd'
      : status === 'delivered'
        ? 'Verwerkt'
        : status === 'partial'
          ? 'Deels geleverd'
          : 'Gereserveerd'

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${styles}`}>
      {label}
    </span>
  )
}

export default async function PanelDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const [
    { data: variantData, error: variantError },
    { data: summaryData, error: summaryError },
    { data: locationsData, error: locationsError },
    { data: inventoryData, error: inventoryError },
    { data: reservationsData, error: reservationsError },
  ] = await Promise.all([
    supabase
      .from('product_variants')
      .select('id, display_name')
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('v_stock_summary')
      .select('product_variant_id, physical_stock')
      .eq('product_variant_id', id)
      .maybeSingle(),
    supabase.from('locations').select('id, name').order('name'),
    supabase
      .from('inventory')
      .select('quantity, locations(id, name)')
      .eq('product_variant_id', id),
    supabase
      .from('reservations')
      .select('id, customer_name, order_reference, quantity, requested_date, status')
      .eq('product_variant_id', id)
      .order('requested_date', { ascending: true }),
  ])

  if (variantError || summaryError || locationsError || inventoryError || reservationsError) {
    const message =
      variantError?.message ||
      summaryError?.message ||
      locationsError?.message ||
      inventoryError?.message ||
      reservationsError?.message ||
      'Onbekende fout'

    return (
      <main className="min-h-screen bg-neutral-50 p-6">
        <div className="mx-auto max-w-5xl rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold text-neutral-900">Paneel detail</h1>
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            Fout bij laden van paneelgegevens: {message}
          </p>
        </div>
      </main>
    )
  }

  const variant = variantData as ProductVariantRow | null

  if (!variant) {
    notFound()
  }

  const stockSummary = summaryData as StockSummaryRow | null
  const locations = (locationsData ?? []) as LocationRow[]
  const inventoryRows = (inventoryData ?? []) as InventoryRow[]
  const reservations = (reservationsData ?? []) as ReservationRow[]
  const variantOptions: ProductVariantOption[] = [
    {
      id: variant.id,
      display_name: variant.display_name ?? 'Onbekende variant',
    },
  ]
  const openReservations = reservations
    .filter((reservation) => reservation.status === 'reserved' || reservation.status === 'partial')
    .map((reservation) => ({
      id: reservation.id,
      customer_name: reservation.customer_name ?? '-',
      order_reference: reservation.order_reference ?? '-',
      quantity: reservation.quantity,
      status: reservation.status,
      product_variants: {
        display_name: variant.display_name ?? 'Onbekend product',
      },
    }))
  const stockPerLocation = locations.map((location) => {
    const total = inventoryRows
      .filter((row) => row.locations?.id === location.id)
      .reduce((sum, row) => sum + row.quantity, 0)

    return {
      id: location.id,
      name: location.name,
      quantity: total,
    }
  })
  const totalStock =
    stockSummary?.physical_stock ?? stockPerLocation.reduce((sum, location) => sum + location.quantity, 0)

  return (
    <main className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/"
                  className="rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-[var(--brand)]/40 hover:bg-white"
                >
                  Pads
                </Link>
                <Link
                  href="/panelen"
                  className="rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-[var(--brand)]/40 hover:bg-white"
                >
                  Panelen
                </Link>
              </div>
              <div className="mt-4">
                <RenoboBrand href="/panelen" compact />
              </div>
              <h1 className="mt-3 text-3xl font-semibold text-neutral-900">Renobo voorraad</h1>
              <h2 className="mt-3 text-2xl font-semibold text-neutral-900">
                {variant.display_name ?? 'Onbekend paneel'}
              </h2>
              <p className="mt-2 text-neutral-600">
                Detailoverzicht van voorraad en reservaties voor deze variant.
              </p>
            </div>

            <LogoutButton />
          </div>
        </div>

        <section className="space-y-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-500">Totale stock</p>
            <p className="mt-2 text-4xl font-semibold text-neutral-900">{totalStock}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stockPerLocation.map((location) => (
              <div key={location.id} className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-sm text-neutral-500">{location.name}</p>
                <p className="mt-2 text-3xl font-semibold text-neutral-900">{location.quantity}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-3xl bg-white px-5 py-4 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900">Acties</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Werk reservaties, afboekingen en transfers voor deze variant meteen bij.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ReservationForm variants={variantOptions} />
            <ReservationStockOutForm reservations={openReservations} locations={locations} />
            <StockOutForm variants={variantOptions} locations={locations} />
            <TransferForm variants={variantOptions} locations={locations} />
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-3xl bg-white px-5 py-4 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900">Reservaties</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Alle reservaties gekoppeld aan deze productvariant.
            </p>
          </div>

          <div className="hidden overflow-hidden rounded-3xl bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-neutral-100 text-sm text-neutral-600">
                  <tr>
                    <th className="px-5 py-4 font-medium">Klant</th>
                    <th className="px-5 py-4 font-medium">Orderref</th>
                    <th className="px-5 py-4 font-medium">Aantal</th>
                    <th className="px-5 py-4 font-medium">Datum</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((reservation) => (
                    <tr key={reservation.id} className="border-t border-neutral-100">
                      <td className="px-5 py-4 font-medium text-neutral-900">
                        {reservation.customer_name ?? '-'}
                      </td>
                      <td className="px-5 py-4 text-neutral-600">
                        {reservation.order_reference ?? '-'}
                      </td>
                      <td className="px-5 py-4 text-neutral-900">{reservation.quantity}</td>
                      <td className="px-5 py-4 text-neutral-600">
                        {reservation.requested_date ?? '-'}
                      </td>
                      <td className="px-5 py-4">
                        <ReservationStatusBadge status={reservation.status} />
                      </td>
                    </tr>
                  ))}
                  {reservations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-neutral-500">
                        Geen reservaties gevonden voor deze productvariant.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4 md:hidden">
            {reservations.map((reservation) => (
              <article key={reservation.id} className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-neutral-900">
                      {reservation.customer_name ?? '-'}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {reservation.order_reference ?? '-'}
                    </p>
                  </div>
                  <ReservationStatusBadge status={reservation.status} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-neutral-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-neutral-500">Aantal</p>
                    <p className="mt-1 text-xl font-semibold text-neutral-900">
                      {reservation.quantity}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-neutral-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-neutral-500">Datum</p>
                    <p className="mt-1 text-sm font-medium text-neutral-900">
                      {reservation.requested_date ?? '-'}
                    </p>
                  </div>
                </div>
              </article>
            ))}

            {reservations.length === 0 && (
              <div className="rounded-3xl bg-white px-5 py-10 text-center text-neutral-500 shadow-sm">
                Geen reservaties gevonden voor deze productvariant.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
