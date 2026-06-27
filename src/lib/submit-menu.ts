import "server-only";
import { createMenu, getMenu, regenerateDayTts } from "./menus";
import { getSupabase } from "./supabase";
import { defaultTtsLang } from "./tts";
import type { MenuWithChildren } from "./types";

const TTS_WAIT_MS = 20000;

export interface MenuSubmitInput {
  id?: string;
  name: string;
  tts_lang?: string;
  published?: boolean;
  days: {
    meals: { name: string }[];
  }[];
}

function isGoogleTtsError(err: unknown): boolean {
  return err instanceof Error && err.message.startsWith("Google TTS failed");
}

function logTtsFailure(err: unknown) {
  if (isGoogleTtsError(err)) {
    console.error("[cook-admin] TTS generation failed; menu was saved without audio", err);
    return;
  }
  console.error("[cook-admin] Unexpected TTS/storage failure; menu was saved without audio", err);
}

async function waitForTts(dayIds: string[]) {
  if (dayIds.length === 0) return;

  const jobs = Promise.allSettled(dayIds.map((dayId) => regenerateDayTts(dayId)));
  const timeout = new Promise<"timeout">((resolve) => {
    setTimeout(() => resolve("timeout"), TTS_WAIT_MS);
  });
  const result = await Promise.race([jobs, timeout]);

  if (result === "timeout") {
    console.error("[cook-admin] TTS generation is still running after submit wait window", {
      dayCount: dayIds.length,
      waitMs: TTS_WAIT_MS,
    });
    return;
  }

  for (const item of result) {
    if (item.status === "rejected") logTtsFailure(item.reason);
  }
}

export async function submitMenuDraft(input: MenuSubmitInput): Promise<MenuWithChildren> {
  const name = input.name.trim();
  if (!name) throw new Error("Menu name is required");

  const supabase = getSupabase();
  const ttsLang = input.tts_lang || defaultTtsLang();
  const published = input.published ?? true;
  let menuId = input.id;

  if (menuId) {
    const { error } = await supabase
      .from("menus")
      .update({ name, tts_lang: ttsLang, published })
      .eq("id", menuId);
    if (error) throw new Error(error.message);

    const { error: deleteError } = await supabase.from("days").delete().eq("menu_id", menuId);
    if (deleteError) throw new Error(deleteError.message);
  } else {
    const menu = await createMenu(name);
    menuId = menu.id;
    const { error } = await supabase
      .from("menus")
      .update({ tts_lang: ttsLang, published })
      .eq("id", menuId);
    if (error) throw new Error(error.message);
  }
  if (!menuId) throw new Error("Menu id is required");

  const dayIdsForTts: string[] = [];

  for (let dayIndex = 0; dayIndex < input.days.length; dayIndex++) {
    const meals = input.days[dayIndex].meals
      .map((meal) => meal.name.trim())
      .filter(Boolean)
      .slice(0, 5);
    if (meals.length === 0) continue;

    const { data: day, error: dayError } = await supabase
      .from("days")
      .insert({ menu_id: menuId, position: dayIndex })
      .select("id")
      .single();
    if (dayError) throw new Error(dayError.message);

    const dayId = (day as { id: string }).id;
    const mealRows = meals.map((mealName, mealIndex) => ({
      day_id: dayId,
      position: mealIndex,
      name: mealName,
    }));
    const { error: mealsError } = await supabase.from("meals").insert(mealRows);
    if (mealsError) throw new Error(mealsError.message);

    dayIdsForTts.push(dayId);
  }

  await waitForTts(dayIdsForTts);

  const saved = await getMenu(menuId);
  if (!saved) throw new Error("Menu was submitted but could not be reloaded");
  return saved;
}
