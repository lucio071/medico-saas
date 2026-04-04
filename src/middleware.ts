import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PREFIXES = ["/login", "/register", "/verify", "/_next", "/favicon"];
const AUTH_ONLY_PREFIXES = ["/api"];

function getRoleRedirect(role: string | null): string {
  if (role === "admin") return "/admin";
  if (role === "doctor") return "/doctor";
  if (role === "secretary") return "/secretary";
  if (role === "patient") return "/patient";
  return "/login";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic =
    pathname === "/" ||
    PUBLIC_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}.`),
    );

  if (isPublic) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // API routes: authenticated but no role redirect
  const isAuthOnly = AUTH_ONLY_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (isAuthOnly) {
    return response;
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const rolePath = getRoleRedirect(userRow?.role ?? null);

  if (pathname === rolePath || pathname.startsWith(`${rolePath}/`)) {
    return response;
  }

  return NextResponse.redirect(new URL(rolePath, request.url));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
