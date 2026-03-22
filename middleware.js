import { updateSession } from './lib/supabase/middleware';

export async function middleware(request) {
  const { supabaseResponse, user } = await updateSession(request);

  // Protect /api/assess and /api/chat — require authentication
  if (request.nextUrl.pathname.startsWith('/api/assess') || request.nextUrl.pathname.startsWith('/api/chat')) {
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Match all paths except static files and the Stripe webhook endpoint
    // (webhook needs the raw body untouched for signature verification)
    '/((?!_next/static|_next/image|favicon.ico|logo.png|api/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
