# Cook Admin

Private menu-authoring companion for the **cook app**. The owner signs in with
Google, builds **menus** (days → 3–5 ordered meals + a per-day voice note), and
publishes them. A public, CORS-enabled, cacheable `GET /api/menus` serves the
exact `Menu[]` shape the cook app consumes.

> Deploys as its **own Vercel project**, separate from the cook app.

## Stack

- **Next.js (App Router) + TypeScript + Tailwind v4** — mirrors the cook app.
- **Supabase** — Postgres (menus/days/meals) + Storage (images + audio).
- **Auth.js (NextAuth v5)** — Google OAuth, gated by an owner allow-list.
- **Google Cloud TTS** — auto-generates per-day audio on save (en-IN / hi-IN).
  Pluggable and optional: with no key, voice notes stay empty and the cook app
  uses its own browser TTS.

## The contract (do not break)

`GET /api/menus` returns an **array of `Menu`** (only published menus):

```ts
interface Meal { name: string; image?: string | null; }
interface MenuDay { day: number; meals: Meal[]; voiceNote?: string | null; }
interface Menu { id: string; name: string; cover?: string | null; days: MenuDay[]; }
```

- `image` and `voiceNote` are **absolute, CORS-accessible URLs** (Supabase public
  storage) so the cook app can Cache-API them offline.
- `voiceNote: null` => cook app falls back to browser TTS.
- The admin stores **content only** — no dates/scheduling. The cook app owns
  rotation math.
- `GET /api/menus/:id` returns a single published `Menu` (optional convenience).

Types live in [`src/lib/types.ts`](src/lib/types.ts) and must stay
byte-compatible with the cook app's `lib/types.ts`.

## Local setup

1. **Install**

   ```bash
   npm install
   ```

2. **Supabase**
   - Create a project at <https://supabase.com>.
   - Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor.
   - Create a **public** Storage bucket named `cook-media` (or set
     `SUPABASE_STORAGE_BUCKET`). See the note at the bottom of the schema file.
   - Copy the project URL and the **service-role** key.

3. **Google OAuth** (for login)
   - In Google Cloud Console → APIs & Services → Credentials, create an OAuth
     client (Web application).
   - Authorized redirect URI:
     `http://localhost:3000/api/auth/callback/google` (and your Vercel URL in
     production).

4. **Google Cloud TTS** (optional)
   - Enable the Text-to-Speech API and create an API key → `GOOGLE_TTS_API_KEY`.
   - Skip to launch without TTS; voice notes stay null.

5. **Env** — copy `.env.example` to `.env.local` and fill it in:

   ```bash
   cp .env.example .env.local
   # generate AUTH_SECRET:
   openssl rand -base64 32
   ```

6. **Run**

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000>, sign in with an allow-listed Google account.

## Environment variables

| Var | Required | Purpose |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth login |
| `ALLOWED_ADMIN_EMAILS` | ✅ | Comma-separated owner allow-list |
| `AUTH_SECRET` | ✅ | Encrypts the session JWT |
| `NEXTAUTH_URL` | local dev | App base URL for OAuth callbacks |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server-only DB/storage access |
| `SUPABASE_STORAGE_BUCKET` | optional | Defaults to `cook-media` |
| `GOOGLE_TTS_API_KEY` | optional | Enables auto TTS generation |
| `TTS_LANG` | optional | Default voice language (`en-IN`) |
| `COOK_APP_ORIGIN` | optional | CORS origin for `/api/menus` (`*` default) |

## Deploy to Vercel

1. Push this repo to GitHub and **import it as a new Vercel project**.
2. Add all env vars above in the Vercel project settings.
3. Add the Vercel production + preview URLs as authorized redirect URIs on the
   Google OAuth client: `https://<your-app>.vercel.app/api/auth/callback/google`.
4. Set `COOK_APP_ORIGIN` to the cook app's origin (or leave `*`).
5. Deploy.

## Wiring the cook app to this admin

Once this is live, point the cook app at the admin API. In the **cook app**,
update `lib/menus.ts`:

```ts
const MENUS_URL = "https://<your-cook-admin>.vercel.app/api/menus";
```

That's the only change — the JSON shape is identical to its mock
`public/data/menus.json`.

## How TTS-on-save works

On any change to a day's meal names, order, or the menu's language, the server
rebuilds the spoken text (`"Poha. Dal Chawal. Roti Aloo Gobi."`), calls Google
TTS, uploads the MP3 to storage, and saves the URL on the day. A custom uploaded
recording always takes precedence; removing it falls back to generated TTS, and
generated TTS falls back to the cook app's browser TTS when no key is set. A
fingerprint of the inputs avoids regenerating when nothing relevant changed.

## Project structure

```
src/
  auth.ts                 # Auth.js config + allow-list gate
  middleware.ts           # Gates everything except /api/menus and /login
  lib/
    types.ts              # Public contract + DB row types
    serialize.ts          # DB rows -> public Menu shape
    supabase.ts           # Service-role client
    storage.ts            # Upload/delete + public URLs
    tts.ts                # Pluggable Google TTS
    menus.ts              # Data-access + CRUD + TTS regeneration
    cors.ts / guard.ts    # CORS + admin auth guard
    client-api.ts         # Client-side fetch wrappers
  app/
    api/menus/...         # PUBLIC read API (Menu[])
    api/admin/...         # Auth-gated CRUD
    page.tsx              # Dashboard
    menu/[id]/page.tsx    # Menu editor
    login/page.tsx        # Google sign-in
  components/             # Dashboard + editor UI
supabase/schema.sql       # DB schema
```
