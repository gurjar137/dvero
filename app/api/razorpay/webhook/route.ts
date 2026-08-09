import { NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';
import { supabaseServer } from '@/lib/supabase/server';
import { logAudit } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing Razorpay webhook signature.' }, { status: 400 });
    }

    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
    if (!isValid) {
      logAudit('razorpay_webhook_invalid_signature', 'warn', { signature });
      return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    logAudit('razorpay_webhook_received', 'info', { event, id: payload.payload?.payment?.entity?.id });

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const orderNumber = paymentEntity?.notes?.order_number;

      if (orderNumber) {
        await supabaseServer
          .from('orders')
          .update({ status: 'placed' })
          .eq('order_number', orderNumber)
          .in('status', ['processing', 'pending']);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    logAudit('razorpay_webhook_error', 'error', { error: error?.message });
    return NextResponse.json({ error: 'Internal server error processing webhook.' }, { status: 500 });
  }
}
