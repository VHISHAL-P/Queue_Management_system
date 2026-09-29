import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'placeholder-key';

  const isPlaceholderUrl = supabaseUrl.includes('placeholder-project');

  // Check demo_role cookie
  const demoRoleCookie = request.cookies.get('demo_role')?.value;

  // Try fetching user from Supabase if not placeholder
  let user = null;
  if (!isPlaceholderUrl) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      });
      const authResult = await supabase.auth.getUser();
      user = authResult.data.user;
    } catch {
      user = null;
    }
  }

  const pathname = request.nextUrl.pathname;

  // If authenticated via Supabase, allow access
  if (user) {
    return response;
  }

  // Strict Role-Based Access Control (RBAC)
  const activeRole = demoRoleCookie || (isPlaceholderUrl ? 'PATIENT' : null);

  if (pathname.startsWith('/admin')) {
    if (activeRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login?error=unauthorized_admin', request.url));
    }
  }

  if (pathname.startsWith('/doctor')) {
    if (activeRole !== 'DOCTOR' && activeRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login?error=unauthorized_doctor', request.url));
    }
  }

  if (pathname.startsWith('/patient')) {
    if (!activeRole) {
      return NextResponse.redirect(new URL('/login?redirect=' + encodeURIComponent(pathname), request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
