import Link from 'next/link'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'
import RenoboBrand from '@/components/RenoboBrand'
import StockAddForm from '@/components/StockAddForm'
import { createClient } from '@/lib/supabase/server'

type ProductVariantRow = {
  id: string
  display_name: string | null
  products: {
    name: string | null
    product_categories: {
      name: string | null
    } | null
  } | null
}

type StockSummaryRow = {
  product_variant_id: string
  display_name: string | null
  product_name: string | null
  category_name: string | null
  physical_stock: number
  reserved_stock: number
  available_stock: number
  stock_status: 'ok' | 'low' | 'critical'
}

type InventoryRow = {
  product_variant_id: string
  quantity: number
  location_id: string
  product_variants: {
    id: string
    display_name: string | null
    inventory_mode: string | null
    is_active: boolean | null
    products: {
      name: string | null
      product_categories: {
        name: string | null
      } | null
    } | null
  } | null
}

type LocationOption = {
  id: string
  name: string
}

type ReservationRow = {
  id: string
  customer_name: string | null
  order_reference: string | null
  quantity: number
  requested_date: string | null
  status: 'reserved' | 'partial' | 'delivered' | 'cancelled'
  product_variants: {
    id: string
    display_name: string | null
  } | null
}

function ReservationStatusBadge({ status }: { status: ReservationRow['status'] }) {
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

export default async function PanelenPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const [
    { data: variantsData, error: variantsError },
    { data: inventoryData, error: inventoryError },
    { data: summaryData, error: summaryError },
    { data: locationsData, error: locationsError },
    { data: reservationsData, error: reservationsError },
    { data: profileData, error: profileError },
  ] = await Promise.all([
    supabase
      .from('product_variants')
      .select('id, display_name, products(name, product_categories(name))')
      .eq('is_active', true)
      .eq('inventory_mode', 'simple')
      .order('display_name'),
    supabase
      .from('inventory')
      .select(
        'product_variant_id, quantity, location_id, product_variants!inner(id, display_name, inventory_mode, is_active, products(name, product_categories(name)))'
      )
      .eq('product_variants.inventory_mode', 'simple')
      .eq('product_variants.is_active', true),
    supabase
      .from('v_stock_summary')
      .select(
        'product_variant_id, display_name, product_name, category_name, physical_stock, reserved_stock, available_stock, stock_status'
      )
      .order('display_name'),
    supabase.from('locations').select('id, name').order('name'),
    supabase
      .from('reservations')
      .select(
        'id, customer_name, order_reference, quantity, requested_date, status, product_variants(id, display_name)'
      )
      .in('status', ['reserved', 'partial'])
      .order('requested_date', { ascending: true }),
    supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle(),
  ])

  if (variantsError || inventoryError || summaryError || locationsError || reservationsError || profileError) {
    const message =
      variantsError?.message ||
      inventoryError?.message ||
      summaryError?.message ||
      locationsError?.message ||
      reservationsError?.message ||
      profileError?.message ||
      'Onbekende fout'

    return (
      <main className="min-h-screen bg-neutral-50 p-6">
        <div className="mx-auto max-w-6xl rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold text-neutral-900">Renobo voorraad</h1>
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            Fout bij laden van panelen: {message}
          </p>
        </div>
      </main>
    )
  }

  const variants = ((variantsData ?? []) as ProductVariantRow[]).filter(
    (variant) => variant.products?.product_categories?.name === 'Panelen'
  )
  const inventoryRows = ((inventoryData ?? []) as InventoryRow[]).filter(
    (row) =>
      row.quantity > 0 &&
      row.product_variants?.products?.product_categories?.name === 'Panelen'
  )
  const locations = (locationsData ?? []) as LocationOption[]
  const canAddStock = profileData?.role === 'admin'
  const variantOptions = variants
    .filter((variant) => Boolean(variant.display_name))
    .map((variant) => ({
      id: variant.id,
      display_name: variant.display_name ?? 'Onbekende variant',
    }))
  const physicalStockByVariant = inventoryRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.product_variant_id] = (acc[row.product_variant_id] ?? 0) + row.quantity
    return acc
  }, {})
  const visibleVariants = ((summaryData ?? []) as StockSummaryRow[])
    .filter(
      (row) =>
        row.category_name === 'Panelen' &&
        (row.physical_stock > 0 || row.reserved_stock > 0)
    )
    .map((row) => ({
      id: row.product_variant_id,
      display_name: row.display_name,
      product_name: row.product_name ?? 'Paneel',
      totalStock: physicalStockByVariant[row.product_variant_id] ?? row.physical_stock,
      reservedStock: row.reserved_stock,
      availableStock: row.available_stock,
    }))
  const panelVariantIds = new Set(variants.map((variant) => variant.id))
  const reservations = ((reservationsData ?? []) as ReservationRow[]).filter(
    (reservation) => reservation.product_variants?.id && panelVariantIds.has(reservation.product_variants.id)
  )

  return (
    <main className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <RenoboBrand href="/panelen" />
              <h1 className="mt-4 text-3xl font-semibold text-neutral-900">Renobo voorraad</h1>
              <p className="mt-2 text-neutral-600">
                Overzicht van paneelvarianten. Tik op een kaart voor het detailoverzicht.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/"
                  className="rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-[var(--brand)]/40 hover:bg-white"
                >
                  Pads
                </Link>
                <span className="rounded-2xl bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white">
                  Panelen
                </span>
                <Link
                  href="/toebehoren"
                  className="rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-[var(--brand)]/40 hover:bg-white"
                >
                  Toebehoren
                </Link>
                <Link
                  href="/telefooncellen"
                  className="rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-[var(--brand)]/40 hover:bg-white"
                >
                  Telefooncellen
                </Link>
              </div>
            </div>

            <LogoutButton />
          </div>
        </div>

        {canAddStock && (
          <StockAddForm variants={variantOptions} locations={locations} />
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleVariants.map((variant) => {
            return (
              <Link
                key={variant.id}
                href={`/panelen/${variant.id}`}
                className="group block rounded-3xl focus-visible:outline-none"
              >
                <article className="rounded-3xl bg-white p-5 shadow-sm transition duration-150 group-hover:-translate-y-0.5 group-hover:shadow-md group-active:scale-[0.99] group-focus-visible:ring-2 group-focus-visible:ring-[var(--brand)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-neutral-500">{variant.product_name}</p>
                      <h2 className="mt-2 text-xl font-semibold text-neutral-900">
                        {variant.display_name ?? 'Onbekende variant'}
                      </h2>
                    </div>

                    <span className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-700 transition group-hover:border-neutral-300">
                      Open
                    </span>
                  </div>

                  <div className="mt-5 rounded-2xl bg-neutral-50 p-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-sm text-neutral-500">Fysiek</p>
                        <p className="mt-2 text-2xl font-semibold text-neutral-900">
                          {variant.totalStock}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500">Gereserveerd</p>
                        <p className="mt-2 text-2xl font-semibold text-neutral-900">
                          {variant.reservedStock}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500">Beschikbaar</p>
                        <p className="mt-2 text-2xl font-semibold text-[var(--brand)]">
                          {variant.availableStock}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            )
          })}

          {visibleVariants.length === 0 && (
            <div className="rounded-3xl bg-white px-5 py-10 text-center text-neutral-500 shadow-sm sm:col-span-2 xl:col-span-3">
              Geen paneelvarianten gevonden.
            </div>
          )}
        </div>

        <section className="space-y-4">
          <div className="rounded-3xl bg-white px-5 py-4 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900">Open reservaties</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Overzicht van alle open reservaties voor panelen.
            </p>
          </div>

          <div className="hidden overflow-hidden rounded-3xl bg-white shadow-sm md:block">
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
                  {reservations.map((reservation) => (
                    <tr key={reservation.id} className="border-t border-neutral-100">
                      <td className="px-5 py-4 font-medium text-neutral-900">
                        {reservation.product_variants?.display_name ?? 'Onbekend product'}
                      </td>
                      <td className="px-5 py-4 text-neutral-600">{reservation.customer_name ?? '-'}</td>
                      <td className="px-5 py-4 text-neutral-600">{reservation.order_reference ?? '-'}</td>
                      <td className="px-5 py-4 text-neutral-900">{reservation.quantity}</td>
                      <td className="px-5 py-4 text-neutral-600">{reservation.requested_date ?? '-'}</td>
                      <td className="px-5 py-4">
                        <ReservationStatusBadge status={reservation.status} />
                      </td>
                      <td className="px-5 py-4">
                        {reservation.product_variants?.id ? (
                          <Link
                            href={`/panelen/${reservation.product_variants.id}`}
                            className="rounded-2xl border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700"
                          >
                            Open detail
                          </Link>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  {reservations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-neutral-500">
                        Geen open reservaties voor panelen.
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
                      {reservation.product_variants?.display_name ?? 'Onbekend product'}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {reservation.customer_name ?? '-'}
                    </p>
                  </div>
                  <ReservationStatusBadge status={reservation.status} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-neutral-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-neutral-500">Orderref</p>
                    <p className="mt-1 text-sm font-medium text-neutral-900">
                      {reservation.order_reference ?? '-'}
                    </p>
                  </div>
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

                {reservation.product_variants?.id ? (
                  <div className="mt-4">
                    <Link
                      href={`/panelen/${reservation.product_variants.id}`}
                      className="inline-flex rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-700"
                    >
                      Open detail
                    </Link>
                  </div>
                ) : null}
              </article>
            ))}

            {reservations.length === 0 && (
              <div className="rounded-3xl bg-white px-5 py-10 text-center text-neutral-500 shadow-sm">
                Geen open reservaties voor panelen.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
