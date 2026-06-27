import { NextResponse } from "next/server";
import { copyMenu } from "@/lib/menus";
import { requireAdmin, errorResponse } from "@/lib/guard";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const copy = await copyMenu(id);
    return NextResponse.json(copy, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
