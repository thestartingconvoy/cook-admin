import "server-only";
import { getSupabase } from "./supabase";
import { uploadToStorage, deleteFromStorage, storagePathFromUrl } from "./storage";
import {
  buildTtsText,
  defaultTtsLang,
  synthesizeSpeech,
  ttsFingerprint,
} from "./tts";
import type {
  DayRow,
  MealRow,
  MenuRow,
  MenuWithChildren,
} from "./types";

const MENU_SELECT =
  "id,name,cover_url,published,tts_lang,created_at,days(id,menu_id,position,voice_note_url,voice_note_is_custom,meals_hash,created_at,meals(id,day_id,position,name,image_url))";

// ---- Reads ---------------------------------------------------------------

export async function listMenus(opts: {
  publishedOnly: boolean;
}): Promise<MenuWithChildren[]> {
  const supabase = getSupabase();
  let query = supabase.from("menus").select(MENU_SELECT);
  if (opts.publishedOnly) query = query.eq("published", true);
  const { data, error } = await query.order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as MenuWithChildren[];
}

export async function getMenu(id: string): Promise<MenuWithChildren | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("menus")
    .select(MENU_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as MenuWithChildren) ?? null;
}

// ---- Menu mutations ------------------------------------------------------

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function createMenu(name: string): Promise<MenuRow> {
  const supabase = getSupabase();
  const base = slugify(name) || "menu";
  let id = base;
  // Ensure slug uniqueness.
  for (let i = 2; ; i++) {
    const { data } = await supabase.from("menus").select("id").eq("id", id).maybeSingle();
    if (!data) break;
    id = `${base}-${i}`;
  }
  const { data, error } = await supabase
    .from("menus")
    .insert({ id, name, tts_lang: defaultTtsLang(), published: false })
    .select("id,name,cover_url,published,tts_lang,created_at")
    .single();
  if (error) throw new Error(error.message);
  return data as MenuRow;
}

export async function updateMenu(
  id: string,
  patch: Partial<Pick<MenuRow, "name" | "cover_url" | "published" | "tts_lang">>
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("menus").update(patch).eq("id", id);
  if (error) throw new Error(error.message);

  // If language changed, regenerate every day's generated (non-custom) audio.
  if (patch.tts_lang) {
    const menu = await getMenu(id);
    if (menu) {
      for (const day of menu.days) {
        await regenerateDayTts(day.id);
      }
    }
  }
}

export async function deleteMenu(id: string): Promise<void> {
  const supabase = getSupabase();
  const menu = await getMenu(id);
  if (menu) {
    // Clean up stored files (cover, day audio, meal images).
    const paths = [
      storagePathFromUrl(menu.cover_url),
      ...menu.days.map((d) => storagePathFromUrl(d.voice_note_url)),
      ...menu.days.flatMap((d) => d.meals.map((m) => storagePathFromUrl(m.image_url))),
    ].filter((p): p is string => Boolean(p));
    await deleteFromStorage(paths);
  }
  const { error } = await supabase.from("menus").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- Day mutations -------------------------------------------------------

export async function addDay(menuId: string): Promise<DayRow> {
  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from("days")
    .select("position")
    .eq("menu_id", menuId)
    .order("position", { ascending: false })
    .limit(1);
  const nextPos = (existing?.[0]?.position ?? -1) + 1;
  const { data, error } = await supabase
    .from("days")
    .insert({ menu_id: menuId, position: nextPos })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as DayRow;
}

export async function deleteDay(dayId: string): Promise<void> {
  const supabase = getSupabase();
  const { data: day } = await supabase
    .from("days")
    .select("voice_note_url,meals(image_url)")
    .eq("id", dayId)
    .maybeSingle();
  if (day) {
    const meals = (day as { meals?: { image_url: string | null }[] }).meals ?? [];
    const paths = [
      storagePathFromUrl((day as { voice_note_url: string | null }).voice_note_url),
      ...meals.map((m) => storagePathFromUrl(m.image_url)),
    ].filter((p): p is string => Boolean(p));
    await deleteFromStorage(paths);
  }
  const { error } = await supabase.from("days").delete().eq("id", dayId);
  if (error) throw new Error(error.message);
}

// Persist a new ordering of days for a menu. `orderedIds` is the desired order.
export async function reorderDays(menuId: string, orderedIds: string[]): Promise<void> {
  const supabase = getSupabase();
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("days")
      .update({ position: i })
      .eq("id", orderedIds[i])
      .eq("menu_id", menuId);
    if (error) throw new Error(error.message);
  }
}

// ---- Meal mutations ------------------------------------------------------

export async function addMeal(dayId: string, name: string): Promise<MealRow> {
  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from("meals")
    .select("position")
    .eq("day_id", dayId)
    .order("position", { ascending: false })
    .limit(1);
  const nextPos = (existing?.[0]?.position ?? -1) + 1;
  const { data, error } = await supabase
    .from("meals")
    .insert({ day_id: dayId, position: nextPos, name })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await regenerateDayTts(dayId);
  return data as MealRow;
}

export async function updateMeal(
  mealId: string,
  patch: Partial<Pick<MealRow, "name" | "image_url">>
): Promise<void> {
  const supabase = getSupabase();
  const { data: meal, error } = await supabase
    .from("meals")
    .update(patch)
    .eq("id", mealId)
    .select("day_id")
    .single();
  if (error) throw new Error(error.message);
  // Meal-name changes affect the day's TTS text.
  if (patch.name !== undefined) {
    await regenerateDayTts((meal as { day_id: string }).day_id);
  }
}

export async function deleteMeal(mealId: string): Promise<void> {
  const supabase = getSupabase();
  const { data: meal } = await supabase
    .from("meals")
    .select("day_id,image_url")
    .eq("id", mealId)
    .maybeSingle();
  if (meal) {
    const path = storagePathFromUrl((meal as { image_url: string | null }).image_url);
    if (path) await deleteFromStorage([path]);
  }
  const { error } = await supabase.from("meals").delete().eq("id", mealId);
  if (error) throw new Error(error.message);
  if (meal) await regenerateDayTts((meal as { day_id: string }).day_id);
}

export async function reorderMeals(dayId: string, orderedIds: string[]): Promise<void> {
  const supabase = getSupabase();
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("meals")
      .update({ position: i })
      .eq("id", orderedIds[i])
      .eq("day_id", dayId);
    if (error) throw new Error(error.message);
  }
  // Order is part of the spoken text, so regenerate.
  await regenerateDayTts(dayId);
}

// ---- Custom audio upload -------------------------------------------------

export async function setCustomDayAudio(
  dayId: string,
  audio: ArrayBuffer,
  contentType: string
): Promise<string> {
  const supabase = getSupabase();
  const ext = contentType.includes("wav") ? "wav" : contentType.includes("ogg") ? "ogg" : "mp3";
  const url = await uploadToStorage(`audio/${dayId}-custom-${Date.now()}.${ext}`, audio, contentType);
  const { error } = await supabase
    .from("days")
    .update({ voice_note_url: url, voice_note_is_custom: true })
    .eq("id", dayId);
  if (error) throw new Error(error.message);
  return url;
}

// Remove the custom recording and fall back to generated TTS.
export async function clearCustomDayAudio(dayId: string): Promise<void> {
  const supabase = getSupabase();
  const { data: day } = await supabase
    .from("days")
    .select("voice_note_url,voice_note_is_custom")
    .eq("id", dayId)
    .maybeSingle();
  const path = storagePathFromUrl((day as { voice_note_url: string | null })?.voice_note_url ?? null);
  if (path) await deleteFromStorage([path]);
  await supabase
    .from("days")
    .update({ voice_note_url: null, voice_note_is_custom: false, meals_hash: null })
    .eq("id", dayId);
  await regenerateDayTts(dayId);
}

// ---- TTS regeneration ----------------------------------------------------

// Regenerate a day's voice note from its meal names, unless a custom recording
// is in place (custom always wins). No-ops when TTS isn't configured or when
// the meal names+language haven't changed since the last generation.
export async function regenerateDayTts(dayId: string): Promise<void> {
  const supabase = getSupabase();
  const { data: day, error } = await supabase
    .from("days")
    .select("id,menu_id,voice_note_is_custom,meals_hash,meals(name,position),menus(tts_lang)")
    .eq("id", dayId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!day) return;

  const typed = day as unknown as {
    voice_note_is_custom: boolean;
    meals_hash: string | null;
    meals: { name: string; position: number }[];
    menus: { tts_lang: string | null } | null;
  };

  // Custom upload takes precedence — never overwrite it.
  if (typed.voice_note_is_custom) return;

  const lang = typed.menus?.tts_lang || defaultTtsLang();
  const names = [...typed.meals]
    .sort((a, b) => a.position - b.position)
    .map((m) => m.name);
  const fingerprint = ttsFingerprint(names, lang);

  // Skip if nothing relevant changed.
  if (typed.meals_hash === fingerprint) return;

  const text = buildTtsText(names);
  const result = await synthesizeSpeech(text, lang);

  if (!result) {
    // TTS disabled or empty text: leave voiceNote null so the cook app uses
    // its browser TTS fallback. Still record the fingerprint to avoid retrying.
    await supabase
      .from("days")
      .update({ voice_note_url: null, meals_hash: fingerprint })
      .eq("id", dayId);
    return;
  }

  const url = await uploadToStorage(
    `audio/${dayId}-tts-${Date.now()}.mp3`,
    result.audio,
    result.contentType
  );
  await supabase
    .from("days")
    .update({ voice_note_url: url, voice_note_is_custom: false, meals_hash: fingerprint })
    .eq("id", dayId);
}
