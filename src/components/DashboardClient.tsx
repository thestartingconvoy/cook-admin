"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import type { MenuWithChildren } from "@/lib/types";

export function DashboardClient({ initialMenus }: { initialMenus: MenuWithChildren[] }) {
  const router = useRouter();
  const [menus, setMenus] = useState(initialMenus);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function startDraft() {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy("create");
    const params = new URLSearchParams({ name: trimmed });
    router.push(`/menu/new?${params.toString()}`);
  }

  async function remove(id: string) {
    if (busy || !confirm("Delete this menu?")) return;
    setBusy(`delete-${id}`);
    setError(null);
    try {
      await api.deleteMenu(id);
      setMenus((current) => current.filter((menu) => menu.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete menu");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-10">
      <div className="flex gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2 shadow-2xl shadow-black/20">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && startDraft()}
          placeholder="New menu name"
          className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3 text-sm outline-none placeholder:text-white/30"
        />
        <button
          onClick={startDraft}
          disabled={Boolean(busy) || !name.trim()}
          className="min-w-28 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "create" ? "Opening..." : "Create"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

      <ul className="mt-7 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        {menus.length === 0 && (
          <li className="p-10 text-center text-sm text-white/40">No menus yet.</li>
        )}
        {menus.map((menu) => (
          <li key={menu.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="truncate font-medium">{menu.name}</p>
              <p className="mt-1 text-xs text-white/40">
                {menu.days?.length ?? 0} day(s) / {menu.published ? "Live" : "Draft"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/menu/${menu.id}`}
                className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10"
              >
                Edit
              </Link>
              <button
                onClick={() => remove(menu.id)}
                disabled={Boolean(busy)}
                className="rounded-lg px-3 py-2 text-sm text-white/40 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === `delete-${menu.id}` ? "Deleting..." : "Delete"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
