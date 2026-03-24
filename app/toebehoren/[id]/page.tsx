import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import AdminStockSetForm from '@/components/AdminStockSetForm'
import LogoutButton from '@/components/LogoutButton'
import RenoboBrand from '@/components/RenoboBrand'
import StockAddForm from '@/components/StockAddForm'
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

export default async function ToebehorenDetailPage({ params }: PageProps) {
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
    { data: profileData, error: profileError },
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
    supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle(),
  ])

  if (variantError || summaryError || locationsError || inventoryError || profileError) {
    const message =
      variantError?.message ||
      summaryError?.message ||
      locationsError?.message ||
      inventoryError?.message ||
      profileError?.message ||
      'Onbekende fout'

    return (
      <main className="min-h-screen bg-neutral-50 p-6">
        <div className="mx-auto max-w-5xl rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold text-neutral-900">Toebehoren detail</h1>
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            Fout bij laden van toebehoren: {message}
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
  const variantOptions: ProductVariantOption[] = [
    {
      id: variant.id,
      display_name: variant.display_name ?? 'Onbekende variant',
    },
  ]
  const role = profileData?.role
  const canAddStock = role === 'admin' || role === 'planner'
  const canConsume = role === 'admin' || role === 'planner' || role === 'operator'
  const canTransfer = role === 'admin' || role === 'planner'
  const canSetStock = role === 'admin' || role === 'planner'
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
                <Link
                  href="/toebehoren"
                  className="rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-[var(--brand)]/40 hover:bg-white"
                >
                  Toebehoren
                </Link>
              </div>
              <div className="mt-4">
                <RenoboBrand href="/toebehoren" compact />
              </div>
              <h1 className="mt-3 text-3xl font-semibold text-neutral-900">Renobo voorraad</h1>
              <h2 className="mt-3 text-2xl font-semibold text-neutral-900">
                {variant.display_name ?? 'Onbekend toebehoren'}
              </h2>
              <p className="mt-2 text-neutral-600">
                Detailoverzicht van voorraad en reservaties voor dit toebehoren.
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
              Beheer stockbewegingen voor dit toebehoren vanuit een eenvoudige voorraadflow.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {canAddStock && (
              <StockAddForm variants={variantOptions} locations={locations} />
            )}
            {canConsume && (
              <StockOutForm variants={variantOptions} locations={locations} />
            )}
            {canTransfer && (
              <TransferForm variants={variantOptions} locations={locations} />
            )}
            {canSetStock && (
              <AdminStockSetForm variants={variantOptions} locations={locations} />
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
