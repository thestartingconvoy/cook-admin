import { NextResponse } from "next/server";
import { addMeal, reorderMeals } from "@/lib/menus";
import { requireAdmin, errorResponse } from "@/lib/guard";

export const dynamic = "force-dynamic";

// Add a meal to a day: body { name }.
export async function POST(req: Request, { params }: { params: Promise<{ dayId: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { dayId } = await params;
    const { name } = (await req.json()) as { name?: string };
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const meal = await addMeal(dayId, name.trim());
    return NextResponse.json(meal, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

// Reorder meals within a day: body { orderedIds: string[] }.
export async function PATCH(req: Request, { params }: { params: Promise<{ dayId: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { dayId } = await params;
    const { orderedIds } = (await req.json()) as { orderedIds?: string[] };
    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: "orderedIds required" }, { status: 400 });
    }
    await reorderMeals(dayId, orderedIds);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
