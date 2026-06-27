// CORS headers for the public read API consumed by the cook app.
export function corsHeaders(): Record<string, string> {
  const origin = process.env.COOK_APP_ORIGIN || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}
