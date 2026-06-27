"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import type { MenuWithChildren } from "@/lib/types";

const PROTECTED_NAME = "Main Menu";

function Spinner({ dark = false }: { dark?: boolean }) {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill={dark ? "black" : "currentColor"} d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export function DashboardClient({ initialMenus }: { initialMenus: MenuWithChildren[] }) {
  const router = useRouter();
  const [menus, setMenus] = useState(initialMenus);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [navigating, setNavigating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmCopy, setConfirmCopy] = useState<string | null>(null);

  function startDraft() {
    const trimmed = name.trim();
    if (!trimmed || busy || navigating) return;
    setBusy("create");
    router.push(`/menu/new?${new URLSearchParams({ name: trimmed }).toString()}`);
  }

  function openMenu(id: string) {
    if (navigating || busy) return;
    setNavigating(id);
    router.push(`/menu/${id}`);
  }

  async function doCopy(id: string) {
    setConfirmCopy(null);
    setBusy(`copy-${id}`);
    setError(null);
    try {
      const copy = (await api.copyMenu(id)) as (typeof menus)[number];
      setMenus((c) => [...c, copy]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to copy menu");
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (busy || navigating || !confirm("Delete this menu?")) return;
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
          disabled={Boolean(busy) || Boolean(navigating) || !name.trim()}
          className="min-w-28 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy === "create" ? (
            <span className="flex items-center justify-center gap-1.5">
              <Spinner dark />
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
            <p className="mt-1 text-xs text-white/20">Create your first menu above.</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {menus.map((menu) => {
              const isProtected = menu.name === PROTECTED_NAME;
              const isNavigating = navigating === menu.id;

              return (
                <li
                  key={menu.id}
                  onClick={() => openMenu(menu.id)}
                  className={[
                    "flex cursor-pointer items-center justify-between gap-4 bg-white/[0.025] px-5 py-4 transition",
                    isNavigating ? "bg-white/[0.05]" : "hover:bg-white/[0.04]",
                    (navigating && !isNavigating) ? "opacity-50" : "",
                  ].join(" ")}
                >
                  {/* Left: name + meta */}
                  <div className="flex min-w-0 items-center gap-3">
                    {isNavigating && (
                      <span className="shrink-0 text-white/40">
                        <Spinner />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium tracking-tight">{menu.name}</p>
                      <p className="mt-0.5 text-xs text-white/35">
                        {menu.days?.length ?? 0} day{(menu.days?.length ?? 0) !== 1 ? "s" : ""}
                        <span className="mx-1.5 text-white/20">·</span>
                        <span className={menu.published ? "text-emerald-400/80" : "text-white/30"}>
                          {menu.published ? "Live" : "Draft"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div
                    className="flex shrink-0 items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {confirmCopy === menu.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-white/50">Make a copy?</span>
                        <button
                          onClick={() => doCopy(menu.id)}
                          disabled={Boolean(busy)}
                          className="rounded-lg bg-white px-3 py-1.5 text-[12px] font-semibold text-black transition hover:bg-white/90 disabled:opacity-40"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmCopy(null)}
                          className="rounded-lg px-3 py-1.5 text-[12px] text-white/40 transition hover:text-white/70"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Edit — hidden for protected menu */}
                        {!isProtected && (
                          <button
                            onClick={() => openMenu(menu.id)}
                            disabled={Boolean(navigating) || Boolean(busy)}
                            className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3.5 py-2 text-[13px] text-white/70 transition hover:border-white/20 hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {isNavigating ? <Spinner /> : null}
                            {isNavigating ? "Opening…" : "Edit"}
                          </button>
                        )}

                        {/* Copy — always visible */}
                        <button
                          onClick={() => setConfirmCopy(menu.id)}
                          disabled={Boolean(busy) || Boolean(navigating)}
                          className="rounded-xl px-3.5 py-2 text-[13px] text-white/30 transition hover:bg-white/8 hover:text-white/60 disabled:opacity-40"
                        >
                          {busy === `copy-${menu.id}` ? "…" : "Copy"}
                        </button>

                        {/* Delete — hidden for protected menu */}
                        {!isProtected && (
                          <button
                            onClick={() => remove(menu.id)}
                            disabled={Boolean(busy) || Boolean(navigating)}
                            className="rounded-xl px-3.5 py-2 text-[13px] text-white/30 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
                          >
                            {busy === `delete-${menu.id}` ? "…" : "Delete"}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
