import { supabase } from './supabase';
import type {
  Application,
  ClientProfile,
  Contract,
  EscrowStatus,
  FileRecord,
  Job,
  JobWithClient,
  MessageRecord,
  Profile,
  Skill,
  StudentProfile,
} from '../types/database';

// ── Profiles ────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createProfile(profile: Pick<Profile, 'id' | 'role' | 'full_name' | 'university' | 'department'>) {
  const { error } = await supabase.from('profiles').insert(profile);
  if (error) throw error;
}

export async function upsertStudentProfile(sp: Partial<StudentProfile> & { profile_id: string }) {
  const { error } = await supabase.from('student_profiles').upsert(sp);
  if (error) throw error;
}

export async function upsertClientProfile(cp: Partial<ClientProfile> & { profile_id: string }) {
  const { error } = await supabase.from('client_profiles').upsert(cp);
  if (error) throw error;
}

// ── Skills ──────────────────────────────────────────────────────────────

export async function listSkills(): Promise<Skill[]> {
  const { data, error } = await supabase.from('skills').select('*').order('category');
  if (error) throw error;
  return data ?? [];
}

export async function setStudentSkills(studentId: string, skillIds: string[]) {
  await supabase.from('student_skills').delete().eq('student_id', studentId);
  if (skillIds.length === 0) return;
  const rows = skillIds.map((skill_id) => ({ student_id: studentId, skill_id }));
  const { error } = await supabase.from('student_skills').insert(rows);
  if (error) throw error;
}

// ── Jobs ────────────────────────────────────────────────────────────────

export async function listOpenJobs(filters?: { category?: string; search?: string }): Promise<JobWithClient[]> {
  let query = supabase
    .from('jobs')
    .select('*, client_profiles(org_name, org_type, verified)')
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.search) query = query.ilike('title', `%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as JobWithClient[]) ?? [];
}

export async function getJob(jobId: string): Promise<JobWithClient | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*, client_profiles(org_name, org_type, verified)')
    .eq('id', jobId)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as JobWithClient | null;
}

export async function createJob(job: Omit<Job, 'id' | 'created_at' | 'status'>): Promise<Job> {
  const { data, error } = await supabase.from('jobs').insert(job).select().single();
  if (error) throw error;
  return data;
}

export async function listMyJobs(clientId: string): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ── Applications ────────────────────────────────────────────────────────

export async function applyToJob(app: Pick<Application, 'job_id' | 'student_id' | 'cover_letter' | 'proposed_rate'>) {
  const { error } = await supabase.from('applications').insert(app);
  if (error) throw error;
}

export async function getMyApplicationForJob(jobId: string, studentId: string): Promise<Application | null> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('job_id', jobId)
    .eq('student_id', studentId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listApplicationsForJob(jobId: string) {
  const { data, error } = await supabase
    .from('applications')
    .select('*, student_profiles(profile_id, bio, hourly_rate, rating_avg), profiles!applications_student_id_fkey(full_name, university)')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listMyApplications(studentId: string) {
  const { data, error } = await supabase
    .from('applications')
    .select('*, jobs(title, status, client_id)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function decideApplication(applicationId: string, status: 'accepted' | 'rejected') {
  const { error } = await supabase.from('applications').update({ status }).eq('id', applicationId);
  if (error) throw error;
}

export async function withdrawApplication(applicationId: string) {
  const { error } = await supabase.from('applications').update({ status: 'withdrawn' }).eq('id', applicationId);
  if (error) throw error;
}

// ── Contracts ───────────────────────────────────────────────────────────

export async function createContract(contract: Omit<Contract, 'id' | 'created_at' | 'escrow_status' | 'milestones'>) {
  const { data, error } = await supabase.from('contracts').insert(contract).select().single();
  if (error) throw error;
  // Mark the parent job in_progress and the application accepted so the
  // marketplace listing stops taking new proposals.
  await supabase.from('jobs').update({ status: 'in_progress' }).eq('id', contract.job_id);
  return data as Contract;
}

export async function listMyContracts(profileId: string) {
  const { data, error } = await supabase
    .from('contracts')
    .select('*, jobs(title)')
    .or(`student_id.eq.${profileId},client_id.eq.${profileId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getContract(contractId: string) {
  const { data, error } = await supabase
    .from('contracts')
    .select(
      '*, jobs(title, description), student:profiles!contracts_student_id_fkey(full_name), client:profiles!contracts_client_id_fkey(full_name)'
    )
    .eq('id', contractId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateEscrowStatus(contractId: string, escrow_status: EscrowStatus) {
  const { error } = await supabase.from('contracts').update({ escrow_status }).eq('id', contractId);
  if (error) throw error;
}

// ── Files ───────────────────────────────────────────────────────────────

const FILES_BUCKET = 'contract-files';

export async function uploadContractFile(contractId: string, uploaderId: string, file: File): Promise<FileRecord> {
  const path = `${contractId}/${crypto.randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from(FILES_BUCKET).upload(path, file);
  if (uploadError) throw uploadError;

  const fileType = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
  const { data, error } = await supabase
    .from('files')
    .insert({
      contract_id: contractId,
      uploader_id: uploaderId,
      storage_provider: 'supabase',
      file_url: path, // storage object path — resolved to a signed URL on read, see getSignedFileUrl
      file_type: fileType,
      version: 1,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listContractFiles(contractId: string) {
  const { data, error } = await supabase
    .from('files')
    .select('*, profiles(full_name)')
    .eq('contract_id', contractId)
    .order('uploaded_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getSignedFileUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(FILES_BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

// ── Messages ────────────────────────────────────────────────────────────

export async function listMessages(contractId: string): Promise<MessageRecord[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(msg: Pick<MessageRecord, 'contract_id' | 'sender_id' | 'content'>) {
  const { error } = await supabase.from('messages').insert(msg);
  if (error) throw error;
}

export function subscribeToMessages(contractId: string, onInsert: (msg: MessageRecord) => void) {
  const channel = supabase
    .channel(`messages:${contractId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `contract_id=eq.${contractId}` },
      (payload) => onInsert(payload.new as MessageRecord)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
