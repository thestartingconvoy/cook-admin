import type { Menu, MenuDay, MenuWithChildren } from "./types";

// Convert an internal DB row tree into the public `Menu` contract shape.
// Ordering is driven by `position`; days are re-numbered 1-indexed for the API.
export function toPublicMenu(row: MenuWithChildren): Menu {
  const days: MenuDay[] = [...row.days]
    .sort((a, b) => a.position - b.position)
    .map((d, idx) => ({
      day: idx + 1,
      meals: [...d.meals]
        .sort((a, b) => a.position - b.position)
        .map((m) => ({
          name: m.name,
          image: m.image_url ?? null,
        })),
      voiceNote: d.voice_note_url ?? null,
    }));

  return {
    id: row.id,
    name: row.name,
    cover: row.cover_url ?? null,
    days,
  };
}
