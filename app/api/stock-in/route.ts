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

    if (profile?.role !== 'admin' && profile?.role !== 'planner') {
      return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
    }

    const body = await request.json()
    const { product_variant_id, location_id, quantity } = body

    if (!product_variant_id || !location_id || !quantity) {
      return NextResponse.json(
        { error: 'Vul alle verplichte velden in.' },
        { status: 400 }
      )
    }

    if (Number(quantity) <= 0) {
      return NextResponse.json(
        { error: 'Quantity moet groter zijn dan 0.' },
        { status: 400 }
      )
    }

    const movementPayload = {
      product_variant_id,
      to_location_id: location_id,
      from_location_id: null,
      quantity: Number(quantity),
      type: 'stock_in',
      movement_type: 'stock_in',
      created_by: user.id,
    }

    let { error: movementError } = await supabase.from('stock_movements').insert(movementPayload)

    if (
      movementError?.message.includes("Could not find the 'movement_type' column") ||
      movementError?.message.includes('schema cache') ||
      movementError?.message.includes('invalid input value for enum movement_type')
    ) {
      const fallbackResult = await supabase.from('stock_movements').insert({
        product_variant_id,
        to_location_id: location_id,
        from_location_id: null,
        quantity: Number(quantity),
        type: 'stock_in',
        created_by: user.id,
      })

      movementError = fallbackResult.error
    }

    if (movementError) {
      return NextResponse.json({ error: movementError.message }, { status: 400 })
    }

    const { data: existingRow, error: existingError } = await supabase
      .from('inventory')
      .select('id, quantity')
      .eq('product_variant_id', product_variant_id)
      .eq('location_id', location_id)
      .maybeSingle()

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 400 })
    }

    const result = existingRow
      ? await supabase
          .from('inventory')
          .update({
            quantity: Number(existingRow.quantity) + Number(quantity),
          })
          .eq('id', existingRow.id)
      : await supabase.from('inventory').insert({
          product_variant_id,
          location_id,
          quantity: Number(quantity),
        })

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
            : 'Onverwachte fout bij stock toevoegen.',
      },
      { status: 500 }
    )
  }
}
