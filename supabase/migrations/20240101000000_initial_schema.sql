-- ─────────────────────────────────────────────────────────────────────────────
-- Le Français Malin — Supabase schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Profiles ──────────────────────────────────────────────────────────────────
-- One row per authenticated user. Created automatically on sign-up via trigger.

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '',
  level       text not null default 'A2',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── User Progress ─────────────────────────────────────────────────────────────
-- One row per user × topic. Tracks best score and mastery level.

create table if not exists public.user_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  topic_id        text not null,
  best_score      integer not null default 0,
  total_attempts  integer not null default 0,
  mastery_level   integer not null default 0,  -- 0-4; >=3 = mastered
  last_practiced  timestamptz not null default now(),
  unique (user_id, topic_id)
);

alter table public.user_progress enable row level security;

create policy "Users can view their own progress"
  on public.user_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert their own progress"
  on public.user_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own progress"
  on public.user_progress for update
  using (auth.uid() = user_id);


-- ── User Mistakes ─────────────────────────────────────────────────────────────

create table if not exists public.user_mistakes (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  topic_id              text not null,
  question              text not null default '',
  user_answer           text not null default '',
  correct_answer        text not null default '',
  mistake_type          text not null default 'grammar',
  is_resolved           boolean not null default false,
  resolution_attempts   integer not null default 0,
  created_at            timestamptz not null default now()
);

alter table public.user_mistakes enable row level security;

create policy "Users can view their own mistakes"
  on public.user_mistakes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own mistakes"
  on public.user_mistakes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own mistakes"
  on public.user_mistakes for update
  using (auth.uid() = user_id);


-- ── User Achievements ─────────────────────────────────────────────────────────

create table if not exists public.user_achievements (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  achievement_type  text not null,
  achievement_data  jsonb,
  earned_at         timestamptz not null default now(),
  unique (user_id, achievement_type)
);

alter table public.user_achievements enable row level security;

create policy "Users can view their own achievements"
  on public.user_achievements for select
  using (auth.uid() = user_id);

create policy "Users can insert their own achievements"
  on public.user_achievements for insert
  with check (auth.uid() = user_id);


-- ── User Sessions ─────────────────────────────────────────────────────────────

create table if not exists public.user_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  session_start   timestamptz not null default now(),
  session_end     timestamptz,
  total_points    integer not null default 0
);

alter table public.user_sessions enable row level security;

create policy "Users can view their own sessions"
  on public.user_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sessions"
  on public.user_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own sessions"
  on public.user_sessions for update
  using (auth.uid() = user_id);


-- ── Learning Insights ─────────────────────────────────────────────────────────

create table if not exists public.learning_insights (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  topic_id            text not null,
  weakness_pattern    text not null default '',
  priority_level      integer not null default 1,
  suggested_exercises text[] not null default '{}',
  created_at          timestamptz not null default now()
);

alter table public.learning_insights enable row level security;

create policy "Users can view their own insights"
  on public.learning_insights for select
  using (auth.uid() = user_id);

create policy "Users can insert their own insights"
  on public.learning_insights for insert
  with check (auth.uid() = user_id);


-- ── update_learning_progress RPC ──────────────────────────────────────────────
-- Called by SupabaseUserManager.updateUserProgress().
-- Upserts the user_progress row and bulk-inserts any mistakes.

create or replace function public.update_learning_progress(
  p_user_id  uuid,
  p_topic_id text,
  p_score    integer,
  p_mistakes jsonb default '[]'::jsonb
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_mastery integer;
begin
  -- Compute mastery level from score (0-4 scale)
  v_mastery := case
    when p_score >= 90 then 4
    when p_score >= 75 then 3
    when p_score >= 55 then 2
    when p_score >= 35 then 1
    else 0
  end;

  insert into public.user_progress (user_id, topic_id, best_score, total_attempts, mastery_level, last_practiced)
  values (p_user_id, p_topic_id, p_score, 1, v_mastery, now())
  on conflict (user_id, topic_id) do update set
    best_score      = greatest(user_progress.best_score, excluded.best_score),
    total_attempts  = user_progress.total_attempts + 1,
    mastery_level   = greatest(user_progress.mastery_level, excluded.mastery_level),
    last_practiced  = now();

  -- Insert mistakes if any
  if jsonb_array_length(p_mistakes) > 0 then
    insert into public.user_mistakes (user_id, topic_id, question, user_answer, correct_answer, mistake_type)
    select
      p_user_id,
      p_topic_id,
      coalesce(m->>'question', ''),
      coalesce(m->>'userAnswer', ''),
      coalesce(m->>'correctAnswer', ''),
      coalesce(m->>'type', 'grammar')
    from jsonb_array_elements(p_mistakes) as m;
  end if;
end;
$$;

-- Grant execute to authenticated users
grant execute on function public.update_learning_progress(uuid, text, integer, jsonb) to authenticated;
