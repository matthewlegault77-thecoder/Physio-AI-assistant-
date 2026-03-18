import { updateSession } from './lib/supabase/middleware';

export async function middleware(request) {
  const { supabaseResponse, user } = await updateSession(request);

  // Protect /api/assess — require authentication
  if (request.nextUrl.pathname.startsWith('/api/assess')) {
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
