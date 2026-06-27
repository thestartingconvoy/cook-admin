import { NextResponse } from "next/server";
import { getMenu } from "@/lib/menus";
import { toPublicMenu } from "@/lib/serialize";
import { corsHeaders } from "@/lib/cors";

// Optional public single-menu read. Only published menus are exposed.
// GET /api/menus/:id -> Menu
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const row = await getMenu(id);
    if (!row || !row.published) {
      return NextResponse.json({ error: "Not found" }, { status: 404, headers: corsHeaders() });
    }
    return NextResponse.json(toPublicMenu(row), {
      headers: {
        ...corsHeaders(),
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
