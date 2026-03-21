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
      reservation_id,
      from_location_id,
      quantity,
      reason,
    } = body

    if (!reservation_id || !from_location_id || !quantity || !reason) {
      return NextResponse.json(
        { error: 'Vul alle verplichte velden in.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.rpc('deliver_reservation', {
      p_reservation_id: reservation_id,
      p_from_location_id: from_location_id,
      p_quantity: quantity,
      p_note: reason,
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
            : 'Onverwachte fout bij afboeken vanuit reservatie.',
      },
      { status: 500 }
    )
  }
}
