import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/admin'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
    }

    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'Geen admin-toegang.' }, { status: 403 })
    }

    const body = await request.json()
    const { product_variant_id, location_id, quantity, note } = body

    if (!product_variant_id || !location_id || quantity === undefined || quantity === null) {
      return NextResponse.json(
        { error: 'Vul alle verplichte velden in.' },
        { status: 400 }
      )
    }

    const { data: existingRow, error: existingError } = await supabase
      .from('inventory')
      .select('id')
      .eq('product_variant_id', product_variant_id)
      .eq('location_id', location_id)
      .maybeSingle()

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 400 })
    }

    const payload = {
      product_variant_id,
      location_id,
      quantity,
      note,
    }

    const result = existingRow
      ? await supabase.from('inventory').update(payload).eq('id', existingRow.id)
      : await supabase.from('inventory').insert(payload)

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Onverwachte fout bij stock correctie.',
      },
      { status: 500 }
    )
  }
}
