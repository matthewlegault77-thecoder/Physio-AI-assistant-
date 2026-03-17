import Stripe from 'stripe';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return Response.json({ error: 'Stripe is not configured on this server.' }, { status: 500 });
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    return Response.json({ error: 'Stripe price is not configured.' }, { status: 500 });
  }

  try {
    const stripe = new Stripe(secretKey);
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      line_items: [
        { price: priceId, quantity: 1 },
      ],
      mode: 'payment',
      success_url: `${origin}?payment=success`,
      cancel_url: `${origin}?payment=cancelled`,
      metadata: { product: 'physio_ai_lifetime' },
    });

    return Response.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create checkout session.';
    return Response.json({ error: message }, { status: 500 });
  }
}
