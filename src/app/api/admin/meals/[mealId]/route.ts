import { NextResponse } from "next/server";
import { deleteMeal, updateMeal } from "@/lib/menus";
import { requireAdmin, errorResponse } from "@/lib/guard";

export const dynamic = "force-dynamic";

// Rename a meal: body { name }.
export async function PATCH(req: Request, { params }: { params: Promise<{ mealId: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { mealId } = await params;
    const { name } = (await req.json()) as { name?: string };
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    await updateMeal(mealId, { name: name.trim() });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ mealId: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { mealId } = await params;
    await deleteMeal(mealId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
