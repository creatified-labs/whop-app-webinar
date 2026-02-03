/**
 * Whop Checkout Integration
 * Create and manage checkout sessions for paid webinars
 */

import { whopsdk } from '@/lib/whop-sdk';

export interface CreateCheckoutOptions {
  planId: string;
  registrationId: string;
  webinarSlug: string;
  email: string;
  name?: string | null;
  discountCode?: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSession {
  checkoutUrl: string;
  checkoutId: string;
}

/**
 * Create a Whop checkout session for a webinar registration
 */
export async function createCheckoutSession(
  options: CreateCheckoutOptions
): Promise<CheckoutSession> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Build redirect URLs
  const successUrl = `${baseUrl}/webinar/${options.webinarSlug}/payment-complete?registration_id=${options.registrationId}`;
  const cancelUrl = `${baseUrl}/webinar/${options.webinarSlug}/checkout?registration_id=${options.registrationId}&cancelled=true`;

  // Create checkout session through Whop SDK
  // Note: The exact API depends on the Whop SDK version
  // This uses the typical checkout link pattern
  const checkoutParams = new URLSearchParams({
    plan: options.planId,
    email: options.email,
    redirect_url: successUrl,
    metadata: JSON.stringify({
      registration_id: options.registrationId,
      webinar_slug: options.webinarSlug,
      ...options.metadata,
    }),
  });

  if (options.name) {
    checkoutParams.set('name', options.name);
  }

  if (options.discountCode) {
    checkoutParams.set('coupon', options.discountCode);
  }

  // Construct the checkout URL
  // Whop checkout URLs typically follow this pattern
  const checkoutUrl = `https://whop.com/checkout/${options.planId}?${checkoutParams.toString()}`;

  return {
    checkoutUrl,
    checkoutId: `checkout_${options.registrationId}`,
  };
}

/**
 * Generate a direct checkout URL for a plan
 * This is a simpler approach that redirects directly to Whop checkout
 */
export function generateCheckoutUrl(
  planId: string,
  options?: {
    email?: string;
    name?: string;
    redirectUrl?: string;
    metadata?: Record<string, string>;
  }
): string {
  const params = new URLSearchParams();

  if (options?.email) {
    params.set('email', options.email);
  }

  if (options?.name) {
    params.set('name', options.name);
  }

  if (options?.redirectUrl) {
    params.set('redirect_url', options.redirectUrl);
  }

  if (options?.metadata) {
    params.set('metadata', JSON.stringify(options.metadata));
  }

  const queryString = params.toString();
  return queryString
    ? `https://whop.com/checkout/${planId}?${queryString}`
    : `https://whop.com/checkout/${planId}`;
}

/**
 * Verify a payment from webhook data
 */
export interface PaymentWebhookData {
  id: string;
  status: string;
  amount: number;
  currency: string;
  customer_email?: string;
  membership_id?: string;
  metadata?: Record<string, string>;
}

/**
 * Extract registration ID from payment webhook metadata
 */
export function extractRegistrationId(metadata: Record<string, unknown> | undefined): string | null {
  if (!metadata) return null;

  // Try direct registration_id
  if (typeof metadata.registration_id === 'string') {
    return metadata.registration_id;
  }

  // Try parsing metadata if it's a JSON string
  if (typeof metadata.metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata.metadata);
      if (typeof parsed.registration_id === 'string') {
        return parsed.registration_id;
      }
    } catch {
      // Ignore parse errors
    }
  }

  return null;
}

/**
 * Format price from cents to display string
 */
export function formatPrice(cents: number, currency: string = 'USD'): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Parse price string to cents
 */
export function parsePrice(priceString: string): number {
  // Remove currency symbols and whitespace
  const cleaned = priceString.replace(/[^0-9.]/g, '');
  const amount = parseFloat(cleaned);

  if (isNaN(amount)) {
    return 0;
  }

  // Convert to cents
  return Math.round(amount * 100);
}
