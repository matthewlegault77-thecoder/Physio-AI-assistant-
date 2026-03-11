import Stripe from 'stripe';

export async function POST() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return Response.json({ error: 'Stripe is not configured on this server.' }, { status: 500 });
  }

  try {
    const stripe = new Stripe(secretKey);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 3500, // $35.00 in cents
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: { product: 'physio_ai_lifetime' },
    });

    return Response.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    return Response.json({ error: err.message || 'Failed to create payment.' }, { status: 500 });
  }
}
