export type UserRole = 'candidate' | 'recruiter' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url: string | null
  location: string | null
  bio: string | null
  phone: string | null
  cv_url: string | null
  xp: number
  streak: number
  onboarding_completed: boolean
  avatar_category: string | null
  avatar_categories: string[] | null
  cv_template: string | null
  cv_color: string | null
  cv_data: Record<string, unknown> | null
  email_alerts_enabled: boolean
  email_alert_frequency: string | null
  video_pitch_url: string | null
  boosted_until: string | null
  referral_code: string | null
  company_id: string | null
  gamification_enabled: boolean
  avatar_config: Record<string, string> | null
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  owner_id: string
  name: string
  legal_name: string | null
  siret: string | null
  logo_url: string | null
  website: string | null
  description: string | null
  location: string | null
  city: string | null
  zip_code: string | null
  address: string | null
  phone: string | null
  sector: string | null
  size: string | null
  founded_year: number | null
  linkedin_url: string | null
  is_verified: boolean
  is_setup_complete: boolean
  created_at: string
}

export type CompanyMemberRole   = 'owner' | 'admin' | 'member'
export type CompanyMemberStatus = 'pending' | 'active' | 'suspended'

export interface CompanyMember {
  id: string
  company_id: string
  recruiter_id: string
  role: CompanyMemberRole
  status: CompanyMemberStatus
  invited_by: string | null
  created_at: string
  profile?: Pick<Profile, 'full_name' | 'email' | 'avatar_url'>
}

export interface CompanyJoinRequest {
  id: string
  company_id: string
  recruiter_id: string
  message: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  profile?: Pick<Profile, 'full_name' | 'email'>
}

export interface CompanySubscription {
  id: string
  company_id: string
  plan_id: string
  status: 'trial' | 'active' | 'cancelled' | 'expired'
  trial_ends_at: string | null
  current_period_end: string | null
  seats_used: number
  created_at: string
}

export interface Job {
  id: string
  company_id: string
  recruiter_id: string
  title: string
  description: string
  requirements: string | null
  location: string
  remote: boolean
  job_type: string
  sector: string | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  is_active: boolean
  is_boosted: boolean
  boost_expires_at: string | null
  views: number
  applications_count: number
  created_at: string
  updated_at: string
  company?: Company
  skills?: Skill[]
  match_score?: number
}

export interface Application {
  id: string
  job_id: string
  candidate_id: string
  cover_letter: string | null
  status: 'pending' | 'viewed' | 'interview' | 'offer' | 'hired' | 'rejected'
  recruiter_notes: string | null
  created_at: string
  updated_at: string
  job?: Job
  candidate?: Profile
}

export interface Favorite {
  id: string
  candidate_id: string
  job_id: string
  created_at: string
  job?: Job
}

export interface Skill {
  id: string
  name: string
  category: string | null
}

export interface CandidateSkill {
  candidate_id: string
  skill_id: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  skill?: Skill
}

export interface JobSkill {
  job_id: string
  skill_id: string
  is_required: boolean
  skill?: Skill
}

export interface Conversation {
  id: string
  candidate_id: string
  recruiter_id: string
  job_id: string | null
  last_message_at: string
  created_at: string
  candidate?: Profile
  recruiter?: Profile
  job?: Job
  last_message?: Message
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  sender?: Profile
}

export interface JobFilters {
  q?: string
  location?: string
  job_type?: string
  sector?: string
  remote?: boolean
  salary_min?: number
  salary_max?: number
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  count: number
  page: number
  limit: number
  total_pages: number
}

export type BadgeColor = 'orange' | 'violet' | 'blue' | 'green' | 'yellow' | 'ink' | 'cream' | 'paper'
export type ButtonKind = 'primary' | 'dark' | 'violet' | 'yellow' | 'outline' | 'ghost' | 'soft' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'
