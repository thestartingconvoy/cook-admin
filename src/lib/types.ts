// ---------------------------------------------------------------------------
// PUBLIC CONTRACT — must stay byte-compatible with the cook app's lib/types.ts.
// The cook app consumes `GET /api/menus` as `Menu[]`. Do not change these
// shapes without updating the cook app in lockstep.
// ---------------------------------------------------------------------------

export interface Meal {
  name: string;
  image?: string | null;
}

export interface MenuDay {
  day: number; // 1-indexed
  meals: Meal[]; // 3–5 items, order = cooking order (breakfast→dinner)
  voiceNote?: string | null; // URL to combined day audio; null => cook app uses browser TTS
}

export interface Menu {
  id: string; // stable slug, e.g. "north-indian-veg"
  name: string;
  cover?: string | null;
  days: MenuDay[];
}

// ---------------------------------------------------------------------------
// INTERNAL DB ROW SHAPES (relational sketch from the brief).
// ---------------------------------------------------------------------------

export interface MenuRow {
  id: string; // slug, primary key
  name: string;
  cover_url: string | null;
  published: boolean;
  tts_lang: string | null;
  created_at: string;
}

export interface DayRow {
  id: string;
  menu_id: string;
  position: number; // drives ordering
  voice_note_url: string | null;
  voice_note_is_custom: boolean; // custom upload overrides generated TTS
  meals_hash: string | null; // fingerprint of meal names+lang last TTS was generated for
  created_at: string;
}

export interface MealRow {
  id: string;
  day_id: string;
  position: number; // drives ordering
  name: string;
  image_url: string | null;
}

// A menu with its nested days+meals, as loaded from the DB for editing.
export interface MenuWithChildren extends MenuRow {
  days: (DayRow & { meals: MealRow[] })[];
}
