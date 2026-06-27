// Pluggable TTS layer. The live path is Google Cloud Text-to-Speech (best
// en-IN / hi-IN voices). When no API key is configured, generation is skipped
// and the day's voiceNote stays null — the cook app then falls back to its own
// browser TTS, so the app keeps working with zero TTS config.

export interface TtsResult {
  audio: Uint8Array;
  contentType: string;
}

export function defaultTtsLang(): string {
  return process.env.TTS_LANG || "en-IN";
}

export function ttsEnabled(): boolean {
  return Boolean(process.env.GOOGLE_TTS_API_KEY);
}

// Build the spoken text from meal names in cooking order.
// e.g. ["Poha", "Dal Chawal", "Roti Aloo Gobi"] -> "Poha. Dal Chawal. Roti Aloo Gobi."
export function buildTtsText(mealNames: string[]): string {
  return mealNames
    .map((n) => n.trim())
    .filter(Boolean)
    .map((n) => (/[.!?]$/.test(n) ? n : `${n}.`))
    .join(" ");
}

// A stable fingerprint of the inputs that determine the generated audio, used
// to skip regeneration when nothing relevant changed.
export function ttsFingerprint(mealNames: string[], lang: string): string {
  return `${lang}::${mealNames.map((n) => n.trim()).join("|")}`;
}

// Pick a reasonable default voice per language. Google Neural2/Standard voices.
function voiceForLang(lang: string): { languageCode: string; name?: string } {
  switch (lang) {
    case "hi-IN":
      return { languageCode: "hi-IN", name: "hi-IN-Neural2-A" };
    case "en-IN":
    default:
      return { languageCode: "en-IN", name: "en-IN-Neural2-A" };
  }
}

export async function synthesizeSpeech(
  text: string,
  lang: string = defaultTtsLang()
): Promise<TtsResult | null> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey || !text.trim()) return null;

  const voice = voiceForLang(lang);
  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice,
        audioConfig: { audioEncoding: "MP3" },
      }),
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Google TTS failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const json = (await res.json()) as { audioContent?: string };
  if (!json.audioContent) return null;

  // audioContent is base64-encoded MP3.
  const audio = Uint8Array.from(Buffer.from(json.audioContent, "base64"));
  return { audio, contentType: "audio/mpeg" };
}
