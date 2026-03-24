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

export default async function ToebehorenPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const [
    { data: variantsData, error: variantsError },
    { data: stockData, error: stockError },
    { data: locationsData, error: locationsError },
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
    supabase.from('locations').select('id, name').order('name'),
    supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle(),
  ])

  if (variantsError || stockError || locationsError || profileError) {
    const message =
      variantsError?.message ||
      stockError?.message ||
      locationsError?.message ||
      profileError?.message ||
      'Onbekende fout'

    return (
      <main className="min-h-screen bg-neutral-50 p-6">
        <div className="mx-auto max-w-6xl rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold text-neutral-900">Renobo voorraad</h1>
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            Fout bij laden van toebehoren: {message}
          </p>
        </div>
      </main>
    )
  }

  const variants = ((variantsData ?? []) as ProductVariantRow[]).filter(
    (variant) => variant.products?.product_categories?.name === 'Toebehoren'
  )
  const inventoryRows = ((stockData ?? []) as StockSummaryRow[]).filter(
    (row) =>
      row.quantity > 0 &&
      row.product_variants?.products?.product_categories?.name === 'Toebehoren'
  )
  const locations = (locationsData ?? []) as LocationOption[]
  const canAddStock = profileData?.role === 'admin' || profileData?.role === 'planner'
  const variantOptions = variants
    .filter((variant) => Boolean(variant.display_name))
    .map((variant) => ({
      id: variant.id,
      display_name: variant.display_name ?? 'Onbekende variant',
    }))
  const visibleVariants = Array.from(
    inventoryRows.reduce<
      Map<
        string,
        {
          id: string
          display_name: string | null
          product_name: string | null
          totalStock: number
        }
      >
    >((acc, row) => {
      const variant = row.product_variants

      if (!variant) {
        return acc
      }

      const existing = acc.get(row.product_variant_id)

      if (existing) {
        existing.totalStock += row.quantity
        return acc
      }

      acc.set(row.product_variant_id, {
        id: row.product_variant_id,
        display_name: variant.display_name,
        product_name: variant.products?.name ?? 'Toebehoren',
        totalStock: row.quantity,
      })

      return acc
    }, new Map()).values()
  )

  return (
    <main className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <RenoboBrand href="/toebehoren" />
              <h1 className="mt-4 text-3xl font-semibold text-neutral-900">Renobo voorraad</h1>
              <p className="mt-2 text-neutral-600">
                Overzicht van toebehoren. Tik op een kaart voor het detailoverzicht.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
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
                <span className="rounded-2xl bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white">
                  Toebehoren
                </span>
              </div>
            </div>

            <LogoutButton />
          </div>
        </div>

        {canAddStock && (
          <StockAddForm variants={variantOptions} locations={locations} />
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleVariants.map((variant) => (
            <Link
              key={variant.id}
              href={`/toebehoren/${variant.id}`}
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
                  <p className="text-sm text-neutral-500">Totale stock</p>
                  <p className="mt-2 text-3xl font-semibold text-neutral-900">
                    {variant.totalStock}
                  </p>
                </div>
              </article>
            </Link>
          ))}

          {visibleVariants.length === 0 && (
            <div className="rounded-3xl bg-white px-5 py-10 text-center text-neutral-500 shadow-sm sm:col-span-2 xl:col-span-3">
              Geen toebehoren gevonden.
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
