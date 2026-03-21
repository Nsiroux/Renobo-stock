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

    const body = await request.json()
    const {
      product_variant_id,
      customer_name,
      order_reference,
      quantity,
      requested_date,
    } = body

    if (!product_variant_id || !customer_name || !order_reference || !quantity) {
      return NextResponse.json(
        { error: 'Vul alle verplichte velden in.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.rpc('create_reservation', {
      p_product_variant_id: product_variant_id,
      p_customer_name: customer_name,
      p_order_reference: order_reference,
      p_quantity: quantity,
      p_requested_date: requested_date,
      p_notes: null,
      p_created_by: user.id,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Onverwachte fout bij aanmaken reservatie.',
      },
      { status: 500 }
    )
  }
}
