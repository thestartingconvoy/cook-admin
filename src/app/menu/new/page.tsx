import Link from "next/link";
import { ttsEnabled } from "@/lib/tts";
import { EditorClient } from "@/components/EditorClient";

export const dynamic = "force-dynamic";

export default async function NewMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const { name } = await searchParams;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link href="/" className="text-sm text-white/50 hover:text-white">
        Back to menus
      </Link>
      <EditorClient initialMenu={null} initialName={name} ttsEnabled={ttsEnabled()} />
    </main>
  );
}
