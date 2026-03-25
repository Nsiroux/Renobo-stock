import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: alleen admin kan stock juist zetten.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { product_variant_id, location_id, quantity } = body

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
