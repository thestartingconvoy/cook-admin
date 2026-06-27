# Setup TODO

Everything you need to get **cook-admin** live, in order. Four services to wire
up, then deploy.

**Minimum to log in and build menus:** steps 1, 2, 4.
Step 3 (voice notes) is optional. Step 5 is for when you're ready to point the
cook app at this.

---

## 1. Supabase — database + file storage

- [ ] Create a project at [supabase.com](https://supabase.com)
- [ ] **SQL Editor** → paste the contents of [`supabase/schema.sql`](supabase/schema.sql) → **Run** (creates the menus/days/meals tables)
- [ ] **Storage** → create a bucket named `cook-media` → make it **Public**
- [ ] From **Settings → API**, copy the **Project URL** and the **service_role** key
- [ ] Set env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## 2. Google login — so only you can get in

- [ ] Google Cloud Console → **APIs & Services → Credentials** → Create **OAuth client ID** → **Web application**
- [ ] Add an **Authorized redirect URI**: `https://YOUR-APP.vercel.app/api/auth/callback/google`
  - You can fill in the real URL after step 4. Add `http://localhost:3000/api/auth/callback/google` too if you want local dev.
- [ ] Copy the **Client ID** and **Client Secret**
- [ ] Set env vars:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `ALLOWED_ADMIN_EMAILS=satviks.2010@gmail.com` (only these emails can log in — comma-separate to add more)
  - `AUTH_SECRET` → generate with `openssl rand -base64 32` and paste the output

## 3. Voice notes (TTS) — OPTIONAL, can skip for now

- If you skip: voice notes stay empty and the cook app speaks the meal names itself. Everything still works.
- To enable real audio:
  - [ ] Google Cloud Console → enable **Text-to-Speech API**
  - [ ] Create an **API key**
  - [ ] Set env var `GOOGLE_TTS_API_KEY` (`TTS_LANG=en-IN` is the default; each menu can also override the language in the editor)

## 4. Deploy on Vercel

- [ ] Import this repo as a **new** Vercel project
- [ ] Paste all the env vars above into **Project Settings → Environment Variables**
- [ ] Deploy
- [ ] Go back to step 2 and make sure the redirect URI uses your real Vercel URL
- [ ] Visit the URL, sign in with your Google account, start making menus

## 5. Connect the cook app — LAST, once this is live

- [ ] In the **cook app** repo, edit `lib/menus.ts`:
  ```ts
  const MENUS_URL = "https://YOUR-APP.vercel.app/api/menus";
  ```
- That's the only change there. The JSON shape is identical to its mock `public/data/menus.json`.

---

## Two common gotchas

- **`ALLOWED_ADMIN_EMAILS`** — a typo here means you can't log in (sign-in fails closed).
- **OAuth redirect URI** — must exactly match your deployed URL, including `https://` and `/api/auth/callback/google`. Mismatch = login error.

> Full reference (env var table, project structure, how TTS-on-save works) is in
> [`README.md`](README.md).
