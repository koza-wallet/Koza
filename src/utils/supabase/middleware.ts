import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          supabaseResponse.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // refreshing the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect routes
  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");
  const isPromoRoute = request.nextUrl.pathname.startsWith("/promo");
  const isLoginOrRegister = 
    request.nextUrl.pathname === "/auth/login" || 
    request.nextUrl.pathname === "/auth/register" || 
    request.nextUrl.pathname === "/auth/forgot-password";
  
  if (isAuthRoute) {
    if (user && isLoginOrRegister) {
      // Jika sudah login, dilarang masuk ke halaman login/register/lupa-sandi
      return NextResponse.redirect(new URL("/", request.url));
    }
    return supabaseResponse;
  }

  // Jika belum login dan bukan di halaman promo, redirect ke halaman login
  if (!user && !isPromoRoute) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return supabaseResponse;
}
