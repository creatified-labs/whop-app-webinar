/**
 * Database Types
 * These types mirror the Supabase database schema
 */

// ============================================
// Enums
// ============================================

export type WebinarStatus = 'draft' | 'scheduled' | 'live' | 'ended' | 'cancelled';

export type VideoType = 'url' | 'whop_live' | 'google_meet' | 'zoom';

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

export type StreamStatus = 'idle' | 'connecting' | 'live' | 'ended';

export type EngagementEventType =
  | 'chat_message'
  | 'qa_submit'
  | 'qa_upvote'
  | 'poll_response'
  | 'reaction'
  | 'cta_click'
  | 'watch_milestone';

export type PaymentStatus = 'not_required' | 'pending' | 'completed' | 'refunded';

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

  // Zoom Integration
  zoom_meeting_id: string | null;
  zoom_meeting_password: string | null;
  zoom_host_email: string | null;

  // Mux Live Streaming
  stream_key: string | null;
  mux_stream_id: string | null;
  mux_playback_id: string | null;
  stream_status: StreamStatus | null;

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

  // Payment Settings
  is_paid: boolean;
  price_cents: number | null;
  whop_product_id: string | null;
  whop_plan_id: string | null;
  allow_free_with_code: boolean;

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

  // A/B testing variant
  variant_id: string | null;

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

  // Payment Status
  payment_status: PaymentStatus;
  payment_amount_cents: number | null;
  whop_payment_id: string | null;
  whop_membership_id: string | null;
  discount_code_id: string | null;
  discount_amount_cents: number;
  paid_at: string | null;

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

  // Free access option
  allows_free_access: boolean;

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
// Analytics Suite Types
// ============================================

export interface EngagementEvent {
  id: string;
  webinar_id: string;
  registration_id: string;

  event_type: EngagementEventType;
  event_data: Record<string, unknown> | null;
  points_earned: number;

  created_at: string;
}

export interface WatchSession {
  id: string;
  webinar_id: string;
  registration_id: string;

  session_start: string;
  session_end: string | null;
  total_watch_seconds: number;
  milestones_reached: number[];

  created_at: string;
  updated_at: string;
}

export interface EngagementConfig {
  id: string;
  company_id: string;

  // Point values for each action
  chat_message_points: number;
  qa_submit_points: number;
  qa_upvote_points: number;
  poll_response_points: number;
  reaction_points: number;
  cta_click_points: number;

  // Watch milestone points
  watch_25_points: number;
  watch_50_points: number;
  watch_75_points: number;
  watch_100_points: number;

  created_at: string;
  updated_at: string;
}

export interface LeadScore {
  id: string;
  registration_id: string;

  total_score: number;
  engagement_score: number;
  watch_time_score: number;
  interaction_score: number;

  last_calculated_at: string;
  created_at: string;
}

export interface LandingPageVariant {
  id: string;
  webinar_id: string;

  variant_name: string;
  variant_config: {
    headline?: string;
    cta_text?: string;
    cover_image_url?: string;
    description?: string;
  } | null;
  traffic_percentage: number;
  is_active: boolean;

  created_at: string;
}

// ============================================
// Zoom Integration Types
// ============================================

export interface ZoomSession {
  id: string;
  webinar_id: string;
  registration_id: string;

  joined_at: string;
  left_at: string | null;
  duration_seconds: number | null;

  created_at: string;
}

// ============================================
// Mux Streaming Types
// ============================================

export interface StreamSession {
  id: string;
  webinar_id: string;

  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  peak_viewers: number;
  total_views: number;

  created_at: string;
}

// ============================================
// Insert Types (for creating new records)
// ============================================

export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'>;

export type CompanyInsert = Omit<Company, 'id' | 'created_at' | 'updated_at'>;

export type CompanyMemberInsert = Omit<CompanyMember, 'id' | 'created_at'>;

export type WebinarInsert = Omit<Webinar, 'id' | 'created_at' | 'updated_at' | 'is_paid' | 'price_cents' | 'whop_product_id' | 'whop_plan_id' | 'allow_free_with_code' | 'zoom_meeting_id' | 'zoom_meeting_password' | 'zoom_host_email' | 'stream_key' | 'mux_stream_id' | 'mux_playback_id' | 'stream_status'> & {
  is_paid?: boolean;
  price_cents?: number | null;
  whop_product_id?: string | null;
  whop_plan_id?: string | null;
  allow_free_with_code?: boolean;
  zoom_meeting_id?: string | null;
  zoom_meeting_password?: string | null;
  zoom_host_email?: string | null;
  stream_key?: string | null;
  mux_stream_id?: string | null;
  mux_playback_id?: string | null;
  stream_status?: StreamStatus | null;
};

export type WebinarHostInsert = Omit<WebinarHost, 'id' | 'created_at'>;

export type RegistrationInsert = Omit<Registration, 'id' | 'created_at' | 'attended' | 'attended_at' | 'watched_replay' | 'watched_replay_at' | 'confirmation_sent' | 'reminder_1h_sent' | 'reminder_24h_sent' | 'replay_sent' | 'variant_id' | 'payment_status' | 'payment_amount_cents' | 'whop_payment_id' | 'whop_membership_id' | 'discount_code_id' | 'discount_amount_cents' | 'paid_at'> & {
  phone?: string | null;
  custom_fields?: Record<string, string> | null;
  variant_id?: string | null;
  payment_status?: PaymentStatus;
  payment_amount_cents?: number | null;
  discount_code_id?: string | null;
  discount_amount_cents?: number;
};

export type ChatMessageInsert = Omit<ChatMessage, 'id' | 'created_at' | 'is_pinned' | 'is_hidden'>;

export type QAQuestionInsert = Omit<QAQuestion, 'id' | 'created_at' | 'status' | 'answer' | 'answered_by' | 'answered_at' | 'is_highlighted' | 'is_hidden' | 'upvote_count'>;

export type QAUpvoteInsert = Omit<QAUpvote, 'id' | 'created_at'>;

export type PollInsert = Omit<Poll, 'id' | 'created_at' | 'status' | 'started_at' | 'ended_at'>;

export type PollResponseInsert = Omit<PollResponse, 'id' | 'created_at'>;

export type ReactionInsert = Omit<Reaction, 'id' | 'created_at'>;

export type DiscountCodeInsert = Omit<DiscountCode, 'id' | 'created_at' | 'times_used' | 'allows_free_access'> & {
  times_used?: number;
  allows_free_access?: boolean;
};

export type EmailQueueInsert = Omit<EmailQueueItem, 'id' | 'created_at' | 'status' | 'sent_at' | 'error_message' | 'attempts'>;

export type AnalyticsEventInsert = Omit<AnalyticsEvent, 'id' | 'created_at'>;

export type EngagementEventInsert = Omit<EngagementEvent, 'id' | 'created_at'>;

export type WatchSessionInsert = Omit<WatchSession, 'id' | 'created_at' | 'updated_at' | 'session_end' | 'total_watch_seconds' | 'milestones_reached'>;

export type EngagementConfigInsert = Omit<EngagementConfig, 'id' | 'created_at' | 'updated_at'>;

export type LeadScoreInsert = Omit<LeadScore, 'id' | 'created_at' | 'last_calculated_at'>;

export type LandingPageVariantInsert = Omit<LandingPageVariant, 'id' | 'created_at'>;

export type ZoomSessionInsert = Omit<ZoomSession, 'id' | 'created_at' | 'left_at' | 'duration_seconds'>;

export type StreamSessionInsert = Omit<StreamSession, 'id' | 'created_at' | 'ended_at' | 'duration_seconds' | 'peak_viewers' | 'total_views'>;

// ============================================
// Update Types (for updating records)
// ============================================

export type UserUpdate = Partial<Omit<User, 'id' | 'whop_user_id' | 'created_at' | 'updated_at'>>;

export type CompanyUpdate = Partial<Omit<Company, 'id' | 'whop_company_id' | 'created_at' | 'updated_at'>>;

export type WebinarUpdate = Partial<Omit<Webinar, 'id' | 'company_id' | 'created_at' | 'updated_at'>>;

export type WebinarHostUpdate = Partial<Omit<WebinarHost, 'id' | 'webinar_id' | 'created_at'>>;

export type RegistrationUpdate = Partial<Omit<Registration, 'id' | 'webinar_id' | 'email' | 'created_at'>> & {
  payment_status?: PaymentStatus;
  payment_amount_cents?: number | null;
  whop_payment_id?: string | null;
  whop_membership_id?: string | null;
  paid_at?: string | null;
};

export type ChatMessageUpdate = Partial<Pick<ChatMessage, 'is_pinned' | 'is_hidden'>>;

export type QAQuestionUpdate = Partial<Omit<QAQuestion, 'id' | 'webinar_id' | 'registration_id' | 'question' | 'created_at' | 'upvote_count'>>;

export type PollUpdate = Partial<Omit<Poll, 'id' | 'webinar_id' | 'created_at'>>;

export type DiscountCodeUpdate = Partial<Omit<DiscountCode, 'id' | 'webinar_id' | 'created_at'>>;

export type EmailQueueUpdate = Partial<Pick<EmailQueueItem, 'status' | 'sent_at' | 'error_message' | 'attempts'>>;

export type WatchSessionUpdate = Partial<Pick<WatchSession, 'session_end' | 'total_watch_seconds' | 'milestones_reached'>>;

export type EngagementConfigUpdate = Partial<Omit<EngagementConfig, 'id' | 'company_id' | 'created_at' | 'updated_at'>>;

export type LeadScoreUpdate = Partial<Omit<LeadScore, 'id' | 'registration_id' | 'created_at'>>;

export type LandingPageVariantUpdate = Partial<Omit<LandingPageVariant, 'id' | 'webinar_id' | 'created_at'>>;

export type ZoomSessionUpdate = Partial<Pick<ZoomSession, 'left_at' | 'duration_seconds'>>;

export type StreamSessionUpdate = Partial<Pick<StreamSession, 'ended_at' | 'duration_seconds' | 'peak_viewers' | 'total_views'>>;

// ============================================
// Supabase Database Type (for client typing)
// Note: Using a simplified type to avoid complex Supabase SSR typing issues
// ============================================

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Database {}
