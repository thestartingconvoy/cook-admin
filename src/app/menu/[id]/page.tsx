import { notFound } from "next/navigation";
import Link from "next/link";
import { getMenu } from "@/lib/menus";
import { ttsEnabled } from "@/lib/tts";
import { EditorClient } from "@/components/EditorClient";

export const dynamic = "force-dynamic";

export default async function MenuEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const menu = await getMenu(id);
  if (!menu) notFound();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/" className="text-sm text-white/50 hover:text-white">
        ← All menus
      </Link>
      <EditorClient initialMenu={menu} ttsEnabled={ttsEnabled()} />
    </main>
  );
}
