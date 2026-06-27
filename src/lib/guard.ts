import { auth, isAllowedEmail } from "@/auth";
import { NextResponse } from "next/server";

// Wrap an admin route handler so it only runs for an authenticated, allow-listed
// owner. Returns 401 otherwise. Middleware already gates page navigation, but
// API routes are guarded here too (defense in depth, and for direct calls).
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user || !isAllowedEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function errorResponse(err: unknown): NextResponse {
  const message = err instanceof Error ? err.message : "Unknown error";
  console.error("[cook-admin] Admin route failed", err);
  return NextResponse.json({ error: message }, { status: 500 });
}
