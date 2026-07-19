-- NIPUN MVP — Storage bucket + policies for contract deliverables
--
-- Path convention: every object lives at  <contract_id>/<uuid>-<filename>
-- so folder-name policies can check contract membership without a join
-- back through the `files` table.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'contract-files',
  'contract-files',
  false, -- private bucket; access goes through signed URLs, not public links
  52428800, -- 50MB per file — generous for a STEP export, mindful of the 1GB free-tier cap
  null -- allow any type; CAD export extensions (.step/.stp/.iges/.igs) aren't real MIME types anyway
)
on conflict (id) do nothing;

create policy "contract_files_select_parties"
on storage.objects for select
using (
  bucket_id = 'contract-files'
  and exists (
    select 1 from contracts
    where contracts.id::text = (storage.foldername(name))[1]
    and (contracts.student_id = auth.uid() or contracts.client_id = auth.uid())
  )
);

create policy "contract_files_insert_parties"
on storage.objects for insert
with check (
  bucket_id = 'contract-files'
  and exists (
    select 1 from contracts
    where contracts.id::text = (storage.foldername(name))[1]
    and (contracts.student_id = auth.uid() or contracts.client_id = auth.uid())
  )
);

create policy "contract_files_delete_own"
on storage.objects for delete
using (
  bucket_id = 'contract-files'
  and owner = auth.uid()
);
