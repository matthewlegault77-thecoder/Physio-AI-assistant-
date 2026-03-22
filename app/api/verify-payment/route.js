import Stripe from 'stripe';
import { createClient } from '../../../lib/supabase/server';
import { createAdminClient } from '../../../lib/supabase/admin';

export async function POST(request) {
  // Authenticate the user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sessionId } = await request.json();
  if (!sessionId) {
    return Response.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // Retrieve the checkout session directly from Stripe
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return Response.json({ error: 'Invalid session' }, { status: 400 });
  }

  // Verify this session belongs to the authenticated user
  if (session.metadata?.userId !== user.id) {
    return Response.json({ error: 'Session mismatch' }, { status: 403 });
  }

  // Only update if the payment was actually completed
  if (session.payment_status !== 'paid') {
    return Response.json({ paid: false });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .upsert({
      id: user.id,
      has_paid: true,
      stripe_session_id: session.id,
      stripe_customer_id: session.customer,
      paid_at: new Date().toISOString(),
    });

  if (error) {
    console.error('verify-payment: Failed to update profile:', error);
    return Response.json({ error: 'Database update failed' }, { status: 500 });
  }

  return Response.json({ paid: true });
}
