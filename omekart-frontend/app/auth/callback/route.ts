import { createActionClient } from '@/lib/supabase/server-action' // Read-write
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const supabase = await createActionClient()

  // ---- 1. Handle Supabase email confirmation ----
  const code = searchParams.get('code')
  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
    return NextResponse.redirect(new URL('/home', request.url))
  }

  // ---- 2. Handle payment callback from Paystack ----
  const reference = searchParams.get('reference')
  const order_id = searchParams.get('order_id')

  if (reference && order_id) {
    const { data: order, error } = await supabase
      .from('orders')
      .select('payment_status')
      .eq('id', order_id)
      .single()

    if (error) {
      return NextResponse.redirect(
        new URL('/checkout?status=error', request.url)
      )
    }

    if (order?.payment_status === 'paid') {
      return NextResponse.redirect(new URL('/orders', request.url))
    } else {
      return NextResponse.redirect(
        new URL('/checkout?status=pending', request.url)
      )
    }
  }

  // ---- 3. Fallback ----
  return NextResponse.redirect(new URL('/home', request.url))
}