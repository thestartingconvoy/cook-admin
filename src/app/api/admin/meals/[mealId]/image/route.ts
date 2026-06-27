import { NextResponse } from "next/server";
import { updateMeal } from "@/lib/menus";
import { uploadToStorage } from "@/lib/storage";
import { requireAdmin, errorResponse } from "@/lib/guard";

export const dynamic = "force-dynamic";

// Upload/replace a meal image (multipart "file"). Image changes do NOT affect
// TTS, so no regeneration is triggered.
export async function POST(req: Request, { params }: { params: Promise<{ mealId: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { mealId } = await params;
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }
    const ext = file.type.split("/")[1] || "jpg";
    const url = await uploadToStorage(`meals/${mealId}-${Date.now()}.${ext}`, await file.arrayBuffer(), file.type);
    await updateMeal(mealId, { image_url: url });
    return NextResponse.json({ image_url: url });
  } catch (err) {
    return errorResponse(err);
  }
}
