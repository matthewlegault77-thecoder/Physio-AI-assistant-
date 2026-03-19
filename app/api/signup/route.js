import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../lib/supabase/admin';

export async function POST(request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Create user with email auto-confirmed (bypasses confirmation email)
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Create profiles row for payment tracking
  await supabase.from('profiles').upsert({ id: data.user.id, has_paid: false });

  return NextResponse.json({ user: { id: data.user.id, email: data.user.email } });
}
