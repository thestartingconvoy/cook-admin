"use client";

// Thin fetch wrappers for the admin API, used by client components.

type ApiErrorPayload = {
  status: number;
  statusText: string;
  url: string;
  body: unknown;
};

async function readBody(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function json<T>(res: Response): Promise<T> {
  const body = await readBody(res);

  if (!res.ok) {
    const payload: ApiErrorPayload = {
      status: res.status,
      statusText: res.statusText,
      url: res.url,
      body,
    };
    console.error("[cook-admin] Admin API request failed", payload);

    const message =
      body && typeof body === "object" && "error" in body
        ? String((body as { error?: unknown }).error)
        : `Request failed (${res.status})`;
    throw new Error(message);
  }

  return body as T;
}

export const api = {
  createMenu: (name: string) =>
    fetch("/api/admin/menus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).then(json),

  updateMenu: (id: string, patch: Record<string, unknown>) =>
    fetch(`/api/admin/menus/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).then(json),

  deleteMenu: (id: string) =>
    fetch(`/api/admin/menus/${id}`, { method: "DELETE" }).then(json),

  uploadCover: (id: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return fetch(`/api/admin/menus/${id}/cover`, { method: "POST", body: fd }).then(json);
  },

  addDay: (menuId: string) =>
    fetch(`/api/admin/menus/${menuId}/days`, { method: "POST" }).then(json),

  reorderDays: (menuId: string, orderedIds: string[]) =>
    fetch(`/api/admin/menus/${menuId}/days`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    }).then(json),

  deleteDay: (dayId: string) =>
    fetch(`/api/admin/days/${dayId}`, { method: "DELETE" }).then(json),

  addMeal: (dayId: string, name: string) =>
    fetch(`/api/admin/days/${dayId}/meals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).then(json),

  reorderMeals: (dayId: string, orderedIds: string[]) =>
    fetch(`/api/admin/days/${dayId}/meals`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    }).then(json),

  updateMeal: (mealId: string, name: string) =>
    fetch(`/api/admin/meals/${mealId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).then(json),

  deleteMeal: (mealId: string) =>
    fetch(`/api/admin/meals/${mealId}`, { method: "DELETE" }).then(json),

  uploadMealImage: (mealId: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return fetch(`/api/admin/meals/${mealId}/image`, { method: "POST", body: fd }).then(json);
  },

  uploadDayAudio: (dayId: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return fetch(`/api/admin/days/${dayId}/audio`, { method: "POST", body: fd }).then(json);
  },

  clearDayAudio: (dayId: string) =>
    fetch(`/api/admin/days/${dayId}/audio`, { method: "DELETE" }).then(json),
};
