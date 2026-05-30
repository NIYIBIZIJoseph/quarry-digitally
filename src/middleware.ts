import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/api/auth/login', '/api/auth/verify-2fa'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // ✅ ADD THIS - Allow all /api/public/* routes
  if (pathname.startsWith('/api/public')) {
    return NextResponse.next();
  }
  
  // Allow other public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }
  
  // Protect dashboard and other API routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/')) {
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    console.log('Middleware - Path:', pathname);
    console.log('Middleware - Token exists:', !!token);
    
    if (!token) {
      // For API calls, return 401 instead of redirect
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};