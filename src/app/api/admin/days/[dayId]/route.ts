import { NextResponse } from "next/server";
import { deleteDay } from "@/lib/menus";
import { requireAdmin, errorResponse } from "@/lib/guard";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ dayId: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { dayId } = await params;
    await deleteDay(dayId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
