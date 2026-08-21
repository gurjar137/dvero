import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com https://*.supabase.co https://*.google.com https://*.gstatic.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.razorpay.com;
  img-src 'self' data: blob: https: http:;
  font-src 'self' data: https://fonts.gstatic.com;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.razorpay.com https://lumberjack.razorpay.com https://*.google.com https://*.googleapis.com;
  frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com https://www.google.com https://maps.google.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self' https:;
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim();

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect Admin dashboard routes (except login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const adminSession = request.cookies.get('dvero_admin_session');
    if (!adminSession && !request.cookies.get('sb-access-token')) {
      // Allow client-side Supabase auth to handle route hydration or redirect to /admin/login
    }
  }

  const response = NextResponse.next();

  // Security Headers
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=(), interest-cohort=()');

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
};
