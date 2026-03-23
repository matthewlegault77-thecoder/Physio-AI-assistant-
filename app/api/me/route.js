import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { createAdminClient } from '../../../lib/supabase/admin';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null, hasAccess: false });
  }

  // Use admin client to bypass RLS and reliably read payment status
  const admin = createAdminClient();
  const { data: profileData } = await admin
    .from('profiles')
    .select('has_paid, free_generation_used')
    .eq('id', user.id)
    .single();

  if (!profileData) {
    // Profile row missing — create it
    await admin.from('profiles').upsert({ id: user.id, has_paid: false, free_generation_used: false });
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    hasAccess: profileData?.has_paid === true,
    freeGenerationUsed: profileData?.free_generation_used === true,
  });
}
