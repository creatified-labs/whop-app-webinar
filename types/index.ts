/**
 * Type Exports
 * Central export for all application types
 */

// Re-export all database types
export * from './database';

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// Webinar with Relations
// ============================================

import type {
  Webinar,
  WebinarHost,
  Registration,
  Poll,
  DiscountCode,
  Company,
  RegistrationField,
} from './database';

export interface WebinarWithHosts extends Webinar {
  hosts: WebinarHost[];
}

export interface WebinarWithDetails extends Webinar {
  hosts: WebinarHost[];
  company: Company;
  registration_count: number;
}

export interface WebinarPublicView {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  timezone: string;
  status: Webinar['status'];
  cover_image_url: string | null;
  cta_text: string | null;
  cta_url: string | null;
  show_host_info: boolean;
  chat_enabled: boolean;
  qa_enabled: boolean;
  polls_enabled: boolean;
  reactions_enabled: boolean;
  registration_fields: RegistrationField[];
  hosts: WebinarHost[];
  company: {
    name: string;
    image_url: string | null;
  };
  registration_count: number;
}

// ============================================
// Registration with Relations
// ============================================

export interface RegistrationWithWebinar extends Registration {
  webinar: Webinar;
}

export interface RegistrationWithUser extends Registration {
  user: {
    name: string | null;
    profile_pic_url: string | null;
  } | null;
}

// ============================================
// Chat Types
// ============================================

export interface ChatMessageWithSender extends Omit<import('./database').ChatMessage, 'registration_id'> {
  sender: {
    id: string;
    name: string | null;
    email: string;
  };
}

// ============================================
// Q&A Types
// ============================================

export interface QAQuestionWithDetails extends Omit<import('./database').QAQuestion, 'registration_id' | 'answered_by'> {
  asker: {
    id: string;
    name: string | null;
  };
  answerer: {
    name: string | null;
    profile_pic_url: string | null;
  } | null;
  has_upvoted?: boolean;
}

// ============================================
// Poll Types
// ============================================

export interface PollWithResults extends Poll {
  results: {
    option_id: string;
    count: number;
    percentage: number;
  }[];
  total_responses: number;
  user_response?: string[];
}

// ============================================
// Analytics Types
// ============================================

export interface WebinarAnalytics {
  webinar_id: string;
  total_registrations: number;
  total_attendees: number;
  peak_viewers: number;
  average_watch_time_minutes: number;
  replay_views: number;
  chat_messages: number;
  questions_asked: number;
  questions_answered: number;
  poll_participation_rate: number;
  cta_clicks: number;
  conversion_rate: number;
}

export interface RegistrationAnalytics {
  date: string;
  count: number;
}

export interface AttendanceAnalytics {
  joined_at: string;
  left_at: string | null;
  watch_time_minutes: number;
}

// ============================================
// Form Types
// ============================================

export interface WebinarFormData {
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  timezone: string;
  video_type: Webinar['video_type'];
  video_url?: string;
  replay_url?: string;
  cover_image_url?: string;
  cta_text?: string;
  cta_url?: string;
  show_host_info: boolean;
  chat_enabled: boolean;
  qa_enabled: boolean;
  polls_enabled: boolean;
  reactions_enabled: boolean;
  send_confirmation_email: boolean;
  send_reminder_1h: boolean;
  send_reminder_24h: boolean;
  send_replay_email: boolean;
  registration_fields?: RegistrationField[];
}

export interface RegistrationFormData {
  email: string;
  name?: string;
  phone?: string;
  source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  utm_content?: string;
  custom_fields?: Record<string, string>;
}

export interface HostFormData {
  name: string;
  title?: string;
  bio?: string;
  image_url?: string;
  user_id?: string;
}

export interface PollFormData {
  question: string;
  options: { text: string }[];
  allow_multiple: boolean;
  show_results_live: boolean;
}

export interface DiscountCodeFormData {
  code: string;
  description?: string;
  discount_type: DiscountCode['discount_type'];
  discount_value: number;
  max_uses?: number;
  valid_from?: string;
  valid_until?: string;
  show_at_minutes?: number;
  auto_apply_url?: string;
}

// ============================================
// Realtime Types
// ============================================

export interface RealtimePayload<T> {
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T | null;
  errors: string[] | null;
}

export interface PresenceState {
  [key: string]: {
    user_id: string;
    name: string | null;
    online_at: string;
  }[];
}

// ============================================
// Session Types
// ============================================

export interface ViewerSession {
  registration_id: string;
  webinar_id: string;
  email: string;
  name: string | null;
  joined_at: string;
}
