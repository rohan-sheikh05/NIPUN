// Hand-written types matching supabase/migrations/0001_init_schema.sql.
// Once the project is live, swap these for generated types:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.ts

export type UserRole = 'student' | 'client' | 'admin';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type OrgType = 'government' | 'ngo' | 'private' | 'startup' | 'individual';
export type JobStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type EscrowStatus = 'pending' | 'funded' | 'released' | 'disputed';
export type StorageProvider = 'supabase' | 'r2';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  avatar_url: string | null;
  university: string | null;
  department: string | null;
  verification_status: VerificationStatus;
  created_at: string;
}

export interface StudentProfile {
  profile_id: string;
  bio: string | null;
  hourly_rate: number | null;
  rating_avg: number;
  rating_count: number;
  portfolio_links: { label: string; url: string }[];
}

export interface ClientProfile {
  profile_id: string;
  org_name: string;
  org_type: OrgType;
  verified: boolean;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
}

export interface StudentSkill {
  student_id: string;
  skill_id: string;
  proficiency: number;
}

export interface Job {
  id: string;
  client_id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  status: JobStatus;
  required_skills: string[];
  created_at: string;
}

export interface JobWithClient extends Job {
  client_profiles: Pick<ClientProfile, 'org_name' | 'org_type' | 'verified'>;
}

export interface Application {
  id: string;
  job_id: string;
  student_id: string;
  cover_letter: string | null;
  proposed_rate: number | null;
  status: ApplicationStatus;
  created_at: string;
}

export interface Contract {
  id: string;
  job_id: string;
  application_id: string;
  student_id: string;
  client_id: string;
  agreed_amount: number;
  escrow_status: EscrowStatus;
  milestones: { label: string; done: boolean }[];
  created_at: string;
}

export interface FileRecord {
  id: string;
  contract_id: string;
  uploader_id: string;
  storage_provider: StorageProvider;
  file_url: string;
  preview_glb_url: string | null;
  file_type: string;
  version: number;
  uploaded_at: string;
}

export interface Review {
  id: string;
  contract_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface MessageRecord {
  id: string;
  contract_id: string;
  sender_id: string;
  content: string | null;
  attachment_url: string | null;
  created_at: string;
}

export interface PeerSession {
  id: string;
  mentor_id: string;
  skill_id: string | null;
  title: string;
  description: string | null;
  price: number;
  scheduled_at: string;
  capacity: number;
  created_at: string;
}
