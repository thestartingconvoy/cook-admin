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
    <main className="mx-auto max-w-2xl px-5 py-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-white/25">
            Cook Admin
          </p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight">Menus</h1>
          <p className="mt-1 text-[13px] text-white/35">{session?.user?.email}</p>
        </div>
        <SignOutButton />
      </header>

      {saved === "1" && (
        <div className="mt-6 rounded-2xl border border-emerald-400/15 bg-emerald-400/8 px-4 py-3 text-sm text-emerald-200/90">
          Menu submitted — now live in the public API.
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
