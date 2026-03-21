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
    const { reservation_id, status } = body

    if (!reservation_id || !status) {
      return NextResponse.json(
        { error: 'Vul alle verplichte velden in.' },
        { status: 400 }
      )
    }

    if (status !== 'delivered' && status !== 'cancelled') {
      return NextResponse.json(
        { error: 'Ongeldige status.' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', reservation_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Onverwachte fout bij afsluiten reservatie.',
      },
      { status: 500 }
    )
  }
}
