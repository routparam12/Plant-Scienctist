-- ==========================================================
-- PLANT SCIENTIST: USER-CENTRIC COMPREHENSIVE SUPABASE SCHEMA
-- Profiles, Master Crops, Direct User Crops, Care Tasks, Diagnoses & Storage
-- ==========================================================

-- 1. Profiles Table (Farmer = User)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  preferred_language text not null default 'hi',
  state text,
  district text,
  village text,
  latitude double precision,
  longitude double precision,
  total_acreage double precision default 0.0,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 2. Master Crops Catalog (Reference / Lookup Table)
create table if not exists public.crops (
  id text primary key,
  name text not null,
  hindi_name text not null,
  marathi_name text not null,
  variety text not null default 'Standard',
  category text not null default 'General',
  icon text not null default '🌱',
  season text,
  growth_duration_days int default 90,
  stages jsonb,
  aliases text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.crops enable row level security;

drop policy if exists "Crops catalog is readable by everyone" on public.crops;
create policy "Crops catalog is readable by everyone"
  on public.crops for select
  using (true);

-- Seed Initial Crops Catalog with verified stage days (sum(stage days) == growth_duration_days)
insert into public.crops (id, name, hindi_name, marathi_name, variety, category, icon, season, growth_duration_days, stages, aliases)
values
  (
    'crop-tomato', 'Tomato (Abhinav)', 'टमाटर (अभिनव)', 'टोमॅटो (अभिनव)', 'Syngenta Abhinav F1', 'Tomato', '🍅', 'Kharif/Rabi', 110,
    '[{"key":"vegetative","days":30},{"key":"flowering","days":25},{"key":"fruiting","days":40},{"key":"harvest","days":15}]'::jsonb,
    array['tamatar', 'tomato', 'tamata', 'टमाटर', 'टोमॅटो']
  ),
  (
    'crop-wheat', 'Wheat (GW-496)', 'गेहूं (जीडब्ल्यू-496)', 'गहू (जीडब्ल्यू-४९६)', 'ICAR GW-496 High Yield', 'Wheat', '🌾', 'Rabi', 125,
    '[{"key":"vegetative","days":45},{"key":"flowering","days":30},{"key":"grain_filling","days":35},{"key":"harvest","days":15}]'::jsonb,
    array['gehun', 'wheat', 'gehu', 'gahu', 'गेहूं', 'गहू']
  ),
  (
    'crop-cotton', 'Cotton (BT-2)', 'कपास (बीटी-2)', 'कापूस (बीटी-२)', 'Bollgard II Hybrid', 'Cotton', '⚪', 'Kharif', 160,
    '[{"key":"vegetative","days":50},{"key":"flowering","days":45},{"key":"fruiting","days":45},{"key":"harvest","days":20}]'::jsonb,
    array['kapas', 'cotton', 'kapus', 'कपास', 'कापूस']
  ),
  (
    'crop-paddy', 'Paddy / Rice (Pusa 1121)', 'धान / चावल (पूसा 1121)', 'भात (पुसा ११२१)', 'Pusa Basmati 1121', 'Paddy', '🌾', 'Kharif', 140,
    '[{"key":"vegetative","days":50},{"key":"flowering","days":35},{"key":"grain_filling","days":40},{"key":"harvest","days":15}]'::jsonb,
    array['dhan', 'paddy', 'rice', 'chawal', 'bhat', 'धान', 'चावल', 'भात']
  ),
  (
    'crop-chilli', 'Chilli (Teja)', 'हरी मिर्च (तेजा)', 'मिरची (तेजा)', 'Guntur Teja Hot', 'Spices', '🌶️', 'All Season', 150,
    '[{"key":"vegetative","days":40},{"key":"flowering","days":35},{"key":"fruiting","days":55},{"key":"harvest","days":20}]'::jsonb,
    array['mirch', 'chilli', 'mirchi', 'hari mirch', 'मिर्च', 'मिरची']
  ),
  (
    'crop-onion', 'Onion (Bhima Super)', 'प्याज (भीमा सुपर)', 'कांदा (भीमा सुपर)', 'DOGR Bhima Super Red', 'Vegetable', '🧅', 'Rabi/Late Kharif', 120,
    '[{"key":"vegetative","days":40},{"key":"vegetative_extension","days":35},{"key":"fruiting","days":35},{"key":"harvest","days":10}]'::jsonb,
    array['pyaaz', 'onion', 'kanda', 'pyaj', 'प्याज', 'कांदा']
  ),
  (
    'crop-potato', 'Potato (Kufri Jyoti)', 'आलू (कुफरी ज्योति)', 'बटाटा (कुफरी ज्योती)', 'CPRI Kufri Jyoti', 'Vegetable', '🥔', 'Rabi', 100,
    '[{"key":"vegetative","days":30},{"key":"flowering","days":25},{"key":"fruiting","days":35},{"key":"harvest","days":10}]'::jsonb,
    array['aalu', 'potato', 'batata', 'alu', 'आलू', 'बटाटा']
  ),
  (
    'crop-soybean', 'Soybean (JS 335)', 'सोयाबीन (जेएस 335)', 'सोयाबीन (जेएस ३३५)', 'Jawahar JS-335', 'Oilseed', '🌱', 'Kharif', 95,
    '[{"key":"vegetative","days":30},{"key":"flowering","days":25},{"key":"fruiting","days":30},{"key":"harvest","days":10}]'::jsonb,
    array['soybean', 'soya', 'soyabean', 'सोयाबीन']
  )
on conflict (id) do update set
  name = excluded.name,
  hindi_name = excluded.hindi_name,
  marathi_name = excluded.marathi_name,
  variety = excluded.variety,
  stages = excluded.stages,
  aliases = excluded.aliases,
  growth_duration_days = excluded.growth_duration_days;

-- 3. Optional Land / Farms Table
create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Main Farm',
  location text,
  village text,
  district text,
  state text,
  total_acreage double precision default 1.0,
  soil_type text default 'Alluvial Loam',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.farms enable row level security;

drop policy if exists "Users can manage their own farms" on public.farms;
create policy "Users can manage their own farms"
  on public.farms for all
  using (auth.uid() = user_id);

-- 4. User Crops Table (Crops belong directly to User; farm_id is optional)
create table if not exists public.farm_crops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  farm_id uuid references public.farms(id) on delete cascade,
  crop_type_id text references public.crops(id) on delete set null,
  custom_name text,
  variety text,
  acreage double precision,
  planted_date date,
  reported_stage text,
  notes text,
  source text not null default 'manual' check (source in ('manual','diagnosis','voice')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crop_has_identity check (crop_type_id is not null or custom_name is not null),
  constraint acreage_positive check (acreage is null or acreage > 0)
);

create index if not exists farm_crops_user_idx on public.farm_crops(user_id);
create index if not exists farm_crops_type_idx on public.farm_crops(crop_type_id);

alter table public.farm_crops enable row level security;

drop policy if exists "Users can manage their own crops" on public.farm_crops;
create policy "Users can manage their own crops"
  on public.farm_crops for all
  using (auth.uid() = user_id);

-- 5. Care Tasks (linked to user crop)
create table if not exists public.farm_crop_tasks (
  id uuid primary key default gen_random_uuid(),
  farm_crop_id uuid not null references public.farm_crops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  hindi_title text,
  marathi_title text,
  type text not null default 'Spraying',
  priority text not null default 'medium' check (priority in ('high','medium','low')),
  due_at timestamptz not null default (now() + interval '2 days'),
  completed boolean not null default false,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists tasks_crop_idx on public.farm_crop_tasks(farm_crop_id);
create index if not exists tasks_user_idx on public.farm_crop_tasks(user_id);

alter table public.farm_crop_tasks enable row level security;

drop policy if exists "Users can manage their crop tasks" on public.farm_crop_tasks;
create policy "Users can manage their crop tasks"
  on public.farm_crop_tasks for all
  using (auth.uid() = user_id);

-- 6. Crop Pathology Diagnoses Table
create table if not exists public.diagnoses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  farm_crop_id uuid references public.farm_crops(id) on delete set null,
  image_path text,
  image_url text,
  disease_name text not null,
  scientific_name text,
  crop text not null,
  pathogen_type text default 'Unknown',
  severity text not null default 'Moderate',
  severity_score int default 50,
  confidence_score double precision default 90.0,
  symptoms jsonb default '[]'::jsonb,
  organic_remedies jsonb default '[]'::jsonb,
  chemical_treatments jsonb default '[]'::jsonb,
  preventive_measures jsonb default '[]'::jsonb,
  advisory_note text,
  user_notes text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists diagnoses_crop_idx on public.diagnoses(farm_crop_id);
create index if not exists diagnoses_user_idx on public.diagnoses(user_id);

alter table public.diagnoses enable row level security;

drop policy if exists "Users can view their diagnoses" on public.diagnoses;
create policy "Users can view their diagnoses"
  on public.diagnoses for select
  using (auth.uid() = user_id or user_id is null);

drop policy if exists "Users can insert diagnoses" on public.diagnoses;
create policy "Users can insert diagnoses"
  on public.diagnoses for insert
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Users can update their diagnoses" on public.diagnoses;
create policy "Users can update their diagnoses"
  on public.diagnoses for update
  using (auth.uid() = user_id);

-- 7. Trigger: Auto-create Profile on Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, preferred_language, onboarding_completed)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    'hi',
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. Storage: Private Bucket for Crop Pathology Images
insert into storage.buckets (id, name, public)
values ('crop-images', 'crop-images', false)
on conflict (id) do nothing;

drop policy if exists "Users can upload their crop images" on storage.objects;
create policy "Users can upload their crop images"
  on storage.objects for insert
  with check (bucket_id = 'crop-images' and (auth.uid())::text = (storage.foldername(name))[1]);

drop policy if exists "Users can view their crop images" on storage.objects;
create policy "Users can view their crop images"
  on storage.objects for select
  using (bucket_id = 'crop-images' and (auth.uid())::text = (storage.foldername(name))[1]);
