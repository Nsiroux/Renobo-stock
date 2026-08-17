import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
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

    if (!['admin', 'planner', 'operator'].includes(profile?.role ?? '')) {
      return NextResponse.json(
        { error: 'Forbidden: je mag geen reservaties wijzigen.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      reservation_id,
      customer_name,
      order_reference,
      quantity,
      requested_date,
    } = body

    if (!reservation_id || !customer_name || !order_reference || !quantity) {
      return NextResponse.json(
        { error: 'Vul alle verplichte velden in.' },
        { status: 400 }
      )
    }

    const { data: existingReservation, error: reservationError } = await supabase
      .from('reservations')
      .select('id, status')
      .eq('id', reservation_id)
      .maybeSingle()

    if (reservationError) {
      return NextResponse.json({ error: reservationError.message }, { status: 400 })
    }

    if (!existingReservation) {
      return NextResponse.json({ error: 'Reservatie niet gevonden.' }, { status: 404 })
    }

    if (!['reserved', 'partial'].includes(existingReservation.status)) {
      return NextResponse.json(
        { error: 'Alleen open reservaties kunnen gewijzigd worden.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('reservations')
      .update({
        customer_name,
        order_reference,
        quantity: Number(quantity),
        requested_date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservation_id)
      .select()
      .single()

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
            : 'Onverwachte fout bij wijzigen reservatie.',
      },
      { status: 500 }
    )
  }
}
