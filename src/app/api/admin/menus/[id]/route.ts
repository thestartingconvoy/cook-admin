import { NextResponse } from "next/server";
import { deleteMenu, getMenu, updateMenu } from "@/lib/menus";
import { requireAdmin, errorResponse } from "@/lib/guard";

export const dynamic = "force-dynamic";

// Fetch a single menu with its days+meals for the editor.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const menu = await getMenu(id);
    if (!menu) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(menu);
  } catch (err) {
    return errorResponse(err);
  }
}

// Rename, publish toggle, or change TTS language.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = (await req.json()) as {
      name?: string;
      published?: boolean;
      tts_lang?: string;
    };
    const patch: { name?: string; published?: boolean; tts_lang?: string } = {};
    if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
    if (typeof body.published === "boolean") patch.published = body.published;
    if (typeof body.tts_lang === "string") patch.tts_lang = body.tts_lang;
    await updateMenu(id, patch);
    return NextResponse.json(await getMenu(id));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    await deleteMenu(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
