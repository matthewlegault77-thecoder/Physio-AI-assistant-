import Stripe from 'stripe';
import { createAdminClient } from '../../../lib/supabase/admin';

export async function POST(request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return Response.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  // Read raw body for signature verification
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.userId;

    if (!userId) {
      console.error('No userId in session metadata');
      return Response.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Use admin client to bypass RLS — upsert so row is created if missing
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        has_paid: true,
        stripe_session_id: session.id,
        stripe_customer_id: session.customer,
        paid_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to update profile:', error);
      return Response.json({ error: 'Database update failed' }, { status: 500 });
    }

    console.log(`Payment confirmed for user ${userId}`);
  }

  return Response.json({ received: true });
}
