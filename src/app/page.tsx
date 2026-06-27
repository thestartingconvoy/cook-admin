import { auth } from "@/auth";
import { listMenus } from "@/lib/menus";
import { SignOutButton } from "@/components/SignOutButton";
import { DashboardClient } from "@/components/DashboardClient";
import type { MenuWithChildren } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await auth();
  const { saved } = await searchParams;
  let menus: MenuWithChildren[] = [];
  let loadError: string | null = null;
  try {
    menus = await listMenus({ publishedOnly: false });
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Failed to load menus";
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <header className="flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <p className="text-sm text-white/40">Cook Admin</p>
          <h1 className="mt-1 text-3xl font-semibold">Menus</h1>
          <p className="mt-1 text-sm text-white/45">{session?.user?.email}</p>
        </div>
        <SignOutButton />
      </header>

      {saved === "1" && (
        <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          Menu submitted. It is now available from the public menu API.
        </div>
      )}

      {loadError ? (
        <div className="mt-8 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
          <p className="font-medium">Couldn&apos;t load menus.</p>
          <p className="mt-1 text-yellow-200/80">{loadError}</p>
          <p className="mt-2 text-yellow-200/60">
            Check your Supabase env vars and that the schema (see README) has been applied.
          </p>
        </div>
      ) : (
        <DashboardClient initialMenus={menus} />
      )}
    </main>
  );
}
