import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../lib/supabase/admin';

export async function POST(request) {
  const { email, password, fingerprint } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // --- IP Rate Limiting ---
  // Extract client IP (Vercel / reverse-proxy provides x-forwarded-for)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

  if (ip !== 'unknown') {
    // Count accounts created from this IP in the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('signup_ips')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('created_at', since);

    if (!countError && count >= 2) {
      return NextResponse.json(
        { error: 'Too many accounts created from this network. Please try again later.' },
        { status: 429 }
      );
    }
  }

  // --- Device Fingerprint Check ---
  // If a fingerprint was provided, check if another account with this fingerprint
  // has already used the free trial
  if (fingerprint) {
    const { data: existingFp } = await supabase
      .from('profiles')
      .select('id, free_generation_used')
      .eq('device_fingerprint', fingerprint)
      .eq('free_generation_used', true)
      .limit(1);

    if (existingFp && existingFp.length > 0) {
      // Another account on this device already used the free trial.
      // We still allow signup, but mark free_generation_used = true immediately
      // so they can't get another free plan.
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Create profile with free trial already consumed
      await supabase.from('profiles').upsert({
        id: data.user.id,
        has_paid: false,
        free_generation_used: true,
        device_fingerprint: fingerprint,
      });

      // Record IP
      if (ip !== 'unknown') {
        await supabase.from('signup_ips').insert({ ip_address: ip, user_id: data.user.id });
      }

      return NextResponse.json({
        user: { id: data.user.id, email: data.user.email },
        freeTrialBlocked: true,
      });
    }
  }

  // --- Normal Signup ---
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Create profiles row for payment tracking + free trial
  await supabase.from('profiles').upsert({
    id: data.user.id,
    has_paid: false,
    free_generation_used: false,
    device_fingerprint: fingerprint || null,
  });

  // Record IP for rate limiting
  if (ip !== 'unknown') {
    await supabase.from('signup_ips').insert({ ip_address: ip, user_id: data.user.id });
  }

  return NextResponse.json({ user: { id: data.user.id, email: data.user.email } });
}
