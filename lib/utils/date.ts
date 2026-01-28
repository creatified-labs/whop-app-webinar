/**
 * Date and Timezone Utilities
 * Functions for handling dates across timezones
 */

import {
  format,
  formatDistance,
  formatRelative,
  addMinutes,
  subMinutes,
  subHours,
  isAfter,
  isBefore,
  differenceInMinutes,
  differenceInSeconds,
  parseISO,
} from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';

// ============================================
// Common Timezones
// ============================================

export const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
] as const;

// ============================================
// Format Functions
// ============================================

/**
 * Format a date in a specific timezone
 */
export function formatInTimezone(
  date: Date | string,
  timezone: string,
  formatStr: string
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, timezone, formatStr);
}

/**
 * Format a date for display (e.g., "January 15, 2024 at 2:00 PM EST")
 */
export function formatWebinarDate(
  date: Date | string,
  timezone: string
): string {
  return formatInTimezone(date, timezone, "MMMM d, yyyy 'at' h:mm a zzz");
}

/**
 * Format a short date (e.g., "Jan 15, 2024")
 */
export function formatShortDate(date: Date | string, timezone: string): string {
  return formatInTimezone(date, timezone, 'MMM d, yyyy');
}

/**
 * Format time only (e.g., "2:00 PM")
 */
export function formatTime(date: Date | string, timezone: string): string {
  return formatInTimezone(date, timezone, 'h:mm a');
}

/**
 * Format a date for ISO string in a specific timezone
 * Useful for form inputs
 */
export function formatDatetimeLocal(
  date: Date | string,
  timezone: string
): string {
  return formatInTimezone(date, timezone, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Format relative time (e.g., "in 2 hours", "3 days ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true });
}

// ============================================
// Conversion Functions
// ============================================

/**
 * Convert a local datetime string to UTC
 * Used when saving user input to database
 */
export function localToUTC(localDatetime: string, timezone: string): Date {
  const localDate = parseISO(localDatetime);
  return fromZonedTime(localDate, timezone);
}

/**
 * Convert a UTC date to a specific timezone
 */
export function utcToTimezone(utcDate: Date | string, timezone: string): Date {
  const dateObj = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  return toZonedTime(dateObj, timezone);
}

/**
 * Get the user's browser timezone
 */
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// ============================================
// Calculation Functions
// ============================================

/**
 * Calculate webinar end time
 */
export function getWebinarEndTime(
  startTime: Date | string,
  durationMinutes: number
): Date {
  const startDate = typeof startTime === 'string' ? parseISO(startTime) : startTime;
  return addMinutes(startDate, durationMinutes);
}

/**
 * Check if a webinar has started
 */
export function hasWebinarStarted(scheduledAt: Date | string): boolean {
  const scheduled = typeof scheduledAt === 'string' ? parseISO(scheduledAt) : scheduledAt;
  return isAfter(new Date(), scheduled);
}

/**
 * Check if a webinar has ended
 */
export function hasWebinarEnded(
  scheduledAt: Date | string,
  durationMinutes: number
): boolean {
  const endTime = getWebinarEndTime(scheduledAt, durationMinutes);
  return isAfter(new Date(), endTime);
}

/**
 * Get time until webinar starts (in seconds)
 * Returns negative if webinar has started
 */
export function getSecondsUntilStart(scheduledAt: Date | string): number {
  const scheduled = typeof scheduledAt === 'string' ? parseISO(scheduledAt) : scheduledAt;
  return differenceInSeconds(scheduled, new Date());
}

/**
 * Get minutes since webinar started
 * Returns negative if webinar hasn't started
 */
export function getMinutesSinceStart(scheduledAt: Date | string): number {
  const scheduled = typeof scheduledAt === 'string' ? parseISO(scheduledAt) : scheduledAt;
  return differenceInMinutes(new Date(), scheduled);
}

// ============================================
// Email Reminder Calculations
// ============================================

/**
 * Calculate 24-hour reminder time
 */
export function get24HourReminderTime(scheduledAt: Date | string): Date {
  const scheduled = typeof scheduledAt === 'string' ? parseISO(scheduledAt) : scheduledAt;
  return subHours(scheduled, 24);
}

/**
 * Calculate 1-hour reminder time
 */
export function get1HourReminderTime(scheduledAt: Date | string): Date {
  const scheduled = typeof scheduledAt === 'string' ? parseISO(scheduledAt) : scheduledAt;
  return subHours(scheduled, 1);
}

/**
 * Check if it's time to send 24-hour reminder
 */
export function shouldSend24HourReminder(scheduledAt: Date | string): boolean {
  const reminderTime = get24HourReminderTime(scheduledAt);
  const now = new Date();
  // Send if we're within 1 hour of the reminder time
  return (
    isAfter(now, subMinutes(reminderTime, 30)) &&
    isBefore(now, addMinutes(reminderTime, 30))
  );
}

/**
 * Check if it's time to send 1-hour reminder
 */
export function shouldSend1HourReminder(scheduledAt: Date | string): boolean {
  const reminderTime = get1HourReminderTime(scheduledAt);
  const now = new Date();
  // Send if we're within 15 minutes of the reminder time
  return (
    isAfter(now, subMinutes(reminderTime, 15)) &&
    isBefore(now, addMinutes(reminderTime, 15))
  );
}

// ============================================
// Duration Formatting
// ============================================

/**
 * Format duration in minutes to human readable string
 * e.g., 90 -> "1 hour 30 minutes"
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  }

  if (mins === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`;
}

/**
 * Format duration for countdown display
 * e.g., { days: 2, hours: 5, minutes: 30, seconds: 15 }
 */
export function getCountdownParts(targetDate: Date | string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const target = typeof targetDate === 'string' ? parseISO(targetDate) : targetDate;
  const now = new Date();
  const total = Math.max(0, differenceInSeconds(target, now));

  return {
    days: Math.floor(total / (60 * 60 * 24)),
    hours: Math.floor((total % (60 * 60 * 24)) / (60 * 60)),
    minutes: Math.floor((total % (60 * 60)) / 60),
    seconds: total % 60,
    total,
  };
}
