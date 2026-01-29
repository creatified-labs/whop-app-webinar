/**
 * Database Types
 * These types mirror the Supabase database schema
 */

// ============================================
// Enums
// ============================================

export type WebinarStatus = 'draft' | 'scheduled' | 'live' | 'ended' | 'cancelled';

export type VideoType = 'youtube' | 'vimeo' | 'hls' | 'custom';

export type CompanyRole = 'owner' | 'admin' | 'member';

export type QAQuestionStatus = 'pending' | 'answered' | 'dismissed';

export type PollStatus = 'draft' | 'active' | 'closed';

export type DiscountType = 'percentage' | 'fixed';

export type EmailType = 'confirmation' | 'reminder_1h' | 'reminder_24h' | 'replay' | 'custom';

export type RegistrationFieldType = 'name' | 'email' | 'phone' | 'text' | 'textarea' | 'select';

export interface RegistrationField {
  id: string;
  type: RegistrationFieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export type EmailStatus = 'pending' | 'sent' | 'failed';

// ============================================
// Base Types (Database Row Types)
// ============================================

export interface User {
  id: string;
  whop_user_id: string;
  email: string | null;
  name: string | null;
  username: string | null;
  profile_pic_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  whop_company_id: string;
  name: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: CompanyRole;
  created_at: string;
}

export interface Webinar {
  id: string;
  company_id: string;

  // Basic Info
  title: string;
  slug: string;
  description: string | null;

  // Scheduling
  scheduled_at: string;
  duration_minutes: number;
  timezone: string;

  // Status
  status: WebinarStatus;

  // Video Configuration
  video_type: VideoType;
  video_url: string | null;
  replay_url: string | null;

  // Landing Page Customization
  cover_image_url: string | null;
  cta_text: string | null;
  cta_url: string | null;
  show_host_info: boolean;

  // Features
  chat_enabled: boolean;
  qa_enabled: boolean;
  polls_enabled: boolean;
  reactions_enabled: boolean;

  // Email Settings
  send_confirmation_email: boolean;
  send_reminder_1h: boolean;
  send_reminder_24h: boolean;
  send_replay_email: boolean;

  // Registration Form Configuration
  registration_fields: RegistrationField[];

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface WebinarHost {
  id: string;
  webinar_id: string;
  user_id: string | null;

  // Host Info
  name: string;
  title: string | null;
  bio: string | null;
  image_url: string | null;

  display_order: number;
  created_at: string;
}

export interface Registration {
  id: string;
  webinar_id: string;

  // Registration Info
  email: string;
  name: string | null;
  phone: string | null;

  // Custom field answers (keyed by field ID)
  custom_fields: Record<string, string> | null;

  // Optional Whop user link
  user_id: string | null;

  // Registration Source
  source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_content: string | null;

  // Status
  attended: boolean;
  attended_at: string | null;
  watched_replay: boolean;
  watched_replay_at: string | null;

  // Email Status
  confirmation_sent: boolean;
  reminder_1h_sent: boolean;
  reminder_24h_sent: boolean;
  replay_sent: boolean;

  created_at: string;
}

export interface ChatMessage {
  id: string;
  webinar_id: string;
  registration_id: string;

  message: string;

  // Moderation
  is_pinned: boolean;
  is_hidden: boolean;

  created_at: string;
}

export interface QAQuestion {
  id: string;
  webinar_id: string;
  registration_id: string;

  question: string;

  // Status
  status: QAQuestionStatus;

  // Answer
  answer: string | null;
  answered_by: string | null;
  answered_at: string | null;

  // Moderation
  is_highlighted: boolean;
  is_hidden: boolean;

  // Upvotes
  upvote_count: number;

  created_at: string;
}

export interface QAUpvote {
  id: string;
  question_id: string;
  registration_id: string;
  created_at: string;
}

export interface PollOption {
  id: string;
  text: string;
}

export interface Poll {
  id: string;
  webinar_id: string;

  question: string;
  options: PollOption[];

  // Status
  status: PollStatus;

  // Settings
  allow_multiple: boolean;
  show_results_live: boolean;

  // Timing
  started_at: string | null;
  ended_at: string | null;

  created_at: string;
}

export interface PollResponse {
  id: string;
  poll_id: string;
  registration_id: string;

  selected_options: string[]; // Array of option IDs

  created_at: string;
}

export interface Reaction {
  id: string;
  webinar_id: string;
  registration_id: string;

  emoji: string;

  created_at: string;
}

export interface DiscountCode {
  id: string;
  webinar_id: string;

  code: string;
  description: string | null;

  // Discount Type
  discount_type: DiscountType;
  discount_value: number;

  // Limits
  max_uses: number | null;
  times_used: number;

  // Validity
  valid_from: string | null;
  valid_until: string | null;

  // Display Settings
  show_at_minutes: number | null;
  auto_apply_url: string | null;

  // Status
  is_active: boolean;

  created_at: string;
}

export interface EmailQueueItem {
  id: string;

  // Email Type
  email_type: EmailType;

  // Recipient
  registration_id: string;
  to_email: string;
  to_name: string | null;

  // Content
  subject: string;
  template_data: Record<string, unknown> | null;

  // Scheduling
  scheduled_for: string;

  // Status
  status: EmailStatus;
  sent_at: string | null;
  error_message: string | null;

  // Retry tracking
  attempts: number;
  max_attempts: number;

  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  webinar_id: string;
  registration_id: string | null;

  // Event Info
  event_type: string;
  event_data: Record<string, unknown> | null;

  // Session tracking
  session_id: string | null;

  // Device/Browser info
  user_agent: string | null;
  ip_address: string | null;
  referrer: string | null;

  created_at: string;
}

// ============================================
// Insert Types (for creating new records)
// ============================================

export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'>;

export type CompanyInsert = Omit<Company, 'id' | 'created_at' | 'updated_at'>;

export type CompanyMemberInsert = Omit<CompanyMember, 'id' | 'created_at'>;

export type WebinarInsert = Omit<Webinar, 'id' | 'created_at' | 'updated_at'>;

export type WebinarHostInsert = Omit<WebinarHost, 'id' | 'created_at'>;

export type RegistrationInsert = Omit<Registration, 'id' | 'created_at' | 'attended' | 'attended_at' | 'watched_replay' | 'watched_replay_at' | 'confirmation_sent' | 'reminder_1h_sent' | 'reminder_24h_sent' | 'replay_sent'> & {
  phone?: string | null;
  custom_fields?: Record<string, string> | null;
};

export type ChatMessageInsert = Omit<ChatMessage, 'id' | 'created_at' | 'is_pinned' | 'is_hidden'>;

export type QAQuestionInsert = Omit<QAQuestion, 'id' | 'created_at' | 'status' | 'answer' | 'answered_by' | 'answered_at' | 'is_highlighted' | 'is_hidden' | 'upvote_count'>;

export type QAUpvoteInsert = Omit<QAUpvote, 'id' | 'created_at'>;

export type PollInsert = Omit<Poll, 'id' | 'created_at' | 'status' | 'started_at' | 'ended_at'>;

export type PollResponseInsert = Omit<PollResponse, 'id' | 'created_at'>;

export type ReactionInsert = Omit<Reaction, 'id' | 'created_at'>;

export type DiscountCodeInsert = Omit<DiscountCode, 'id' | 'created_at' | 'current_uses'>;

export type EmailQueueInsert = Omit<EmailQueueItem, 'id' | 'created_at' | 'status' | 'sent_at' | 'error_message' | 'attempts'>;

export type AnalyticsEventInsert = Omit<AnalyticsEvent, 'id' | 'created_at'>;

// ============================================
// Update Types (for updating records)
// ============================================

export type UserUpdate = Partial<Omit<User, 'id' | 'whop_user_id' | 'created_at' | 'updated_at'>>;

export type CompanyUpdate = Partial<Omit<Company, 'id' | 'whop_company_id' | 'created_at' | 'updated_at'>>;

export type WebinarUpdate = Partial<Omit<Webinar, 'id' | 'company_id' | 'created_at' | 'updated_at'>>;

export type WebinarHostUpdate = Partial<Omit<WebinarHost, 'id' | 'webinar_id' | 'created_at'>>;

export type RegistrationUpdate = Partial<Omit<Registration, 'id' | 'webinar_id' | 'email' | 'created_at'>>;

export type ChatMessageUpdate = Partial<Pick<ChatMessage, 'is_pinned' | 'is_hidden'>>;

export type QAQuestionUpdate = Partial<Omit<QAQuestion, 'id' | 'webinar_id' | 'registration_id' | 'question' | 'created_at' | 'upvote_count'>>;

export type PollUpdate = Partial<Omit<Poll, 'id' | 'webinar_id' | 'created_at'>>;

export type DiscountCodeUpdate = Partial<Omit<DiscountCode, 'id' | 'webinar_id' | 'created_at'>>;

export type EmailQueueUpdate = Partial<Pick<EmailQueueItem, 'status' | 'sent_at' | 'error_message' | 'attempts'>>;

// ============================================
// Supabase Database Type (for client typing)
// Note: Using a simplified type to avoid complex Supabase SSR typing issues
// ============================================

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Database {}
