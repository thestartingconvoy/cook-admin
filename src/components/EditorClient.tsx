"use client";

import { useState, useRef, useCallback } from "react";
import { api } from "@/lib/client-api";
import type { MenuWithChildren } from "@/lib/types";

const LANGS = [
  { value: "en-IN", label: "English (India)" },
  { value: "hi-IN", label: "Hindi (India)" },
];

export function EditorClient({
  initialMenu,
  ttsEnabled,
}: {
  initialMenu: MenuWithChildren;
  ttsEnabled: boolean;
}) {
  const [menu, setMenu] = useState(initialMenu);
  const [error, setError] = useState<string | null>(null);

  // Refetch the canonical menu from the server after a mutation so positions
  // and server-generated TTS URLs stay in sync.
  const refresh = useCallback(async () => {
    const res = await fetch(`/api/admin/menus/${menu.id}`);
    if (res.ok) setMenu((await res.json()) as MenuWithChildren);
  }, [menu.id]);

  const run = useCallback(
    async (fn: () => Promise<unknown>) => {
      setError(null);
      try {
        await fn();
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    },
    [refresh]
  );

  const days = [...menu.days].sort((a, b) => a.position - b.position);

  return (
    <div className="mt-4">
      {error && (
        <p className="mb-4 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      <MenuHeader menu={menu} ttsEnabled={ttsEnabled} run={run} />

      <section className="mt-8 space-y-4">
        {days.map((day, i) => (
          <DayCard
            key={day.id}
            menuId={menu.id}
            day={day}
            index={i}
            total={days.length}
            orderedDayIds={days.map((d) => d.id)}
            ttsEnabled={ttsEnabled}
            run={run}
          />
        ))}
      </section>

      <button
        onClick={() => run(() => api.addDay(menu.id))}
        className="mt-6 w-full rounded-xl border border-dashed border-white/20 py-3 text-white/60 hover:bg-white/5"
      >
        + Add day
      </button>
    </div>
  );
}

// ---- Menu header: name, cover, publish, language ------------------------

function MenuHeader({
  menu,
  ttsEnabled,
  run,
}: {
  menu: MenuWithChildren;
  ttsEnabled: boolean;
  run: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [name, setName] = useState(menu.name);
  const coverRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => coverRef.current?.click()}
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white/10"
          title="Set cover image"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {menu.cover_url ? (
            <img src={menu.cover_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs text-white/40">
              Cover
            </span>
          )}
        </button>
        <input
          ref={coverRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) run(() => api.uploadCover(menu.id, f));
          }}
        />

        <div className="flex-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() && name !== menu.name && run(() => api.updateMenu(menu.id, { name: name.trim() }))}
            className="w-full bg-transparent text-xl font-semibold outline-none"
          />
          <p className="mt-0.5 text-xs text-white/40">Slug: {menu.id}</p>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={menu.published}
                onChange={(e) => run(() => api.updateMenu(menu.id, { published: e.target.checked }))}
                className="h-4 w-4"
              />
              <span>{menu.published ? "Published (live in /api/menus)" : "Draft"}</span>
            </label>

            <label className="flex items-center gap-2 text-sm text-white/70">
              TTS language
              <select
                value={menu.tts_lang || "en-IN"}
                onChange={(e) => run(() => api.updateMenu(menu.id, { tts_lang: e.target.value }))}
                className="rounded-lg border border-white/15 bg-white/5 px-2 py-1"
              >
                {LANGS.map((l) => (
                  <option key={l.value} value={l.value} className="bg-zinc-900">
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {!ttsEnabled && (
            <p className="mt-3 text-xs text-white/40">
              TTS is not configured (no GOOGLE_TTS_API_KEY). Voice notes stay empty and the cook
              app falls back to browser TTS — or upload a custom recording per day below.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Day card -----------------------------------------------------------

type DayWithMeals = MenuWithChildren["days"][number];

function DayCard({
  menuId,
  day,
  index,
  total,
  orderedDayIds,
  ttsEnabled,
  run,
}: {
  menuId: string;
  day: DayWithMeals;
  index: number;
  total: number;
  orderedDayIds: string[];
  ttsEnabled: boolean;
  run: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [newMeal, setNewMeal] = useState("");
  const audioRef = useRef<HTMLInputElement>(null);
  const meals = [...day.meals].sort((a, b) => a.position - b.position);

  function move(dir: -1 | 1) {
    const ids = [...orderedDayIds];
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    run(() => api.reorderDays(menuId, ids));
  }

  const mealCount = meals.length;
  const countOk = mealCount >= 3 && mealCount <= 5;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Day {index + 1}</h3>
        <div className="flex items-center gap-2 text-sm text-white/50">
          <button onClick={() => move(-1)} disabled={index === 0} className="px-1 disabled:opacity-30">
            ↑
          </button>
          <button onClick={() => move(1)} disabled={index === total - 1} className="px-1 disabled:opacity-30">
            ↓
          </button>
          <button onClick={() => run(() => api.deleteDay(day.id))} className="hover:text-red-400">
            Delete day
          </button>
        </div>
      </div>

      <p className={`mt-1 text-xs ${countOk ? "text-white/40" : "text-yellow-400"}`}>
        {mealCount} meal(s) {countOk ? "" : "— each day should have 3–5"}
      </p>

      <ul className="mt-3 space-y-2">
        {meals.map((meal, i) => (
          <MealRow
            key={meal.id}
            meal={meal}
            index={i}
            total={meals.length}
            orderedMealIds={meals.map((m) => m.id)}
            dayId={day.id}
            run={run}
          />
        ))}
      </ul>

      <div className="mt-3 flex gap-2">
        <input
          value={newMeal}
          onChange={(e) => setNewMeal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newMeal.trim()) {
              run(() => api.addMeal(day.id, newMeal.trim()));
              setNewMeal("");
            }
          }}
          placeholder="Add meal (cooking order)"
          className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/40"
        />
        <button
          onClick={() => {
            if (newMeal.trim()) {
              run(() => api.addMeal(day.id, newMeal.trim()));
              setNewMeal("");
            }
          }}
          className="rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
        >
          Add
        </button>
      </div>

      {/* Voice note */}
      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Voice note{" "}
            {day.voice_note_is_custom ? (
              <span className="text-xs text-sky-300">(custom recording)</span>
            ) : ttsEnabled ? (
              <span className="text-xs text-white/40">(auto-generated)</span>
            ) : (
              <span className="text-xs text-white/40">(browser TTS fallback)</span>
            )}
          </span>
          <div className="flex items-center gap-3 text-sm">
            <button onClick={() => audioRef.current?.click()} className="text-white/70 hover:text-white">
              Upload
            </button>
            {day.voice_note_is_custom && (
              <button
                onClick={() => run(() => api.clearDayAudio(day.id))}
                className="text-white/50 hover:text-red-400"
              >
                Remove
              </button>
            )}
          </div>
        </div>
        <input
          ref={audioRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) run(() => api.uploadDayAudio(day.id, f));
          }}
        />
        {day.voice_note_url ? (
          <audio controls src={day.voice_note_url} className="mt-2 w-full" />
        ) : (
          <p className="mt-2 text-xs text-white/40">
            No audio file. The cook app will speak the meal names with its own browser TTS.
          </p>
        )}
      </div>
    </div>
  );
}

// ---- Meal row -----------------------------------------------------------

type MealItem = DayWithMeals["meals"][number];

function MealRow({
  meal,
  index,
  total,
  orderedMealIds,
  dayId,
  run,
}: {
  meal: MealItem;
  index: number;
  total: number;
  orderedMealIds: string[];
  dayId: string;
  run: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [name, setName] = useState(meal.name);
  const imgRef = useRef<HTMLInputElement>(null);

  function move(dir: -1 | 1) {
    const ids = [...orderedMealIds];
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    run(() => api.reorderMeals(dayId, ids));
  }

  return (
    <li className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5">
      <div className="flex flex-col text-xs text-white/40">
        <button onClick={() => move(-1)} disabled={index === 0} className="disabled:opacity-30">
          ↑
        </button>
        <button onClick={() => move(1)} disabled={index === total - 1} className="disabled:opacity-30">
          ↓
        </button>
      </div>

      <button
        type="button"
        onClick={() => imgRef.current?.click()}
        className="h-9 w-9 shrink-0 overflow-hidden rounded bg-white/10"
        title="Set meal image"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {meal.image_url ? (
          <img src={meal.image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[10px] text-white/40">
            img
          </span>
        )}
      </button>
      <input
        ref={imgRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) run(() => api.uploadMealImage(meal.id, f));
        }}
      />

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name.trim() && name !== meal.name && run(() => api.updateMeal(meal.id, name.trim()))}
        className="flex-1 bg-transparent text-sm outline-none"
      />
      <button onClick={() => run(() => api.deleteMeal(meal.id))} className="text-white/40 hover:text-red-400">
        ✕
      </button>
    </li>
  );
}
