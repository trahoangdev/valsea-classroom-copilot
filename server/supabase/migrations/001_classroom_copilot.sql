-- Run in Supabase SQL Editor (AGENTS.md §14)
-- class_sessions.id doubles as client session UUID (crypto.randomUUID)

create table if not exists class_sessions (
  id uuid primary key,
  title text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists transcript_chunks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references class_sessions(id) on delete cascade,
  chunk_index integer not null,
  start_time numeric,
  end_time numeric,
  text text not null,
  is_final boolean not null default true,
  created_at timestamptz not null default now(),
  unique (session_id, chunk_index)
);

create index if not exists idx_transcript_chunks_session on transcript_chunks(session_id);

create table if not exists learning_outputs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references class_sessions(id) on delete cascade,
  chunk_id uuid references transcript_chunks(id) on delete set null,
  short_summary_vi text,
  key_terms_json jsonb not null default '[]',
  simple_explanation_vi text,
  quiz_json jsonb not null default '[]',
  confusing_points_json jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists idx_learning_outputs_session on learning_outputs(session_id);

create table if not exists confusion_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references class_sessions(id) on delete cascade,
  timestamp numeric,
  source text not null,
  label text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_confusion_events_session on confusion_events(session_id);
