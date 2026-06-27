import { getSupabase, storageBucket } from "./supabase";

// Upload bytes to the public storage bucket and return an absolute, CORS-
// accessible URL. The cook app caches these via the Cache API for offline use,
// so they must be public and absolute.
export async function uploadToStorage(
  path: string,
  body: ArrayBuffer | Uint8Array | Blob,
  contentType: string
): Promise<string> {
  const supabase = getSupabase();
  const bucket = storageBucket();

  const { error } = await supabase.storage.from(bucket).upload(path, body, {
    contentType,
    upsert: true,
    cacheControl: "31536000",
  });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Best-effort delete; ignores "not found" so callers can clean up freely.
export async function deleteFromStorage(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const supabase = getSupabase();
  await supabase.storage.from(storageBucket()).remove(paths);
}

// Derive the in-bucket object path from a public URL we previously generated,
// so we can delete it later. Returns null if the URL isn't from our bucket.
export function storagePathFromUrl(url: string | null): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${storageBucket()}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}
