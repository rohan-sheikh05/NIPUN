-- Realtime is opt-in per table in Supabase — without this, postgres_changes
-- subscriptions on `messages` silently receive nothing.
alter publication supabase_realtime add table messages;
