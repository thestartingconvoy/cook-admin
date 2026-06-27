"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import type { MenuWithChildren } from "@/lib/types";

type DraftMeal = {
  key: string;
  name: string;
};

type DraftDay = {
  key: string;
  meals: DraftMeal[];
};

function key(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function draftFromMenu(menu: MenuWithChildren | null): DraftDay[] {
  if (!menu) return [{ key: key("day"), meals: [{ key: key("meal"), name: "" }] }];
  return [...menu.days]
    .sort((a, b) => a.position - b.position)
    .map((day) => ({
      key: day.id,
      meals: [...day.meals]
        .sort((a, b) => a.position - b.position)
        .map((meal) => ({ key: meal.id, name: meal.name })),
    }));
}

export function EditorClient({
  initialMenu,
  initialName,
  ttsEnabled,
}: {
  initialMenu: MenuWithChildren | null;
  initialName?: string;
  ttsEnabled: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialMenu?.name ?? initialName ?? "");
  const [days, setDays] = useState<DraftDay[]>(() => draftFromMenu(initialMenu));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ttsLang = initialMenu?.tts_lang || "en-IN";

  const mealCount = useMemo(
    () => days.reduce((sum, day) => sum + day.meals.filter((meal) => meal.name.trim()).length, 0),
    [days]
  );

  function addDay() {
    if (busy) return;
    setBusy("add-day");
    setDays((current) => [...current, { key: key("day"), meals: [{ key: key("meal"), name: "" }] }]);
    window.setTimeout(() => setBusy(null), 150);
  }

  function removeDay(dayKey: string) {
    if (busy) return;
    setBusy(`remove-day-${dayKey}`);
    setDays((current) => current.filter((day) => day.key !== dayKey));
    window.setTimeout(() => setBusy(null), 150);
  }

  function addMeal(dayKey: string) {
    if (busy) return;
    setBusy(`add-meal-${dayKey}`);
    setDays((current) =>
      current.map((day) =>
        day.key === dayKey
          ? { ...day, meals: [...day.meals, { key: key("meal"), name: "" }] }
          : day
      )
    );
    window.setTimeout(() => setBusy(null), 150);
  }

  function updateMeal(dayKey: string, mealKey: string, value: string) {
    setDays((current) =>
      current.map((day) =>
        day.key === dayKey
          ? {
              ...day,
              meals: day.meals.map((meal) =>
                meal.key === mealKey ? { ...meal, name: value } : meal
              ),
            }
          : day
      )
    );
  }

  function removeMeal(dayKey: string, mealKey: string) {
    if (busy) return;
    setBusy(`remove-meal-${mealKey}`);
    setDays((current) =>
      current.map((day) =>
        day.key === dayKey
          ? { ...day, meals: day.meals.filter((meal) => meal.key !== mealKey) }
          : day
      )
    );
    window.setTimeout(() => setBusy(null), 150);
  }

  async function submit() {
    if (busy) return;
    setBusy("submit");
    setError(null);
    try {
      await api.submitMenu({
        id: initialMenu?.id,
        name,
        tts_lang: ttsLang,
        published: true,
        days: days
          .map((day) => ({
            meals: day.meals
              .map((meal) => ({ name: meal.name.trim() }))
              .filter((meal) => meal.name),
          }))
          .filter((day) => day.meals.length),
      });
      router.push("/?saved=1");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit menu");
      setBusy(null);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="text-xs uppercase text-white/35">Menu name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="North Indian Veg"
              className="mt-2 w-full bg-transparent text-2xl font-semibold outline-none placeholder:text-white/20"
            />
          </label>
          <button
            onClick={submit}
            disabled={Boolean(busy) || !name.trim() || mealCount === 0}
            className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "submit" ? "Submitting..." : "Submit menu"}
          </button>
        </div>
        {!ttsEnabled && (
          <p className="mt-4 text-xs text-yellow-200/70">
            TTS key is not active in this deployment. Submit will save the menu, but voice notes will stay empty.
          </p>
        )}
        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
      </section>

      <div className="flex items-center justify-between">
        <p className="text-sm text-white/45">{days.length} day(s)</p>
        <button
          onClick={addDay}
          disabled={Boolean(busy)}
          className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "add-day" ? "Adding..." : "+ Add day"}
        </button>
      </div>

      <section className="space-y-3">
        {days.map((day, dayIndex) => (
          <div key={day.key} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">Day {dayIndex + 1}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => addMeal(day.key)}
                  disabled={Boolean(busy)}
                  className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-lg text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Add meal"
                >
                  {busy === `add-meal-${day.key}` ? "..." : "+"}
                </button>
                {days.length > 1 && (
                  <button
                    onClick={() => removeDay(day.key)}
                    disabled={Boolean(busy)}
                    className="rounded-lg px-2 py-1 text-sm text-white/35 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy === `remove-day-${day.key}` ? "..." : "Remove"}
                  </button>
                )}
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {day.meals.map((meal, mealIndex) => (
                <div
                  key={meal.key}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                >
                  <span className="w-5 text-xs text-white/30">{mealIndex + 1}</span>
                  <input
                    value={meal.name}
                    onChange={(e) => updateMeal(day.key, meal.key, e.target.value)}
                    placeholder="Meal name"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/25"
                  />
                  {day.meals.length > 1 && (
                    <button
                      onClick={() => removeMeal(day.key, meal.key)}
                      disabled={Boolean(busy)}
                      className="text-sm text-white/30 transition hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busy === `remove-meal-${meal.key}` ? "..." : "x"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
