/**
 * KAZAJOB — Schéma Drizzle (Neon PostgreSQL)
 * Source de vérité de la base après migration depuis Supabase.
 *
 * Notes migration :
 * - `profiles` est désormais la table utilisateur (Auth.js) : id auto-généré,
 *   ajout de `password_hash`. Plus de référence à auth.users (Supabase).
 * - Pas de RLS : l'autorisation est gérée côté application (Auth.js + checks).
 * - Le temps réel (messagerie/notifs) passe par polling (pas de publication).
 */
import { relations, sql } from 'drizzle-orm'
import {
  pgTable, uuid, text, boolean, integer, timestamp, jsonb, date, primaryKey, unique,
} from 'drizzle-orm/pg-core'

const now = () => timestamp({ withTimezone: true }).notNull().defaultNow()
const emptyArr = sql`'{}'`

// ── profiles (= utilisateur) ──────────────────────────────────────
export const profiles = pgTable('profiles', {
  id:            uuid().primaryKey().default(sql`gen_random_uuid()`),
  email:         text().notNull().unique(),
  passwordHash:  text('password_hash'),
  fullName:      text('full_name').notNull().default(''),
  role:          text().notNull().default('candidate'),
  avatarUrl:     text('avatar_url'),
  location:      text(),
  bio:           text(),
  phone:         text(),
  cvUrl:         text('cv_url'),
  xp:            integer().notNull().default(0),
  streak:        integer().notNull().default(0),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  avatarCategory:   text('avatar_category'),
  avatarCategories: text('avatar_categories').array(),
  cvTemplate:    text('cv_template').default('modern'),
  cvColor:       text('cv_color').default('#FF6B35'),
  cvData:        jsonb('cv_data'),
  emailAlertsEnabled:  boolean('email_alerts_enabled').notNull().default(true),
  emailAlertFrequency: text('email_alert_frequency').notNull().default('daily'),
  videoPitchUrl: text('video_pitch_url'),
  boostedUntil:  timestamp('boosted_until', { withTimezone: true }),
  referralCode:  text('referral_code').unique(),
  companyId:     uuid('company_id'),
  gamificationEnabled: boolean('gamification_enabled').notNull().default(true),
  avatarConfig:  jsonb('avatar_config'),
  softSkills:    text('soft_skills').array().default(emptyArr),
  hobbies:       text('hobbies').array().default(emptyArr),
  characterDomain: text('character_domain'),
  gender:        text(),
  createdAt:     now(),
  updatedAt:     now(),
})

// ── companies ─────────────────────────────────────────────────────
export const companies = pgTable('companies', {
  id:          uuid().primaryKey().default(sql`gen_random_uuid()`),
  ownerId:     uuid('owner_id').references(() => profiles.id, { onDelete: 'cascade' }),
  name:        text().notNull(),
  legalName:   text('legal_name'),
  siret:       text(),
  logoUrl:     text('logo_url'),
  website:     text(),
  description: text(),
  location:    text(),
  city:        text(),
  zipCode:     text('zip_code'),
  address:     text(),
  phone:       text(),
  sector:      text(),
  size:        text(),
  foundedYear: integer('founded_year'),
  linkedinUrl: text('linkedin_url'),
  isVerified:  boolean('is_verified').notNull().default(false),
  isSetupComplete: boolean('is_setup_complete').notNull().default(false),
  createdAt:   now(),
})

// ── skills ────────────────────────────────────────────────────────
export const skills = pgTable('skills', {
  id:       uuid().primaryKey().default(sql`gen_random_uuid()`),
  name:     text().notNull().unique(),
  category: text(),
})

// ── jobs ──────────────────────────────────────────────────────────
export const jobs = pgTable('jobs', {
  id:           uuid().primaryKey().default(sql`gen_random_uuid()`),
  companyId:    uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),
  recruiterId:  uuid('recruiter_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  title:        text().notNull(),
  description:  text().notNull(),
  requirements: text(),
  location:     text().notNull(),
  remote:       boolean().notNull().default(false),
  jobType:      text('job_type').notNull().default('CDI'),
  sector:       text(),
  salaryMin:    integer('salary_min'),
  salaryMax:    integer('salary_max'),
  salaryCurrency: text('salary_currency').notNull().default('€'),
  isActive:     boolean('is_active').notNull().default(true),
  isBoosted:    boolean('is_boosted').notNull().default(false),
  boostExpiresAt: timestamp('boost_expires_at', { withTimezone: true }),
  isAnonymous:  boolean('is_anonymous').notNull().default(false),
  publishedBy:  uuid('published_by').references(() => profiles.id),
  benefits:     text(),
  perks:        text().array(),
  languages:    text().array(),
  requiredLevel: text('required_level'),
  startDate:    text('start_date'),
  views:        integer().notNull().default(0),
  applicationsCount: integer('applications_count').notNull().default(0),
  createdAt:    now(),
  updatedAt:    now(),
})

// ── job_skills (jonction) ─────────────────────────────────────────
export const jobSkills = pgTable('job_skills', {
  jobId:      uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  skillId:    uuid('skill_id').notNull().references(() => skills.id, { onDelete: 'cascade' }),
  isRequired: boolean('is_required').notNull().default(true),
}, (t) => [primaryKey({ columns: [t.jobId, t.skillId] })])

// ── candidate_skills (jonction) ───────────────────────────────────
export const candidateSkills = pgTable('candidate_skills', {
  candidateId: uuid('candidate_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  skillId:     uuid('skill_id').notNull().references(() => skills.id, { onDelete: 'cascade' }),
  level:       text().notNull().default('intermediate'),
}, (t) => [primaryKey({ columns: [t.candidateId, t.skillId] })])

// ── applications ──────────────────────────────────────────────────
export const applications = pgTable('applications', {
  id:           uuid().primaryKey().default(sql`gen_random_uuid()`),
  jobId:        uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  candidateId:  uuid('candidate_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  coverLetter:  text('cover_letter'),
  status:       text().notNull().default('pending'),
  recruiterNotes: text('recruiter_notes'),
  createdAt:    now(),
  updatedAt:    now(),
}, (t) => [unique().on(t.jobId, t.candidateId)])

// ── favorites ─────────────────────────────────────────────────────
export const favorites = pgTable('favorites', {
  id:          uuid().primaryKey().default(sql`gen_random_uuid()`),
  candidateId: uuid('candidate_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  jobId:       uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  createdAt:   now(),
}, (t) => [unique().on(t.candidateId, t.jobId)])

// ── conversations ─────────────────────────────────────────────────
export const conversations = pgTable('conversations', {
  id:           uuid().primaryKey().default(sql`gen_random_uuid()`),
  candidateId:  uuid('candidate_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  recruiterId:  uuid('recruiter_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  jobId:        uuid('job_id').references(() => jobs.id, { onDelete: 'set null' }),
  lastMessageAt: now(),
  createdAt:    now(),
})

// ── messages ──────────────────────────────────────────────────────
export const messages = pgTable('messages', {
  id:             uuid().primaryKey().default(sql`gen_random_uuid()`),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId:       uuid('sender_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  content:        text().notNull(),
  isRead:         boolean('is_read').notNull().default(false),
  createdAt:      now(),
})

// ── interviews ────────────────────────────────────────────────────
export const interviews = pgTable('interviews', {
  id:            uuid().primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  recruiterId:   uuid('recruiter_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  candidateId:   uuid('candidate_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  jobId:         uuid('job_id').references(() => jobs.id, { onDelete: 'set null' }),
  scheduledAt:   timestamp('scheduled_at', { withTimezone: true }).notNull(),
  durationMin:   integer('duration_min').notNull().default(45),
  type:          text().notNull().default('video'),
  visioType:     text('visio_type').default('jitsi'),
  visioLink:     text('visio_link'),
  location:      text(),
  notes:         text(),
  status:        text().notNull().default('pending'),
  reminderSent:  boolean('reminder_sent').notNull().default(false),
  createdAt:     now(),
  updatedAt:     now(),
})

// ── notifications ─────────────────────────────────────────────────
export const notifications = pgTable('notifications', {
  id:        uuid().primaryKey().default(sql`gen_random_uuid()`),
  userId:    uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  type:      text().notNull(),
  title:     text().notNull(),
  message:   text().notNull(),
  link:      text(),
  data:      jsonb(),
  isRead:    boolean('is_read').notNull().default(false),
  createdAt: now(),
})

// ── referrals ─────────────────────────────────────────────────────
export const referrals = pgTable('referrals', {
  id:         uuid().primaryKey().default(sql`gen_random_uuid()`),
  referrerId: uuid('referrer_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  referredId: uuid('referred_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  rewarded:   boolean().notNull().default(false),
  createdAt:  now(),
}, (t) => [unique().on(t.referredId)])

// ── events ────────────────────────────────────────────────────────
export const events = pgTable('events', {
  id:              uuid().primaryKey().default(sql`gen_random_uuid()`),
  organizerId:     uuid('organizer_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  title:           text().notNull(),
  description:     text(),
  type:            text().notNull(),
  date:            timestamp({ withTimezone: true }).notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(60),
  maxParticipants: integer('max_participants').notNull().default(50),
  location:        text().notNull().default('En ligne'),
  jitsiRoom:       text('jitsi_room'),
  isPublished:     boolean('is_published').notNull().default(true),
  createdAt:       now(),
})

// ── event_registrations ───────────────────────────────────────────
export const eventRegistrations = pgTable('event_registrations', {
  id:          uuid().primaryKey().default(sql`gen_random_uuid()`),
  eventId:     uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  candidateId: uuid('candidate_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt:   now(),
}, (t) => [unique().on(t.eventId, t.candidateId)])

// ── company_members ───────────────────────────────────────────────
export const companyMembers = pgTable('company_members', {
  id:          uuid().primaryKey().default(sql`gen_random_uuid()`),
  companyId:   uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  recruiterId: uuid('recruiter_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  role:        text().notNull().default('member'),
  status:      text().notNull().default('active'),
  invitedBy:   uuid('invited_by').references(() => profiles.id),
  createdAt:   now(),
}, (t) => [unique().on(t.companyId, t.recruiterId)])

// ── company_join_requests ─────────────────────────────────────────
export const companyJoinRequests = pgTable('company_join_requests', {
  id:          uuid().primaryKey().default(sql`gen_random_uuid()`),
  companyId:   uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  recruiterId: uuid('recruiter_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  message:     text(),
  status:      text().notNull().default('pending'),
  reviewedBy:  uuid('reviewed_by').references(() => profiles.id),
  createdAt:   now(),
}, (t) => [unique().on(t.companyId, t.recruiterId)])

// ── subscription_plans ────────────────────────────────────────────
export const subscriptionPlans = pgTable('subscription_plans', {
  id:         text().primaryKey(),
  name:       text().notNull(),
  priceCts:   integer('price_cts').notNull(),
  maxMembers: integer('max_members').notNull(),
  maxJobs:    integer('max_jobs').notNull(),
  partners:   text().array().notNull().default(emptyArr),
  apiAccess:  boolean('api_access').notNull().default(false),
  trialDays:  integer('trial_days').notNull().default(14),
  highlight:  boolean().notNull().default(false),
  isActive:   boolean('is_active').notNull().default(true),
})

// ── company_subscriptions ─────────────────────────────────────────
export const companySubscriptions = pgTable('company_subscriptions', {
  id:               uuid().primaryKey().default(sql`gen_random_uuid()`),
  companyId:        uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  planId:           text('plan_id').notNull().references(() => subscriptionPlans.id),
  status:           text().notNull().default('trial'),
  trialEndsAt:      timestamp('trial_ends_at', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  seatsUsed:        integer('seats_used').notNull().default(1),
  createdAt:        now(),
}, (t) => [unique().on(t.companyId)])

// ── training_offers ───────────────────────────────────────────────
export const trainingOffers = pgTable('training_offers', {
  id:                 uuid().primaryKey().default(sql`gen_random_uuid()`),
  recruiterId:        uuid('recruiter_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  companyId:          uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),
  title:              text().notNull(),
  description:        text().notNull(),
  program:            text(),
  prerequisites:      text(),
  certification:      text(),
  certificationLevel: text('certification_level'),
  durationValue:      integer('duration_value').notNull().default(1),
  durationUnit:       text('duration_unit').notNull().default('heures'),
  location:           text().notNull(),
  remote:             boolean().notNull().default(false),
  sector:             text(),
  startDate:          date('start_date'),
  maxParticipants:    integer('max_participants').notNull().default(20),
  isFinanced:         boolean('is_financed').notNull().default(false),
  financingOptions:   text('financing_options').array().notNull().default(emptyArr),
  imageUrl:           text('image_url'),
  infoSessionId:      uuid('info_session_id').references(() => events.id, { onDelete: 'set null' }),
  views:              integer().notNull().default(0),
  applicationsCount:  integer('applications_count').notNull().default(0),
  isActive:           boolean('is_active').notNull().default(true),
  createdAt:          now(),
  updatedAt:          now(),
})

// ── training_applications ─────────────────────────────────────────
export const trainingApplications = pgTable('training_applications', {
  id:              uuid().primaryKey().default(sql`gen_random_uuid()`),
  trainingOfferId: uuid('training_offer_id').notNull().references(() => trainingOffers.id, { onDelete: 'cascade' }),
  candidateId:     uuid('candidate_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  motivation:      text(),
  status:          text().notNull().default('pending'),
  createdAt:       now(),
  updatedAt:       now(),
}, (t) => [unique().on(t.trainingOfferId, t.candidateId)])

// ── Relations (Drizzle relational queries) ────────────────────────
// Ajoutées de façon incrémentale, lot par lot (phase 3).
export const jobsRelations = relations(jobs, ({ one, many }) => ({
  company:   one(companies, { fields: [jobs.companyId], references: [companies.id] }),
  publisher: one(profiles,  { fields: [jobs.publishedBy], references: [profiles.id] }),
  jobSkills: many(jobSkills),
}))

export const jobSkillsRelations = relations(jobSkills, ({ one }) => ({
  job:   one(jobs,   { fields: [jobSkills.jobId],   references: [jobs.id] }),
  skill: one(skills, { fields: [jobSkills.skillId], references: [skills.id] }),
}))

export const applicationsRelations = relations(applications, ({ one }) => ({
  job:       one(jobs,     { fields: [applications.jobId],       references: [jobs.id] }),
  candidate: one(profiles, { fields: [applications.candidateId], references: [profiles.id] }),
}))

export const favoritesRelations = relations(favorites, ({ one }) => ({
  job: one(jobs, { fields: [favorites.jobId], references: [jobs.id] }),
}))

export const candidateSkillsRelations = relations(candidateSkills, ({ one }) => ({
  skill: one(skills, { fields: [candidateSkills.skillId], references: [skills.id] }),
}))

export const conversationsRelations = relations(conversations, ({ one }) => ({
  candidate: one(profiles, { fields: [conversations.candidateId], references: [profiles.id], relationName: 'conv_candidate' }),
  recruiter: one(profiles, { fields: [conversations.recruiterId], references: [profiles.id], relationName: 'conv_recruiter' }),
  job:       one(jobs,     { fields: [conversations.jobId],       references: [jobs.id] }),
}))

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(profiles, { fields: [messages.senderId], references: [profiles.id] }),
}))

export const companyMembersRelations = relations(companyMembers, ({ one }) => ({
  profile: one(profiles, { fields: [companyMembers.recruiterId], references: [profiles.id] }),
}))

export const companyJoinRequestsRelations = relations(companyJoinRequests, ({ one }) => ({
  profile: one(profiles, { fields: [companyJoinRequests.recruiterId], references: [profiles.id] }),
  company: one(companies, { fields: [companyJoinRequests.companyId], references: [companies.id] }),
}))

export const companySubscriptionsRelations = relations(companySubscriptions, ({ one }) => ({
  company: one(companies, { fields: [companySubscriptions.companyId], references: [companies.id] }),
}))

export const eventsRelations = relations(events, ({ one }) => ({
  organizer: one(profiles, { fields: [events.organizerId], references: [profiles.id] }),
}))

export const trainingOffersRelations = relations(trainingOffers, ({ one }) => ({
  company:      one(companies, { fields: [trainingOffers.companyId], references: [companies.id] }),
  info_session: one(events,    { fields: [trainingOffers.infoSessionId], references: [events.id] }),
}))

export const interviewsRelations = relations(interviews, ({ one }) => ({
  candidate: one(profiles, { fields: [interviews.candidateId], references: [profiles.id], relationName: 'itw_candidate' }),
  recruiter: one(profiles, { fields: [interviews.recruiterId], references: [profiles.id], relationName: 'itw_recruiter' }),
  job:       one(jobs,     { fields: [interviews.jobId],       references: [jobs.id] }),
}))
