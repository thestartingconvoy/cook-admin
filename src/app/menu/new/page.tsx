import { ttsEnabled } from "@/lib/tts";
import { EditorClient } from "@/components/EditorClient";
import { BackLink } from "@/components/BackLink";

export const dynamic = "force-dynamic";

export default async function NewMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const { name } = await searchParams;

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <BackLink href="/" label="All menus" />
      <EditorClient initialMenu={null} initialName={name} ttsEnabled={ttsEnabled()} />
    </main>
  );
}
