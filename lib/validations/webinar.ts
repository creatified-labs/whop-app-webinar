/**
 * Zod Validation Schemas
 * Form validation for webinar-related forms
 */

import { z } from 'zod';

// ============================================
// Common Schemas
// ============================================

export const emailSchema = z.string().email('Please enter a valid email address');

export const urlSchema = z.string().url('Please enter a valid URL').optional().or(z.literal(''));

export const timezoneSchema = z.string().min(1, 'Please select a timezone');

// ============================================
// Webinar Schemas
// ============================================

export const webinarStatusSchema = z.enum(['draft', 'scheduled', 'live', 'ended', 'cancelled']);

export const videoTypeSchema = z.enum(['url', 'whop_live', 'google_meet', 'zoom']);

export const registrationFieldTypeSchema = z.enum(['name', 'email', 'phone', 'text', 'textarea', 'select']);

export const registrationFieldSchema = z.object({
  id: z.string(),
  type: registrationFieldTypeSchema,
  label: z.string().min(1).max(200),
  required: z.boolean(),
  placeholder: z.string().max(200).optional(),
  options: z.array(z.string().max(200)).optional(),
});

export const createWebinarSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),

  description: z
    .string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional(),

  scheduled_at: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Please enter a valid date'),

  duration_minutes: z
    .number()
    .min(5, 'Duration must be at least 5 minutes')
    .max(480, 'Duration must be less than 8 hours'),

  timezone: timezoneSchema,

  video_type: videoTypeSchema,

  video_url: urlSchema,

  replay_url: urlSchema,

  cover_image_url: urlSchema,

  cta_text: z
    .string()
    .max(100, 'CTA text must be less than 100 characters')
    .optional(),

  cta_url: urlSchema,

  show_host_info: z.boolean().default(true),

  chat_enabled: z.boolean().default(true),

  qa_enabled: z.boolean().default(true),

  polls_enabled: z.boolean().default(true),

  reactions_enabled: z.boolean().default(true),

  send_confirmation_email: z.boolean().default(true),

  send_reminder_1h: z.boolean().default(true),

  send_reminder_24h: z.boolean().default(true),

  send_replay_email: z.boolean().default(true),

  registration_fields: z.array(registrationFieldSchema).default([
    { id: 'name', type: 'name', label: 'Full Name', required: true },
    { id: 'email', type: 'email', label: 'Email Address', required: true },
  ]),
});

export const updateWebinarSchema = createWebinarSchema.partial().extend({
  status: webinarStatusSchema.optional(),
});

export type CreateWebinarInput = z.infer<typeof createWebinarSchema>;
export type UpdateWebinarInput = z.infer<typeof updateWebinarSchema>;

// ============================================
// Registration Schemas
// ============================================

export const registrationSchema = z.object({
  email: emailSchema,

  name: z
    .string()
    .min(1, 'Please enter your name')
    .max(100, 'Name must be less than 100 characters')
    .optional(),

  phone: z
    .string()
    .max(50, 'Phone number must be less than 50 characters')
    .optional(),

  source: z.string().optional(),

  utm_campaign: z.string().optional(),

  utm_medium: z.string().optional(),

  utm_content: z.string().optional(),

  custom_fields: z.record(z.string(), z.string()).optional(),

  // Payment-related fields
  discount_code: z.string().max(50).optional(),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

// ============================================
// Host Schemas
// ============================================

export const hostSchema = z.object({
  name: z
    .string()
    .min(1, 'Please enter the host name')
    .max(100, 'Name must be less than 100 characters'),

  title: z
    .string()
    .max(100, 'Title must be less than 100 characters')
    .optional(),

  bio: z
    .string()
    .max(1000, 'Bio must be less than 1000 characters')
    .optional(),

  image_url: urlSchema,

  user_id: z.string().uuid().optional(),
});

export type HostInput = z.infer<typeof hostSchema>;

// ============================================
// Poll Schemas
// ============================================

export const pollOptionSchema = z.object({
  text: z
    .string()
    .min(1, 'Option text is required')
    .max(200, 'Option must be less than 200 characters'),
});

export const pollSchema = z.object({
  question: z
    .string()
    .min(3, 'Question must be at least 3 characters')
    .max(500, 'Question must be less than 500 characters'),

  options: z
    .array(pollOptionSchema)
    .min(2, 'At least 2 options are required')
    .max(10, 'Maximum 10 options allowed'),

  allow_multiple: z.boolean().default(false),

  show_results_live: z.boolean().default(true),
});

export type PollInput = z.infer<typeof pollSchema>;

// ============================================
// Poll Response Schema
// ============================================

export const pollResponseSchema = z.object({
  poll_id: z.string().uuid(),

  selected_options: z
    .array(z.string())
    .min(1, 'Please select at least one option'),
});

export type PollResponseInput = z.infer<typeof pollResponseSchema>;

// ============================================
// Discount Code Schemas
// ============================================

export const discountTypeSchema = z.enum(['percentage', 'fixed']);

export const discountCodeSchema = z.object({
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .max(50, 'Code must be less than 50 characters')
    .regex(/^[A-Z0-9_-]+$/i, 'Code can only contain letters, numbers, underscores, and hyphens'),

  description: z
    .string()
    .max(200, 'Description must be less than 200 characters')
    .optional(),

  discount_type: discountTypeSchema,

  discount_value: z
    .number()
    .positive('Discount value must be positive')
    .refine(
      (val) => val <= 100,
      'Percentage discount cannot exceed 100%'
    ),

  max_uses: z
    .number()
    .int()
    .positive('Max uses must be a positive number')
    .optional(),

  valid_from: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), 'Please enter a valid date')
    .optional(),

  valid_until: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), 'Please enter a valid date')
    .optional(),

  show_at_minutes: z
    .number()
    .int()
    .min(0, 'Minutes must be 0 or greater')
    .optional(),

  auto_apply_url: urlSchema,
});

export type DiscountCodeInput = z.infer<typeof discountCodeSchema>;

// ============================================
// Chat Schemas
// ============================================

export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(500, 'Message must be less than 500 characters'),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

// ============================================
// Q&A Schemas
// ============================================

export const questionSchema = z.object({
  question: z
    .string()
    .min(5, 'Question must be at least 5 characters')
    .max(1000, 'Question must be less than 1000 characters'),
});

export type QuestionInput = z.infer<typeof questionSchema>;

export const answerSchema = z.object({
  answer: z
    .string()
    .min(1, 'Answer cannot be empty')
    .max(5000, 'Answer must be less than 5000 characters'),
});

export type AnswerInput = z.infer<typeof answerSchema>;

// ============================================
// Reaction Schemas
// ============================================

const allowedEmojis = ['🔥', '❤️', '👏', '😂', '😮', '🎉', '💯', '👍'] as const;

export const reactionSchema = z.object({
  emoji: z.enum(allowedEmojis, {
    message: 'Please select a valid emoji',
  }),
});

export type ReactionInput = z.infer<typeof reactionSchema>;

export const ALLOWED_REACTIONS = allowedEmojis;
