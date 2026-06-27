import { NextResponse } from "next/server";
import { submitMenuDraft } from "@/lib/submit-menu";
import { requireAdmin, errorResponse } from "@/lib/guard";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await req.json();
    const menu = await submitMenuDraft(body);
    return NextResponse.json(menu);
  } catch (err) {
    return errorResponse(err);
  }
}
