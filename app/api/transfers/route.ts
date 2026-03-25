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
      return NextResponse.json(
        { error: 'Niet ingelogd.' },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    if (!['admin', 'planner', 'operator'].includes(profile?.role ?? '')) {
      return NextResponse.json(
        { error: 'Forbidden: je mag geen stock transfer registreren.' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const {
      product_variant_id,
      from_location_id,
      to_location_id,
      quantity,
    } = body

    if (!product_variant_id || !from_location_id || !to_location_id || !quantity) {
      return NextResponse.json(
        { error: 'Vul alle verplichte velden in.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.rpc('transfer_stock', {
      p_product_variant_id: product_variant_id,
      p_from_location_id: from_location_id,
      p_to_location_id: to_location_id,
      p_quantity: quantity,
      p_reference: null,
      p_note: null,
      p_created_by: user.id,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Onverwachte fout bij transfer.',
      },
      { status: 500 }
    )
  }
}
