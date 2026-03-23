import { createClient } from '../../../lib/supabase/server';

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { fingerprint } = await request.json();
  if (!fingerprint) {
    return Response.json({ error: 'No fingerprint provided' }, { status: 400 });
  }

  // Only update if the profile doesn't already have a fingerprint
  const { data: profile } = await supabase
    .from('profiles')
    .select('device_fingerprint')
    .eq('id', user.id)
    .single();

  if (!profile?.device_fingerprint) {
    await supabase
      .from('profiles')
      .update({ device_fingerprint: fingerprint })
      .eq('id', user.id);
  }

  return Response.json({ ok: true });
}
