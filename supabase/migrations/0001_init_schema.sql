-- NIPUN MVP — initial schema
-- Run via: supabase db push  (or paste into the SQL editor in your Supabase project)

create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────────────────
create type user_role as enum ('student', 'client', 'admin');
create type verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
create type org_type as enum ('government', 'ngo', 'private', 'startup', 'individual');
create type job_status as enum ('open', 'in_progress', 'completed', 'cancelled');
create type application_status as enum ('pending', 'accepted', 'rejected', 'withdrawn');
create type escrow_status as enum ('pending', 'funded', 'released', 'disputed');
create type storage_provider as enum ('supabase', 'r2');
create type payment_status as enum ('unpaid', 'paid', 'refunded');

-- ─────────────────────────────────────────────────────────────────────────
-- Profiles (1:1 with auth.users)
-- ─────────────────────────────────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  full_name text not null,
  avatar_url text,
  university text,
  department text,
  verification_status verification_status not null default 'unverified',
  created_at timestamptz not null default now()
);

create table student_profiles (
  profile_id uuid primary key references profiles(id) on delete cascade,
  bio text,
  hourly_rate numeric(10, 2),
  rating_avg numeric(3, 2) default 0,
  rating_count integer default 0,
  portfolio_links jsonb default '[]'::jsonb
);

create table client_profiles (
  profile_id uuid primary key references profiles(id) on delete cascade,
  org_name text not null,
  org_type org_type not null default 'individual',
  verified boolean not null default false
);

-- ─────────────────────────────────────────────────────────────────────────
-- Skills
-- ─────────────────────────────────────────────────────────────────────────
create table skills (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  category text not null
);

create table student_skills (
  student_id uuid references student_profiles(profile_id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  proficiency smallint check (proficiency between 1 and 5) default 3,
  primary key (student_id, skill_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- Jobs & Applications
-- ─────────────────────────────────────────────────────────────────────────
create table jobs (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references client_profiles(profile_id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  budget_min numeric(10, 2),
  budget_max numeric(10, 2),
  deadline date,
  status job_status not null default 'open',
  required_skills uuid[] default '{}',
  created_at timestamptz not null default now()
);

create table applications (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid not null references jobs(id) on delete cascade,
  student_id uuid not null references student_profiles(profile_id) on delete cascade,
  cover_letter text,
  proposed_rate numeric(10, 2),
  status application_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (job_id, student_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- Contracts (created once an application is accepted)
-- ─────────────────────────────────────────────────────────────────────────
create table contracts (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid not null references jobs(id) on delete cascade,
  application_id uuid not null references applications(id) on delete cascade,
  student_id uuid not null references student_profiles(profile_id) on delete cascade,
  client_id uuid not null references client_profiles(profile_id) on delete cascade,
  agreed_amount numeric(10, 2) not null,
  escrow_status escrow_status not null default 'pending',
  milestones jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- Files (CAD deliverables + attachments)
-- ─────────────────────────────────────────────────────────────────────────
create table files (
  id uuid primary key default uuid_generate_v4(),
  contract_id uuid not null references contracts(id) on delete cascade,
  uploader_id uuid not null references profiles(id) on delete cascade,
  storage_provider storage_provider not null default 'supabase',
  file_url text not null,
  preview_glb_url text,
  file_type text not null,
  version integer not null default 1,
  uploaded_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- Reviews & Messages
-- ─────────────────────────────────────────────────────────────────────────
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  contract_id uuid not null references contracts(id) on delete cascade,
  reviewer_id uuid not null references profiles(id) on delete cascade,
  reviewee_id uuid not null references profiles(id) on delete cascade,
  rating smallint check (rating between 1 and 5) not null,
  comment text,
  created_at timestamptz not null default now(),
  unique (contract_id, reviewer_id)
);

create table messages (
  id uuid primary key default uuid_generate_v4(),
  contract_id uuid not null references contracts(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  content text,
  attachment_url text,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- Peer learning
-- ─────────────────────────────────────────────────────────────────────────
create table peer_sessions (
  id uuid primary key default uuid_generate_v4(),
  mentor_id uuid not null references student_profiles(profile_id) on delete cascade,
  skill_id uuid references skills(id),
  title text not null,
  description text,
  price numeric(10, 2) not null default 0,
  scheduled_at timestamptz not null,
  capacity integer not null default 1,
  created_at timestamptz not null default now()
);

create table session_enrollments (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references peer_sessions(id) on delete cascade,
  learner_id uuid not null references profiles(id) on delete cascade,
  payment_status payment_status not null default 'unpaid',
  created_at timestamptz not null default now(),
  unique (session_id, learner_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- Indexes for the query patterns the app actually uses
-- ─────────────────────────────────────────────────────────────────────────
create index idx_jobs_status on jobs(status);
create index idx_jobs_category on jobs(category);
create index idx_applications_job on applications(job_id);
create index idx_applications_student on applications(student_id);
create index idx_contracts_student on contracts(student_id);
create index idx_contracts_client on contracts(client_id);
create index idx_files_contract on files(contract_id);
create index idx_messages_contract on messages(contract_id);
create index idx_student_skills_skill on student_skills(skill_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Required for PostgREST auto-API access (Supabase policy change, mid-2026):
-- new projects need explicit grants on top of RLS policies.
-- ─────────────────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
