/**
 * Discount Code Data Functions
 * CRUD operations for discount codes
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { DiscountCode, DiscountCodeInsert, DiscountCodeUpdate } from '@/types/database';

// ============================================
// Discount Code CRUD
// ============================================

/**
 * Create a new discount code
 */
export async function createDiscountCode(
  webinarId: string,
  data: Omit<DiscountCodeInsert, 'webinar_id'>
): Promise<DiscountCode> {
  const supabase = createAdminClient();

  const { data: code, error } = await supabase
    .from('discount_codes')
    .insert({
      ...data,
      webinar_id: webinarId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create discount code: ${error.message}`);
  }

  return code;
}

/**
 * Get a discount code by ID
 */
export async function getDiscountCodeById(id: string): Promise<DiscountCode | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get discount code: ${error.message}`);
  }

  return data;
}

/**
 * Get a discount code by code string
 */
export async function getDiscountCodeByCode(
  webinarId: string,
  code: string
): Promise<DiscountCode | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('webinar_id', webinarId)
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get discount code: ${error.message}`);
  }

  return data;
}

/**
 * Get all discount codes for a webinar
 */
export async function getWebinarDiscountCodes(webinarId: string): Promise<DiscountCode[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('webinar_id', webinarId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get discount codes: ${error.message}`);
  }

  return data;
}

/**
 * Update a discount code
 */
export async function updateDiscountCode(
  id: string,
  updates: DiscountCodeUpdate
): Promise<DiscountCode> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('discount_codes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update discount code: ${error.message}`);
  }

  return data;
}

/**
 * Toggle discount code active state
 */
export async function toggleDiscountCodeActive(id: string): Promise<DiscountCode> {
  const supabase = createAdminClient();

  // Get current state
  const current = await getDiscountCodeById(id);
  if (!current) {
    throw new Error('Discount code not found');
  }

  return updateDiscountCode(id, { is_active: !current.is_active });
}

/**
 * Delete a discount code
 */
export async function deleteDiscountCode(id: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('discount_codes')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete discount code: ${error.message}`);
  }
}

/**
 * Increment use count for a discount code
 */
export async function incrementDiscountCodeUse(id: string): Promise<DiscountCode> {
  const supabase = createAdminClient();

  // Get current code
  const current = await getDiscountCodeById(id);
  if (!current) {
    throw new Error('Discount code not found');
  }

  return updateDiscountCode(id, { times_used: current.times_used + 1 });
}

/**
 * Validate a discount code
 * Returns the code if valid, null if invalid
 */
export async function validateDiscountCode(
  webinarId: string,
  code: string
): Promise<DiscountCode | null> {
  const discountCode = await getDiscountCodeByCode(webinarId, code);

  if (!discountCode) return null;
  if (!discountCode.is_active) return null;

  // Check max uses
  if (discountCode.max_uses && discountCode.times_used >= discountCode.max_uses) {
    return null;
  }

  // Check validity period
  const now = new Date();
  if (discountCode.valid_from && new Date(discountCode.valid_from) > now) {
    return null;
  }
  if (discountCode.valid_until && new Date(discountCode.valid_until) < now) {
    return null;
  }

  return discountCode;
}

/**
 * Check if a discount code grants free access
 */
export async function checkFreeAccessCode(
  webinarId: string,
  code: string
): Promise<DiscountCode | null> {
  const discountCode = await validateDiscountCode(webinarId, code);

  if (!discountCode) return null;
  if (!discountCode.allows_free_access) return null;

  return discountCode;
}

/**
 * Get all free access codes for a webinar
 */
export async function getFreeAccessCodes(webinarId: string): Promise<DiscountCode[]> {
  const codes = await getWebinarDiscountCodes(webinarId);
  return codes.filter((code) => code.is_active && code.allows_free_access);
}

/**
 * Get active discount codes to show during webinar
 */
export async function getActiveDiscountCodes(
  webinarId: string,
  minutesSinceStart?: number
): Promise<DiscountCode[]> {
  const codes = await getWebinarDiscountCodes(webinarId);
  const now = new Date();

  return codes.filter((code) => {
    if (!code.is_active) return false;

    // Check max uses
    if (code.max_uses && code.times_used >= code.max_uses) return false;

    // Check validity period
    if (code.valid_from && new Date(code.valid_from) > now) return false;
    if (code.valid_until && new Date(code.valid_until) < now) return false;

    // Check show_at_minutes
    if (minutesSinceStart !== undefined && code.show_at_minutes) {
      if (minutesSinceStart < code.show_at_minutes) return false;
    }

    return true;
  });
}
