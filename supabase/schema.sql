-- Cook Admin schema. Run this in the Supabase SQL editor (or via the CLI).
-- Mirrors the relational sketch in ADMIN_BRIEF.md.

create table if not exists menus (
  id          text primary key,            -- stable slug, e.g. "north-indian-veg"
  name        text not null,
  cover_url   text,
  published   boolean not null default false,
  tts_lang    text default 'en-IN',
  created_at  timestamptz not null default now()
);

create table if not exists days (
  id                    uuid primary key default gen_random_uuid(),
  menu_id               text not null references menus(id) on delete cascade,
  position              int not null default 0,   -- drives day ordering
  voice_note_url        text,
  voice_note_is_custom  boolean not null default false,  -- custom upload overrides TTS
  meals_hash            text,                       -- fingerprint of last TTS inputs
  created_at            timestamptz not null default now()
);

create table if not exists meals (
  id         uuid primary key default gen_random_uuid(),
  day_id     uuid not null references days(id) on delete cascade,
  position   int not null default 0,        -- drives meal ordering (cooking order)
  name       text not null,
  image_url  text
);

create index if not exists days_menu_id_idx on days(menu_id);
create index if not exists meals_day_id_idx on meals(day_id);

-- The app talks to the database with the service-role key from server code
-- only, and access is gated by Auth.js. RLS is therefore left disabled. If you
-- prefer to enable RLS, add policies before doing so or every query will fail.

-- ---------------------------------------------------------------------------
-- Storage: create a PUBLIC bucket named to match SUPABASE_STORAGE_BUCKET
-- (default "cook-media"). Public so the cook app can fetch + Cache-API the
-- image/audio URLs cross-origin and offline.
--
--   insert into storage.buckets (id, name, public)
--   values ('cook-media', 'cook-media', true)
--   on conflict (id) do update set public = true;
-- ---------------------------------------------------------------------------
