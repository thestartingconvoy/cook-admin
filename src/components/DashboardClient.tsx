"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import type { MenuRow, MenuWithChildren } from "@/lib/types";

export function DashboardClient({ initialMenus }: { initialMenus: MenuWithChildren[] }) {
  const router = useRouter();
  const [menus, setMenus] = useState(initialMenus);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const menu = (await api.createMenu(name.trim())) as MenuRow;
      router.push(`/menu/${menu.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this menu and all its days/meals?")) return;
    try {
      await api.deleteMenu(id);
      setMenus((m) => m.filter((x) => x.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="mt-8">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          placeholder="New menu name, e.g. North Indian Veg"
          className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 outline-none focus:border-white/40"
        />
        <button
          onClick={create}
          disabled={busy}
          className="rounded-xl bg-white px-4 py-2.5 font-medium text-black disabled:opacity-50"
        >
          Create
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <ul className="mt-6 space-y-3">
        {menus.length === 0 && (
          <li className="rounded-xl border border-dashed border-white/15 p-8 text-center text-white/40">
            No menus yet. Create your first one above.
          </li>
        )}
        {menus.map((menu) => (
          <li
            key={menu.id}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {menu.cover_url ? (
                <img
                  src={menu.cover_url}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-white/10" />
              )}
              <div>
                <Link href={`/menu/${menu.id}`} className="font-medium hover:underline">
                  {menu.name}
                </Link>
                <p className="text-xs text-white/40">
                  {menu.days?.length ?? 0} day(s) · {menu.id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs ${
                  menu.published
                    ? "bg-green-500/20 text-green-300"
                    : "bg-white/10 text-white/50"
                }`}
              >
                {menu.published ? "Live" : "Draft"}
              </span>
              <button
                onClick={() => remove(menu.id)}
                className="text-sm text-white/40 hover:text-red-400"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
