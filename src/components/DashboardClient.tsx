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
    router.push(`/menu/new?${new URLSearchParams({ name: trimmed }).toString()}`);
  }

  async function remove(id: string) {
    if (busy || !confirm("Delete this menu?")) return;
    setBusy(`delete-${id}`);
    setError(null);
    try {
      await api.deleteMenu(id);
      setMenus((c) => c.filter((m) => m.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete menu");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-10">
      {/* Create input */}
      <div className="flex gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && startDraft()}
          placeholder="New menu name"
          className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-white/25"
        />
        <button
          onClick={startDraft}
          disabled={Boolean(busy) || !name.trim()}
          className="min-w-28 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy === "create" ? (
            <span className="flex items-center justify-center gap-1.5">
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="black" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Opening…
            </span>
          ) : (
            "Create"
          )}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

      {/* Menu list */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.07]">
        {menus.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm text-white/30">No menus yet.</p>
            <p className="mt-1 text-xs text-white/18">Create your first menu above.</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {menus.map((menu) => (
              <li
                key={menu.id}
                className="flex items-center justify-between gap-4 bg-white/[0.025] px-5 py-4 transition hover:bg-white/[0.04]"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium tracking-tight">{menu.name}</p>
                  <p className="mt-0.5 text-xs text-white/35">
                    {menu.days?.length ?? 0} day{(menu.days?.length ?? 0) !== 1 ? "s" : ""}
                    <span className="mx-1.5 text-white/20">·</span>
                    <span
                      className={menu.published ? "text-emerald-400/80" : "text-white/30"}
                    >
                      {menu.published ? "Live" : "Draft"}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/menu/${menu.id}`}
                    className="rounded-xl border border-white/10 px-3.5 py-2 text-[13px] text-white/70 transition hover:border-white/20 hover:bg-white/8 hover:text-white"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => remove(menu.id)}
                    disabled={Boolean(busy)}
                    className="rounded-xl px-3.5 py-2 text-[13px] text-white/30 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
                  >
                    {busy === `delete-${menu.id}` ? "…" : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
