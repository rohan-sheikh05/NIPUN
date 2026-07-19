-- NIPUN MVP — Row Level Security
-- Every table PostgREST exposes needs policies, or it's either wide open
-- (if grants exist with no RLS) or fully locked (RLS on, no policy = deny all).

alter table profiles enable row level security;
alter table student_profiles enable row level security;
alter table client_profiles enable row level security;
alter table skills enable row level security;
alter table student_skills enable row level security;
alter table jobs enable row level security;
alter table applications enable row level security;
alter table contracts enable row level security;
alter table files enable row level security;
alter table reviews enable row level security;
alter table messages enable row level security;
alter table peer_sessions enable row level security;
alter table session_enrollments enable row level security;

-- Helper: is the current user an admin? (SECURITY DEFINER avoids RLS
-- recursion when this is called from inside another table's policy)
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- profiles — public read (it's a marketplace; people need to see who
-- they're transacting with), owner-only write
-- ─────────────────────────────────────────────────────────────────────────
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id or is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- student_profiles / client_profiles — public read, owner-only write
-- ─────────────────────────────────────────────────────────────────────────
create policy "student_profiles_select_all" on student_profiles for select using (true);
create policy "student_profiles_insert_own" on student_profiles for insert with check (auth.uid() = profile_id);
create policy "student_profiles_update_own" on student_profiles for update using (auth.uid() = profile_id or is_admin());

create policy "client_profiles_select_all" on client_profiles for select using (true);
create policy "client_profiles_insert_own" on client_profiles for insert with check (auth.uid() = profile_id);
create policy "client_profiles_update_own" on client_profiles for update using (auth.uid() = profile_id or is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- skills — public read; only admins curate the taxonomy
-- ─────────────────────────────────────────────────────────────────────────
create policy "skills_select_all" on skills for select using (true);
create policy "skills_write_admin" on skills for insert with check (is_admin());
create policy "skills_update_admin" on skills for update using (is_admin());

create policy "student_skills_select_all" on student_skills for select using (true);
create policy "student_skills_write_own" on student_skills for insert with check (auth.uid() = student_id);
create policy "student_skills_delete_own" on student_skills for delete using (auth.uid() = student_id);

-- ─────────────────────────────────────────────────────────────────────────
-- jobs — open jobs are publicly browsable; a client sees/manages own jobs
-- (any status); admin sees all
-- ─────────────────────────────────────────────────────────────────────────
create policy "jobs_select_open_or_own" on jobs for select
  using (status = 'open' or client_id = auth.uid() or is_admin());

create policy "jobs_insert_own_as_client" on jobs for insert
  with check (
    client_id = auth.uid()
    and exists (select 1 from profiles where id = auth.uid() and role = 'client')
  );

create policy "jobs_update_own" on jobs for update
  using (client_id = auth.uid() or is_admin());

create policy "jobs_delete_own" on jobs for delete
  using (client_id = auth.uid() or is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- applications — visible to the applying student and the job's client
-- ─────────────────────────────────────────────────────────────────────────
create policy "applications_select_parties" on applications for select
  using (
    student_id = auth.uid()
    or is_admin()
    or exists (select 1 from jobs where jobs.id = applications.job_id and jobs.client_id = auth.uid())
  );

create policy "applications_insert_own_as_student" on applications for insert
  with check (
    student_id = auth.uid()
    and exists (select 1 from jobs where jobs.id = job_id and jobs.status = 'open')
  );

-- student can withdraw their own application; client (job owner) can accept/reject
create policy "applications_update_student_withdraw" on applications for update
  using (student_id = auth.uid())
  with check (student_id = auth.uid() and status = 'withdrawn');

create policy "applications_update_client_decision" on applications for update
  using (exists (select 1 from jobs where jobs.id = applications.job_id and jobs.client_id = auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────
-- contracts — visible/writable only to the two parties on it
-- Note: for the MVP both parties can update escrow_status directly. Before
-- any real money moves, replace the "either party updates" rule with an
-- Edge Function that enforces the funded → released transition server-side.
-- ─────────────────────────────────────────────────────────────────────────
create policy "contracts_select_parties" on contracts for select
  using (student_id = auth.uid() or client_id = auth.uid() or is_admin());

create policy "contracts_insert_by_client" on contracts for insert
  with check (client_id = auth.uid());

create policy "contracts_update_parties" on contracts for update
  using (student_id = auth.uid() or client_id = auth.uid() or is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- files — visible/writable only to the two parties on the parent contract
-- ─────────────────────────────────────────────────────────────────────────
create policy "files_select_parties" on files for select
  using (
    is_admin()
    or exists (
      select 1 from contracts
      where contracts.id = files.contract_id
      and (contracts.student_id = auth.uid() or contracts.client_id = auth.uid())
    )
  );

create policy "files_insert_parties" on files for insert
  with check (
    uploader_id = auth.uid()
    and exists (
      select 1 from contracts
      where contracts.id = contract_id
      and (contracts.student_id = auth.uid() or contracts.client_id = auth.uid())
    )
  );

create policy "files_delete_own" on files for delete
  using (uploader_id = auth.uid() or is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- reviews — public read (reputation should be visible), a contract party
-- can review the other party once
-- ─────────────────────────────────────────────────────────────────────────
create policy "reviews_select_all" on reviews for select using (true);

create policy "reviews_insert_contract_party" on reviews for insert
  with check (
    reviewer_id = auth.uid()
    and exists (
      select 1 from contracts
      where contracts.id = contract_id
      and (
        (contracts.student_id = auth.uid() and contracts.client_id = reviewee_id)
        or (contracts.client_id = auth.uid() and contracts.student_id = reviewee_id)
      )
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- messages — visible/writable only to the two parties on the contract
-- ─────────────────────────────────────────────────────────────────────────
create policy "messages_select_parties" on messages for select
  using (
    is_admin()
    or exists (
      select 1 from contracts
      where contracts.id = messages.contract_id
      and (contracts.student_id = auth.uid() or contracts.client_id = auth.uid())
    )
  );

create policy "messages_insert_parties" on messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from contracts
      where contracts.id = contract_id
      and (contracts.student_id = auth.uid() or contracts.client_id = auth.uid())
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- peer_sessions — public read (browsable), mentor-only write
-- ─────────────────────────────────────────────────────────────────────────
create policy "peer_sessions_select_all" on peer_sessions for select using (true);

create policy "peer_sessions_write_own" on peer_sessions for insert
  with check (mentor_id = auth.uid());

create policy "peer_sessions_update_own" on peer_sessions for update
  using (mentor_id = auth.uid() or is_admin());

create policy "peer_sessions_delete_own" on peer_sessions for delete
  using (mentor_id = auth.uid() or is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- session_enrollments — visible to the learner and the session's mentor
-- ─────────────────────────────────────────────────────────────────────────
create policy "enrollments_select_parties" on session_enrollments for select
  using (
    learner_id = auth.uid()
    or is_admin()
    or exists (select 1 from peer_sessions where peer_sessions.id = session_id and peer_sessions.mentor_id = auth.uid())
  );

create policy "enrollments_insert_own" on session_enrollments for insert
  with check (learner_id = auth.uid());
