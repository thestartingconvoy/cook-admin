import { NextResponse } from "next/server";
import { setCustomDayAudio, clearCustomDayAudio } from "@/lib/menus";
import { requireAdmin, errorResponse } from "@/lib/guard";

export const dynamic = "force-dynamic";

// Upload a custom recording for the day (multipart "file"). Overrides TTS.
export async function POST(req: Request, { params }: { params: Promise<{ dayId: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { dayId } = await params;
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }
    const url = await setCustomDayAudio(dayId, await file.arrayBuffer(), file.type || "audio/mpeg");
    return NextResponse.json({ voice_note_url: url });
  } catch (err) {
    return errorResponse(err);
  }
}

// Remove the custom recording and fall back to generated TTS.
export async function DELETE(_req: Request, { params }: { params: Promise<{ dayId: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { dayId } = await params;
    await clearCustomDayAudio(dayId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
