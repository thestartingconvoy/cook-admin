"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import type { MenuWithChildren } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DraftMeal = { key: string; name: string };
type DraftDay = { key: string; meals: DraftMeal[] };

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function draftFromMenu(menu: MenuWithChildren | null): DraftDay[] {
  if (!menu) return [{ key: uid("day"), meals: [{ key: uid("meal"), name: "" }] }];
  return [...menu.days]
    .sort((a, b) => a.position - b.position)
    .map((day) => ({
      key: day.id,
      meals: [...day.meals]
        .sort((a, b) => a.position - b.position)
        .map((meal) => ({ key: meal.id, name: meal.name })),
    }));
}

// ---------------------------------------------------------------------------
// Sample JSON (shown in the dialog)
// ---------------------------------------------------------------------------

const SAMPLE_JSON = JSON.stringify(
  {
    name: "North Indian Veg",
    days: [
      { meals: ["Poha", "Dal Chawal", "Roti Aloo Gobi"] },
      { meals: ["Dosa / Chutney", "Matar Paneer / Roti", "Kadhi Chawal"] },
    ],
  },
  null,
  2
);

// ---------------------------------------------------------------------------
// JSON Import Dialog
// ---------------------------------------------------------------------------

function JsonImportDialog({
  onClose,
  onPopulate,
}: {
  onClose: () => void;
  onPopulate: (days: DraftDay[], name?: string) => void;
}) {
  const [raw, setRaw] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function copySample() {
    navigator.clipboard.writeText(SAMPLE_JSON).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function populate() {
    setParseError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      setParseError("Invalid JSON — check for missing commas or quotes.");
      return;
    }

    if (typeof parsed !== "object" || parsed === null || !("days" in parsed)) {
      setParseError('JSON must have a "days" array.');
      return;
    }

    const obj = parsed as { name?: string; days: unknown };
    if (!Array.isArray(obj.days)) {
      setParseError('"days" must be an array.');
      return;
    }

    const days: DraftDay[] = [];
    for (let i = 0; i < obj.days.length; i++) {
      const day = obj.days[i] as { meals?: unknown };
      if (!Array.isArray(day.meals)) {
        setParseError(`Day ${i + 1}: "meals" must be an array of strings.`);
        return;
      }
      const meals: DraftMeal[] = (day.meals as unknown[]).map((m, j) => {
        if (typeof m !== "string" || !m.trim()) {
          throw Object.assign(new Error(), { msg: `Day ${i + 1}, meal ${j + 1}: must be a non-empty string.` });
        }
        return { key: uid("meal"), name: m.trim() };
      });
      days.push({ key: uid("day"), meals });
    }

    onPopulate(days, typeof obj.name === "string" ? obj.name : undefined);
    onClose();
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex w-full max-w-lg flex-col gap-4 rounded-3xl border border-white/10 bg-[#111] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Fill from JSON</h2>
            <p className="mt-0.5 text-xs text-white/45">
              Paste a JSON object with a <code className="text-white/70">days</code> array. Meals are strings in cooking order.
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/8 text-white/50 transition hover:bg-white/15"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={raw}
            onChange={(e) => { setRaw(e.target.value); setParseError(null); }}
            spellCheck={false}
            rows={10}
            placeholder={SAMPLE_JSON}
            className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-xs text-white/80 outline-none placeholder:text-white/15 focus:border-white/25"
          />
          <button
            onClick={copySample}
            className="absolute right-3 top-3 rounded-lg bg-white/8 px-2.5 py-1 text-[11px] text-white/50 transition hover:bg-white/15 hover:text-white/80"
          >
            {copied ? "Copied ✓" : "Copy sample"}
          </button>
        </div>

        {parseError && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300">{parseError}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 transition hover:bg-white/8"
          >
            Cancel
          </button>
          <button
            onClick={populate}
            disabled={!raw.trim()}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Populate
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main EditorClient
// ---------------------------------------------------------------------------

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
  const [showJsonDialog, setShowJsonDialog] = useState(false);
  const ttsLang = initialMenu?.tts_lang || "en-IN";

  const mealCount = useMemo(
    () => days.reduce((sum, d) => sum + d.meals.filter((m) => m.name.trim()).length, 0),
    [days]
  );

  function addDay() {
    if (busy) return;
    setDays((c) => [...c, { key: uid("day"), meals: [{ key: uid("meal"), name: "" }] }]);
  }

  function removeDay(dayKey: string) {
    if (busy) return;
    setDays((c) => c.filter((d) => d.key !== dayKey));
  }

  function addMeal(dayKey: string) {
    if (busy) return;
    setDays((c) =>
      c.map((d) =>
        d.key === dayKey ? { ...d, meals: [...d.meals, { key: uid("meal"), name: "" }] } : d
      )
    );
  }

  function updateMeal(dayKey: string, mealKey: string, value: string) {
    setDays((c) =>
      c.map((d) =>
        d.key === dayKey
          ? { ...d, meals: d.meals.map((m) => (m.key === mealKey ? { ...m, name: value } : m)) }
          : d
      )
    );
  }

  function removeMeal(dayKey: string, mealKey: string) {
    if (busy) return;
    setDays((c) =>
      c.map((d) =>
        d.key === dayKey ? { ...d, meals: d.meals.filter((m) => m.key !== mealKey) } : d
      )
    );
  }

  const handlePopulate = useCallback((newDays: DraftDay[], newName?: string) => {
    setDays(newDays);
    if (newName) setName(newName);
    setError(null);
  }, []);

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
          .map((d) => ({ meals: d.meals.map((m) => ({ name: m.name.trim() })).filter((m) => m.name) }))
          .filter((d) => d.meals.length),
      });
      router.push("/?saved=1");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit menu");
      setBusy(null);
    }
  }

  return (
    <>
      {showJsonDialog && (
        <JsonImportDialog onClose={() => setShowJsonDialog(false)} onPopulate={handlePopulate} />
      )}

      <div className="mt-8 space-y-5">
        {/* Header card: name + actions */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          <label className="block">
            <span className="text-[11px] font-medium uppercase tracking-widest text-white/30">
              Menu name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. North Indian Veg"
              className="mt-2 block w-full bg-transparent text-[22px] font-semibold tracking-tight outline-none placeholder:text-white/15"
            />
          </label>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {/* Fill from JSON */}
            <button
              onClick={() => setShowJsonDialog(true)}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white/90"
            >
              Fill from JSON
            </button>

            <div className="flex-1" />

            {!ttsEnabled && (
              <p className="w-full text-xs text-amber-300/60">
                No TTS key — voice notes won&apos;t be generated.
              </p>
            )}

            {/* Submit */}
            <button
              onClick={submit}
              disabled={Boolean(busy) || !name.trim() || mealCount === 0}
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy === "submit" ? (
                <span className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Submitting…
                </span>
              ) : (
                "Submit menu"
              )}
            </button>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
          )}
        </div>

        {/* Days header */}
        <div className="flex items-center justify-between px-1">
          <p className="text-[13px] text-white/35">
            {days.length} day{days.length !== 1 ? "s" : ""} · {mealCount} meal{mealCount !== 1 ? "s" : ""}
          </p>
          <button
            onClick={addDay}
            disabled={Boolean(busy)}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white/90 disabled:opacity-40"
          >
            + Add day
          </button>
        </div>

        {/* Day cards */}
        <div className="space-y-3">
          {days.map((day, dayIndex) => (
            <DayCard
              key={day.key}
              day={day}
              dayIndex={dayIndex}
              totalDays={days.length}
              busy={busy}
              onAddMeal={addMeal}
              onUpdateMeal={updateMeal}
              onRemoveMeal={removeMeal}
              onRemoveDay={removeDay}
            />
          ))}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Day card
// ---------------------------------------------------------------------------

function DayCard({
  day,
  dayIndex,
  totalDays,
  busy,
  onAddMeal,
  onUpdateMeal,
  onRemoveMeal,
  onRemoveDay,
}: {
  day: DraftDay;
  dayIndex: number;
  totalDays: number;
  busy: string | null;
  onAddMeal: (dayKey: string) => void;
  onUpdateMeal: (dayKey: string, mealKey: string, value: string) => void;
  onRemoveMeal: (dayKey: string, mealKey: string) => void;
  onRemoveDay: (dayKey: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
      {/* Day header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <span className="text-[13px] font-semibold tracking-tight text-white/80">
          Day {dayIndex + 1}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onAddMeal(day.key)}
            disabled={Boolean(busy)}
            className="grid h-7 w-7 place-items-center rounded-full border border-white/10 text-white/50 transition hover:border-white/20 hover:bg-white/8 hover:text-white/90 disabled:opacity-40"
            title="Add meal"
          >
            <span className="text-base leading-none">+</span>
          </button>
          {totalDays > 1 && (
            <button
              onClick={() => onRemoveDay(day.key)}
              disabled={Boolean(busy)}
              className="rounded-lg px-2.5 py-1 text-xs text-white/25 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Meals */}
      <div className="divide-y divide-white/[0.05]">
        {day.meals.map((meal, mealIndex) => (
          <div key={meal.key} className="flex items-center gap-3 px-4 py-2.5">
            <span className="w-5 shrink-0 text-center text-[11px] tabular-nums text-white/20">
              {mealIndex + 1}
            </span>
            <input
              value={meal.name}
              onChange={(e) => onUpdateMeal(day.key, meal.key, e.target.value)}
              placeholder="Meal name"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-white/90 outline-none placeholder:text-white/18"
            />
            {day.meals.length > 1 && (
              <button
                onClick={() => onRemoveMeal(day.key, meal.key)}
                disabled={Boolean(busy)}
                className="shrink-0 text-[11px] text-white/20 transition hover:text-red-300 disabled:opacity-40"
                aria-label="Remove meal"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
