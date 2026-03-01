-- =============================================
-- AlgoMatch — Supabase SQL Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- USERS TABLE
create table public.users (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text not null,
  username            text unique not null,
  display_name        text,
  bio                 text check (char_length(bio) <= 150),
  avatar_emoji        text default '🦊',
  leetcode_url        text,
  contact_discord     text,
  contact_telegram    text,
  questionnaire_done  boolean default false,
  created_at          timestamptz default now()
);

-- QUESTIONNAIRE TABLE
create table public.questionnaire (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  platform          text not null,      -- 'leetcode' | 'codeforces' | 'both'
  level             text not null,      -- 'beginner' | 'intermediate' | 'advanced' | 'expert'
  difficulty        text not null,      -- 'easy' | 'easy_med' | 'medium' | 'med_hard' | 'hard'
  language          text not null,      -- 'python' | 'java' | 'cpp' | 'javascript' | 'golang' | 'any'
  practice_style    text not null,      -- 'solve_discuss' | 'live_pair' | 'compete' | 'teach' | 'mock'
  goal              text,               -- 'faang' | 'startup' | 'competitive' | 'learning'
  topics            text[] default '{}',
  timezone          text not null,      -- 'Asia/Kolkata'
  local_hour        int  not null,      -- 0-23 (24hr)
  local_minute      int  not null default 0,
  utc_start_min     int  not null,      -- minutes from midnight UTC, 0-1439
  utc_end_min       int  not null,      -- utc_start_min + duration
  duration_minutes  int  not null default 60,
  practice_days     text[] not null,    -- ['Mon','Tue','Wed']
  created_at        timestamptz default now(),
  unique(user_id)
);

-- INTERESTS TABLE
create table public.interests (
  id           uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.users(id) on delete cascade,
  to_user_id   uuid not null references public.users(id) on delete cascade,
  status       text not null default 'pending', -- 'pending' | 'accepted'
  created_at   timestamptz default now(),
  unique(from_user_id, to_user_id)
);

-- ─── Row Level Security ───────────────────────────────────────────

alter table public.users         enable row level security;
alter table public.questionnaire enable row level security;
alter table public.interests     enable row level security;

-- Users: read own + read others (for matching display)
create policy "Users can read all profiles"
  on public.users for select using (true);

create policy "Users can insert own profile"
  on public.users for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);

-- Questionnaire: service role handles matching reads, users manage own
create policy "Users can manage own questionnaire"
  on public.questionnaire for all using (auth.uid() = user_id);

-- Interests: users can see their own sent/received
create policy "Users can see own interests"
  on public.interests for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Users can insert interests"
  on public.interests for insert with check (auth.uid() = from_user_id);

create policy "Users can update interests they received"
  on public.interests for update using (auth.uid() = to_user_id);

create policy "Users can delete interests"
  on public.interests for delete using (
    auth.uid() = from_user_id or auth.uid() = to_user_id
  );

-- ─── Indexes ───────────────────────────────────────────────────
create index idx_questionnaire_user    on public.questionnaire(user_id);
create index idx_questionnaire_utc     on public.questionnaire(utc_start_min, utc_end_min);
create index idx_interests_to_user     on public.interests(to_user_id, status);
create index idx_interests_from_user   on public.interests(from_user_id, status);
