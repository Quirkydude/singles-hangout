import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";

const PUBLIC_ADMIN_PATHS = ["/admin/login"];

/**
 * Next.js 16 renamed the `middleware` convention to `proxy`.
 * This guards every /admin route except the login page.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_ADMIN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  if (isPublic) return NextResponse.next();

  const token = request.cookies.get(ADMIN_COOKIE)?.value;

  // verifySessionToken returns a promise; proxy supports async work.
  return verifySessionToken(token).then((valid) => {
    if (valid) return NextResponse.next();

    const loginUrl = new URL("/admin/login", request.url);
    if (pathname !== "/admin") {
      loginUrl.searchParams.set("next", pathname);
    }
    const response = NextResponse.redirect(loginUrl);
    if (token) response.cookies.delete(ADMIN_COOKIE);
    return response;
  });
}

export const config = {
  matcher: ["/admin/:path*"],
};
