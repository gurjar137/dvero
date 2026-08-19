import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const next = requestUrl.searchParams.get('next') || '/profile';

  // Handles OAuth error redirect gracefully without showing raw Supabase JSON or black page
  if (error || errorDescription) {
    const redirectUrl = new URL(next, requestUrl.origin);
    redirectUrl.searchParams.set('error', error || 'auth_failed');
    if (errorDescription) {
      redirectUrl.searchParams.set('error_description', errorDescription);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect back to profile / destination cleanly
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
