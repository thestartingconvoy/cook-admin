import { NextResponse } from "next/server";
import { createMenu, listMenus } from "@/lib/menus";
import { requireAdmin, errorResponse } from "@/lib/guard";

export const dynamic = "force-dynamic";

// List all menus (including drafts) for the dashboard.
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const menus = await listMenus({ publishedOnly: false });
    return NextResponse.json(menus);
  } catch (err) {
    return errorResponse(err);
  }
}

// Create a new menu from a name.
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { name } = (await req.json()) as { name?: string };
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const menu = await createMenu(name.trim());
    return NextResponse.json(menu, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
