import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isProtected = request.nextUrl.pathname.startsWith("/dashboard") ||
                      request.nextUrl.pathname.startsWith("/onboarding") ||
                      request.nextUrl.pathname.startsWith("/settings") ||
                      request.nextUrl.pathname.startsWith("/billing");

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Beta allowlist — block any account not in the permitted list
  if (user && isProtected) {
    const allowed = (process.env.ALLOWED_EMAILS ?? "").split(",").map(e => e.trim().toLowerCase());
    if (allowed.length > 0 && !allowed.includes((user.email ?? "").toLowerCase())) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/beta";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
