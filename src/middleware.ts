import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Gate everything behind auth EXCEPT:
//  - the public read API (/api/menus[...])
//  - the auth endpoints (/api/auth/...)
//  - the login page and Next.js internals/static assets
export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname.startsWith("/api/menus") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/app-icon") ||
    pathname === "/login";

  if (isPublic) return NextResponse.next();

  if (!req.auth?.user) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Run on everything except static assets and image files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)"],
};
