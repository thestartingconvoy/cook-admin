import { notFound } from "next/navigation";
import { getMenu } from "@/lib/menus";
import { ttsEnabled } from "@/lib/tts";
import { EditorClient } from "@/components/EditorClient";
import { BackLink } from "@/components/BackLink";

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
    <main className="mx-auto max-w-2xl px-5 py-10">
      <BackLink href="/" label="All menus" />
      <EditorClient initialMenu={menu} ttsEnabled={ttsEnabled()} />
    </main>
  );
}
