/**
 * Payments Data Functions
 * Handle payment verification and status updates for paid webinars
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { Registration, PaymentStatus } from '@/types/database';

// ============================================
// Payment Verification
// ============================================

/**
 * Check if a registration has completed payment
 */
export async function hasCompletedPayment(registrationId: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('registrations')
    .select('payment_status')
    .eq('id', registrationId)
    .single();

  if (error) {
    throw new Error(`Failed to check payment status: ${error.message}`);
  }

  return data.payment_status === 'completed' || data.payment_status === 'not_required';
}

/**
 * Check if a registration can access the webinar
 * Returns true if payment is not required OR payment is completed
 */
export async function canAccessWebinar(registrationId: string): Promise<boolean> {
  return hasCompletedPayment(registrationId);
}

/**
 * Get registration payment details
 */
export async function getRegistrationPaymentDetails(
  registrationId: string
): Promise<Pick<Registration, 'payment_status' | 'payment_amount_cents' | 'whop_payment_id' | 'discount_code_id' | 'discount_amount_cents' | 'paid_at'> | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('registrations')
    .select('payment_status, payment_amount_cents, whop_payment_id, discount_code_id, discount_amount_cents, paid_at')
    .eq('id', registrationId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get payment details: ${error.message}`);
  }

  return data;
}

// ============================================
// Payment Status Updates
// ============================================

/**
 * Mark a registration as payment pending
 */
export async function markPaymentPending(
  registrationId: string,
  amountCents: number,
  discountCodeId?: string,
  discountAmountCents?: number
): Promise<Registration> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('registrations')
    .update({
      payment_status: 'pending' as PaymentStatus,
      payment_amount_cents: amountCents,
      discount_code_id: discountCodeId || null,
      discount_amount_cents: discountAmountCents || 0,
    })
    .eq('id', registrationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to mark payment pending: ${error.message}`);
  }

  return data;
}

/**
 * Mark a registration as payment completed
 */
export async function markPaymentCompleted(
  registrationId: string,
  whopPaymentId: string,
  whopMembershipId?: string
): Promise<Registration> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('registrations')
    .update({
      payment_status: 'completed' as PaymentStatus,
      whop_payment_id: whopPaymentId,
      whop_membership_id: whopMembershipId || null,
      paid_at: new Date().toISOString(),
    })
    .eq('id', registrationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to mark payment completed: ${error.message}`);
  }

  return data;
}

/**
 * Mark a registration as payment refunded
 */
export async function markPaymentRefunded(registrationId: string): Promise<Registration> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('registrations')
    .update({
      payment_status: 'refunded' as PaymentStatus,
    })
    .eq('id', registrationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to mark payment refunded: ${error.message}`);
  }

  return data;
}

/**
 * Grant free access to a registration (mark as completed without payment)
 */
export async function grantFreeAccess(
  registrationId: string,
  discountCodeId: string
): Promise<Registration> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('registrations')
    .update({
      payment_status: 'completed' as PaymentStatus,
      payment_amount_cents: 0,
      discount_code_id: discountCodeId,
      discount_amount_cents: 0, // Full discount
      paid_at: new Date().toISOString(),
    })
    .eq('id', registrationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to grant free access: ${error.message}`);
  }

  return data;
}

// ============================================
// Payment Queries
// ============================================

/**
 * Find registration by Whop payment ID
 */
export async function getRegistrationByWhopPaymentId(
  whopPaymentId: string
): Promise<Registration | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('whop_payment_id', whopPaymentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to find registration by payment ID: ${error.message}`);
  }

  return data;
}

/**
 * Get registrations with pending payments for a webinar
 */
export async function getPendingPayments(webinarId: string): Promise<Registration[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('webinar_id', webinarId)
    .eq('payment_status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get pending payments: ${error.message}`);
  }

  return data;
}

/**
 * Get payment statistics for a webinar
 */
export async function getWebinarPaymentStats(webinarId: string): Promise<{
  totalRegistrations: number;
  paidRegistrations: number;
  pendingPayments: number;
  totalRevenue: number;
  totalDiscounts: number;
}> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('registrations')
    .select('payment_status, payment_amount_cents, discount_amount_cents')
    .eq('webinar_id', webinarId);

  if (error) {
    throw new Error(`Failed to get payment stats: ${error.message}`);
  }

  const stats = {
    totalRegistrations: data.length,
    paidRegistrations: data.filter(r => r.payment_status === 'completed').length,
    pendingPayments: data.filter(r => r.payment_status === 'pending').length,
    totalRevenue: data
      .filter(r => r.payment_status === 'completed')
      .reduce((sum, r) => sum + (r.payment_amount_cents || 0), 0),
    totalDiscounts: data
      .filter(r => r.payment_status === 'completed')
      .reduce((sum, r) => sum + (r.discount_amount_cents || 0), 0),
  };

  return stats;
}

/**
 * Calculate final price after discount
 */
export function calculateFinalPrice(
  basePriceCents: number,
  discountType: 'percentage' | 'fixed',
  discountValue: number
): { finalPriceCents: number; discountAmountCents: number } {
  let discountAmountCents: number;

  if (discountType === 'percentage') {
    discountAmountCents = Math.round((basePriceCents * discountValue) / 100);
  } else {
    discountAmountCents = Math.min(discountValue, basePriceCents);
  }

  const finalPriceCents = Math.max(0, basePriceCents - discountAmountCents);

  return { finalPriceCents, discountAmountCents };
}
