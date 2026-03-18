import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// ---- Initialize clients ----
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for server-side ops
);

// ============================================
// GET OR CREATE a Stripe customer for a Supabase user
// ============================================
export async function getOrCreateStripeCustomer(supabaseUserId) {
  // 1. Check if a link already exists in our DB
  const { data: existing, error: fetchError } = await supabase
    .from("customers")
    .select("stripe_customer_id")
    .eq("user_id", supabaseUserId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    // PGRST116 = no rows found (that's fine, we'll create one)
    throw new Error(`Supabase lookup failed: ${fetchError.message}`);
  }

  if (existing?.stripe_customer_id) {
    return existing.stripe_customer_id;
  }

  // 2. Get the user's email from Supabase Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
    supabaseUserId
  );

  if (authError) {
    throw new Error(`Failed to get user from auth: ${authError.message}`);
  }

  const email = authUser.user.email;

  // 3. Check if a Stripe customer already exists with this email
  const existingStripeCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  let stripeCustomerId;

  if (existingStripeCustomers.data.length > 0) {
    stripeCustomerId = existingStripeCustomers.data[0].id;
  } else {
    // 4. Create a new Stripe customer
    const newCustomer = await stripe.customers.create({
      email,
      metadata: {
        supabase_user_id: supabaseUserId,
      },
    });
    stripeCustomerId = newCustomer.id;
  }

  // 5. Save the link in Supabase
  const { error: insertError } = await supabase.from("customers").upsert({
    user_id: supabaseUserId,
    stripe_customer_id: stripeCustomerId,
    email,
  });

  if (insertError) {
    throw new Error(`Failed to save customer link: ${insertError.message}`);
  }

  return stripeCustomerId;
}

// ============================================
// LOOK UP Supabase user ID from a Stripe customer ID
// (useful in webhooks when Stripe sends you events)
// ============================================
export async function getUserIdFromStripeCustomer(stripeCustomerId) {
  const { data, error } = await supabase
    .from("customers")
    .select("user_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .single();

  if (error) {
    throw new Error(`User not found for Stripe customer ${stripeCustomerId}: ${error.message}`);
  }

  return data.user_id;
}

// ============================================
// LOOK UP from a Payment Intent ID
// (for when you only have a pi_... ID)
// ============================================
export async function getUserIdFromPaymentIntent(paymentIntentId) {
  // 1. Get the payment intent from Stripe to find the customer
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (!paymentIntent.customer) {
    throw new Error("This payment intent has no customer attached");
  }

  // 2. Look up the Supabase user from the Stripe customer ID
  return getUserIdFromStripeCustomer(paymentIntent.customer);
}

// ============================================
// LOOK UP by email
// ============================================
export async function getUserIdFromEmail(email) {
  const { data, error } = await supabase
    .from("customers")
    .select("user_id, stripe_customer_id")
    .eq("email", email)
    .single();

  if (error) {
    throw new Error(`No customer found for email ${email}: ${error.message}`);
  }

  return data;
}

// ============================================
// Example usage in a Stripe webhook handler
// ============================================
// export async function handleStripeWebhook(event) {
//   switch (event.type) {
//     case "payment_intent.succeeded": {
//       const paymentIntent = event.data.object;
//       const userId = await getUserIdFromStripeCustomer(paymentIntent.customer);
//       console.log(`Payment succeeded for user: ${userId}`);
//       // Grant access, update subscription, etc.
//       break;
//     }
//   }
// }
