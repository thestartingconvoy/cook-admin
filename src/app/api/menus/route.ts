import { NextResponse } from "next/server";
import { listMenus } from "@/lib/menus";
import { toPublicMenu } from "@/lib/serialize";
import { corsHeaders } from "@/lib/cors";

// Public, CORS-enabled, cacheable read endpoint.
// GET /api/menus -> Menu[] (all PUBLISHED menus), matching the cook app contract.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await listMenus({ publishedOnly: true });
    const menus = rows.map(toPublicMenu);
    return NextResponse.json(menus, {
      headers: {
        ...corsHeaders(),
        // Edge/CDN cache for a minute, serve stale while revalidating.
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders() });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
