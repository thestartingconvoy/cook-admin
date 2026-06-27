import { NextResponse } from "next/server";
import { updateMenu } from "@/lib/menus";
import { uploadToStorage } from "@/lib/storage";
import { requireAdmin, errorResponse } from "@/lib/guard";

export const dynamic = "force-dynamic";

// Upload/replace a menu cover image (multipart form field "file").
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }
    const buf = await file.arrayBuffer();
    const ext = file.type.split("/")[1] || "jpg";
    const url = await uploadToStorage(`covers/${id}-${Date.now()}.${ext}`, buf, file.type);
    await updateMenu(id, { cover_url: url });
    return NextResponse.json({ cover_url: url });
  } catch (err) {
    return errorResponse(err);
  }
}
