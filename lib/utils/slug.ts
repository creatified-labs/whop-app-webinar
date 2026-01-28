/**
 * Slug Generation Utilities
 * Functions for creating URL-safe slugs
 */

import { nanoid } from 'nanoid';

/**
 * Convert a string to a URL-safe slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove special characters
    .replace(/[^\w\-]+/g, '')
    // Replace multiple hyphens with single hyphen
    .replace(/\-\-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Generate a unique slug with a random suffix
 * Useful for ensuring uniqueness in the database
 */
export function generateUniqueSlug(title: string): string {
  const baseSlug = slugify(title);
  const suffix = nanoid(6).toLowerCase();
  return `${baseSlug}-${suffix}`;
}

/**
 * Generate a short unique ID
 * Useful for poll options, etc.
 */
export function generateId(length: number = 8): string {
  return nanoid(length);
}

/**
 * Validate that a slug is URL-safe
 */
export function isValidSlug(slug: string): boolean {
  // Only allow lowercase letters, numbers, and hyphens
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

/**
 * Extract the base slug (without random suffix)
 * Assumes suffix is last 7 characters (hyphen + 6 chars)
 */
export function getBaseSlug(slug: string): string {
  // Remove the last segment if it looks like a random suffix
  const parts = slug.split('-');
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1];
    // Check if last part looks like a nanoid suffix (6 chars, alphanumeric)
    if (lastPart.length === 6 && /^[a-z0-9]+$/.test(lastPart)) {
      return parts.slice(0, -1).join('-');
    }
  }
  return slug;
}
