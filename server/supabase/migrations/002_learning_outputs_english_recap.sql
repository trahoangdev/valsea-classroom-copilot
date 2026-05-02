-- Optional: run after 001 if you use Supabase persistence for learning outputs.
alter table learning_outputs
  add column if not exists english_recap_en text;
