import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Get the token from cookies
  const token = request.cookies.get('auth_token')?.value;
  
  // 2. Define protected routes (start with /overview, /accounts, etc.)
  // We can just protect the whole dashboard group
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/overview') || 
                           request.nextUrl.pathname.startsWith('/accounts') ||
                           request.nextUrl.pathname.startsWith('/transactions');
  
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || 
                      request.nextUrl.pathname.startsWith('/register');

  // 3. Logic:
  // If user tries to go to Dashboard WITHOUT token -> Redirect to Login
  if (isDashboardRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user tries to go to Login WITH token -> Redirect to Dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/overview', request.url));
  }

  return NextResponse.next();
}

// Configuration: run this middleware on specific paths
export const config = {
  matcher: ['/overview/:path*', '/accounts/:path*', '/transactions/:path*', '/login', '/register'],
};