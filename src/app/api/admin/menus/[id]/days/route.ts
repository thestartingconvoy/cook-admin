import { NextResponse } from "next/server";
import { addDay, reorderDays } from "@/lib/menus";
import { requireAdmin, errorResponse } from "@/lib/guard";

export const dynamic = "force-dynamic";

// Add a new day to a menu.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const day = await addDay(id);
    return NextResponse.json(day, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

// Reorder days: body { orderedIds: string[] }.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const { orderedIds } = (await req.json()) as { orderedIds?: string[] };
    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: "orderedIds required" }, { status: 400 });
    }
    await reorderDays(id, orderedIds);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
