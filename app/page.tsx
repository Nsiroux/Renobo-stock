import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReservationForm from '@/components/ReservationForm'
import ReservationStockOutForm from '@/components/ReservationStockOutForm'
import StockOutForm from '@/components/StockOutForm'
import TransferForm from '@/components/TransferForm'
import LogoutButton from '@/components/LogoutButton'
import MobileQuickActions from '@/components/MobileQuickActions'
import AdminStockSetForm from '@/components/AdminStockSetForm'
import CloseReservationAction from '@/components/CloseReservationAction'
import { isAdminUser } from '@/lib/admin'

type StockRow = {
  product_variant_id: string
  display_name: string
  product_name: string | null
  category_name: string | null
  color_name: string | null
  min_stock: number
  physical_stock: number
  reserved_stock: number
  available_stock: number
  stock_status: 'ok' | 'low' | 'critical'
}

type ReservationRow = {
  id: string
  customer_name: string
  order_reference: string
  quantity: number
  status: 'reserved' | 'partial' | 'delivered' | 'cancelled'
  requested_date: string | null
  product_variants: {
    display_name: string | null
  } | null
}

type ProductVariantOption = {
  id: string
  display_name: string
}

type InventoryRow = {
  product_variant_id: string
  quantity: number
  locations: {
    name: string
  } | null
}

type LocationOption = {
  id: string
  name: string
}

const locationColumns = ['LUC', 'Renobo 1', 'Renobo 2', 'Acoustiq'] as const
const padVariantNames = [
  'Pad Cool White 40mm',
  'Pad Night Black 40mm',
  'Pad Concrete Grey 40mm',
  'Pad Marble 40mm',
] as const

function StatusBadge({ status }: { status: StockRow['stock_status'] }) {
  const styles =
    status === 'critical'
      ? 'bg-red-100 text-red-700 border-red-200'
      : status === 'low'
      ? 'bg-amber-100 text-amber-700 border-amber-200'
      : 'bg-emerald-100 text-emerald-700 border-emerald-200'

  const label =
    status === 'critical' ? 'Kritiek' : status === 'low' ? 'Laag' : 'OK'

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${styles}`}>
      {label}
    </span>
  )
}

function ReservationStatusBadge({
  status,
}: {
  status: ReservationRow['status']
}) {
  const styles =
    status === 'partial'
      ? 'bg-amber-100 text-amber-700 border-amber-200'
      : 'bg-blue-100 text-blue-700 border-blue-200'

  const label = status === 'partial' ? 'Deels geleverd' : 'Gereserveerd'

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${styles}`}>
      {label}
    </span>
  )
}

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const isAdmin = isAdminUser(session.user)

  const [
    { data: stockData, error: stockError },
    { data: reservationsData, error: reservationsError },
    { data: variantsData, error: variantsError },
    { data: locationsData, error: locationsError },
    { data: inventoryData, error: inventoryError },
  ] = await Promise.all([
    supabase.from('v_stock_summary').select('*').order('display_name'),
    supabase
      .from('reservations')
      .select(
        'id, customer_name, order_reference, quantity, status, requested_date, product_variants(display_name)'
      )
      .in('status', ['reserved', 'partial'])
      .order('created_at', { ascending: false }),
    supabase.from('product_variants').select('id, display_name').eq('active', true).order('display_name'),
    supabase.from('locations').select('id, name').order('name'),
    supabase
      .from('inventory')
      .select('product_variant_id, quantity, locations(name)'),
  ])

  if (stockError) {
    return (
      <main className="min-h-screen bg-neutral-50 p-6">
        <div className="mx-auto max-w-6xl rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold text-neutral-900">Renobo voorraad</h1>
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            Fout bij laden van voorraad: {stockError.message}
          </p>
        </div>
      </main>
    )
  }

  if (reservationsError) {
    return (
      <main className="min-h-screen bg-neutral-50 p-6">
        <div className="mx-auto max-w-6xl rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold text-neutral-900">Renobo voorraad</h1>
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            Fout bij laden van reservaties: {reservationsError.message}
          </p>
        </div>
      </main>
    )
  }

  if (variantsError) {
    return (
      <main className="min-h-screen bg-neutral-50 p-6">
        <div className="mx-auto max-w-6xl rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold text-neutral-900">Renobo voorraad</h1>
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            Fout bij laden van productvarianten: {variantsError.message}
          </p>
        </div>
      </main>
    )
  }

  if (locationsError) {
    return (
      <main className="min-h-screen bg-neutral-50 p-6">
        <div className="mx-auto max-w-6xl rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold text-neutral-900">Renobo voorraad</h1>
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            Fout bij laden van locaties: {locationsError.message}
          </p>
        </div>
      </main>
    )
  }

  if (inventoryError) {
    return (
      <main className="min-h-screen bg-neutral-50 p-6">
        <div className="mx-auto max-w-6xl rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold text-neutral-900">Renobo voorraad</h1>
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            Fout bij laden van voorraad per locatie: {inventoryError.message}
          </p>
        </div>
      </main>
    )
  }

  const stockRows = (stockData ?? []) as StockRow[]
  const reservationRows = (reservationsData ?? []) as ReservationRow[]
  const variantOptions = (variantsData ?? []) as ProductVariantOption[]
  const inventoryRows = (inventoryData ?? []) as InventoryRow[]
  const locationOptions = (locationsData ?? []) as LocationOption[]
  const inventoryByVariant = inventoryRows.reduce<Record<string, Record<string, number>>>(
    (acc, row) => {
      const locationName = row.locations?.name

      if (!locationName || !locationColumns.includes(locationName as (typeof locationColumns)[number])) {
        return acc
      }

      if (!acc[row.product_variant_id]) {
        acc[row.product_variant_id] = {
          LUC: 0,
          'Renobo 1': 0,
          'Renobo 2': 0,
          Acoustiq: 0,
        }
      }

      acc[row.product_variant_id][locationName] =
        (acc[row.product_variant_id][locationName] ?? 0) + row.quantity

      return acc
    },
    {}
  )
  const padStockRows = padVariantNames
    .map((name) => stockRows.find((row) => row.display_name === name))
    .filter((row): row is StockRow => Boolean(row))
  const padVariantIds = new Set(padStockRows.map((row) => row.product_variant_id))
  const padReservationRows = reservationRows.filter((row) => {
    const displayName = row.product_variants?.display_name

    return Boolean(displayName && padVariantNames.includes(displayName as (typeof padVariantNames)[number]))
  })
  const padVariantOptions = variantOptions.filter((variant) => padVariantIds.has(variant.id))
  const totals = {
    physical: padStockRows.reduce((sum, row) => sum + row.physical_stock, 0),
    reserved: padStockRows.reduce((sum, row) => sum + row.reserved_stock, 0),
    available: padStockRows.reduce((sum, row) => sum + row.available_stock, 0),
  }

  return (
    <main className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-neutral-900">Renobo voorraad</h1>
              <p className="mt-2 text-neutral-600">
                Overzicht van fysieke stock, reservaties en beschikbare voorraad.
              </p>
            </div>

            <LogoutButton />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-500">Totale fysieke stock</p>
            <p className="mt-2 text-3xl font-semibold">
              {totals.physical}
            </p>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-500">Totale gereserveerde stock</p>
            <p className="mt-2 text-3xl font-semibold">
              {totals.reserved}
            </p>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-500">Totale beschikbare stock</p>
            <p className="mt-2 text-3xl font-semibold">
              {totals.available}
            </p>
          </div>
        </div>

        <section className="space-y-4">
          <div className="rounded-3xl bg-white px-5 py-4 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900">Pad voorraad</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Dagelijks overzicht van actieve padvarianten per locatie.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {padStockRows.map((row) => {
              const locationBreakdown = inventoryByVariant[row.product_variant_id] ?? {
                LUC: 0,
                'Renobo 1': 0,
                'Renobo 2': 0,
                Acoustiq: 0,
              }

              const availableStyles =
                row.stock_status === 'critical'
                  ? 'text-red-700'
                  : row.stock_status === 'low'
                  ? 'text-amber-700'
                  : 'text-emerald-700'

              return (
                <article key={row.product_variant_id} className="rounded-3xl bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-semibold text-neutral-900">{row.display_name}</h3>
                        <StatusBadge status={row.stock_status} />
                      </div>
                      <p className="mt-2 text-sm text-neutral-500">
                        {row.product_name ?? 'Pad'}{row.color_name ? ` · ${row.color_name}` : ''}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                        Beschikbaar
                      </p>
                      <p className={`mt-1 text-3xl font-semibold ${availableStyles}`}>
                        {row.available_stock}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-neutral-50 p-4">
                      <p className="text-sm text-neutral-500">Fysieke stock</p>
                      <p className="mt-2 text-2xl font-semibold text-neutral-900">
                        {row.physical_stock}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-neutral-50 p-4">
                      <p className="text-sm text-neutral-500">Gereserveerd</p>
                      <p className="mt-2 text-2xl font-semibold text-neutral-900">
                        {row.reserved_stock}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-neutral-50 p-4">
                      <p className="text-sm text-neutral-500">Minimum</p>
                      <p className="mt-2 text-2xl font-semibold text-neutral-900">
                        {row.min_stock}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-neutral-50 p-4">
                      <p className="text-sm text-neutral-500">Status</p>
                      <div className="mt-3">
                        <StatusBadge status={row.stock_status} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {locationColumns.map((location) => (
                      <div key={location} className="rounded-2xl border border-neutral-200 px-4 py-3">
                        <p className="text-sm text-neutral-500">{location}</p>
                        <p className="mt-2 text-2xl font-semibold text-neutral-900">
                          {locationBreakdown[location]}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              )
            })}

            {padStockRows.length === 0 && (
              <div className="rounded-3xl bg-white px-5 py-10 text-center text-neutral-500 shadow-sm">
                Geen padvarianten gevonden in de huidige voorraadweergave.
              </div>
            )}
          </div>
        </section>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="border-b border-neutral-100 px-5 py-4">
            <h2 className="text-xl font-semibold text-neutral-900">Open reservaties</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-neutral-100 text-sm text-neutral-600">
                <tr>
                  <th className="px-5 py-4 font-medium">Product</th>
                  <th className="px-5 py-4 font-medium">Klant</th>
                  <th className="px-5 py-4 font-medium">Orderref</th>
                  <th className="px-5 py-4 font-medium">Aantal</th>
                  <th className="px-5 py-4 font-medium">Datum</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Actie</th>
                </tr>
              </thead>
              <tbody>
                {padReservationRows.map((row) => (
                  <tr key={row.id} className="border-t border-neutral-100">
                    <td className="px-5 py-4 font-medium text-neutral-900">
                      {row.product_variants?.display_name ?? '-'}
                    </td>
                    <td className="px-5 py-4 font-medium text-neutral-900">{row.customer_name}</td>
                    <td className="px-5 py-4 text-neutral-600">{row.order_reference}</td>
                    <td className="px-5 py-4 text-neutral-900">{row.quantity}</td>
                    <td className="px-5 py-4 text-neutral-600">{row.requested_date ?? '-'}</td>
                    <td className="px-5 py-4">
                      <ReservationStatusBadge status={row.status} />
                    </td>
                    <td className="px-5 py-4">
                      <CloseReservationAction reservationId={row.id} />
                    </td>
                  </tr>
                ))}
                {padReservationRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-neutral-500">
                      Geen open reservaties.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <MobileQuickActions
          variants={padVariantOptions}
          locations={locationOptions}
          reservations={padReservationRows}
        />

        <div className="hidden gap-6 xl:grid-cols-2 xl:grid 2xl:grid-cols-4">
          <ReservationForm variants={padVariantOptions} />
          <StockOutForm variants={padVariantOptions} locations={locationOptions} />
          <ReservationStockOutForm reservations={padReservationRows} locations={locationOptions} />
          <TransferForm variants={padVariantOptions} locations={locationOptions} />
        </div>

        {isAdmin && (
          <div className="xl:max-w-md">
            <AdminStockSetForm variants={padStockRows.map((row) => ({
              id: row.product_variant_id,
              display_name: row.display_name,
            }))} locations={locationOptions} />
          </div>
        )}
      </div>
    </main>
  )
}
