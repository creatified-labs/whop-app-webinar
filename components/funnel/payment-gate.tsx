'use client';

import Link from 'next/link';
import { CreditCard, Lock, ArrowRight, Clock } from 'lucide-react';
import { formatPrice } from '@/lib/whop/checkout';

interface PaymentGateProps {
  webinarSlug: string;
  registrationId: string;
  webinarTitle: string;
  priceCents: number;
  paymentStatus: 'pending' | 'not_required';
}

/**
 * Payment Gate Component
 * Shows when a user has registered but payment is still pending
 */
export function PaymentGate({
  webinarSlug,
  registrationId,
  webinarTitle,
  priceCents,
  paymentStatus,
}: PaymentGateProps) {
  const checkoutUrl = `/webinar/${webinarSlug}/checkout?registration_id=${registrationId}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-funnel-bg-base p-4">
      <div className="w-full max-w-md">
        <div className="rounded-funnel-2xl bg-funnel-bg-card p-8 shadow-funnel-lg ring-1 ring-funnel-border">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-amber-500/10 p-4 ring-1 ring-amber-500/20">
              <Lock className="h-8 w-8 text-amber-500" />
            </div>
          </div>

          {/* Title */}
          <h1 className="mb-2 text-center text-2xl font-bold text-funnel-text-primary">
            Complete Your Registration
          </h1>

          {/* Subtitle */}
          <p className="mb-6 text-center text-funnel-text-secondary">
            Finalize your purchase to access the webinar
          </p>

          {/* Webinar Info */}
          <div className="mb-6 rounded-funnel-lg bg-funnel-bg-elevated p-4">
            <h2 className="mb-1 font-semibold text-funnel-text-primary">{webinarTitle}</h2>
            <div className="flex items-center justify-between">
              <span className="text-sm text-funnel-text-muted">Registration Price</span>
              <span className="text-lg font-bold text-funnel-text-primary">
                {formatPrice(priceCents)}
              </span>
            </div>
          </div>

          {/* Payment Status */}
          {paymentStatus === 'pending' && (
            <div className="mb-6 flex items-center gap-2 rounded-funnel-lg bg-amber-500/10 px-4 py-3 text-amber-600 ring-1 ring-amber-500/20">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Payment pending - complete checkout to access</span>
            </div>
          )}

          {/* CTA Button */}
          <Link
            href={checkoutUrl}
            className="funnel-shimmer group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-funnel-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 text-base font-semibold text-white shadow-funnel-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-funnel-glow"
          >
            <CreditCard className="h-5 w-5" />
            Complete Purchase
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          {/* Security Note */}
          <p className="mt-4 text-center text-xs text-funnel-text-muted">
            Secure checkout powered by Whop
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Payment Required Banner
 * Shows at the top of a page when payment is needed
 */
export function PaymentRequiredBanner({
  webinarSlug,
  registrationId,
  priceCents,
}: {
  webinarSlug: string;
  registrationId: string;
  priceCents: number;
}) {
  const checkoutUrl = `/webinar/${webinarSlug}/checkout?registration_id=${registrationId}`;

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          <span className="text-sm font-medium">
            Complete your payment ({formatPrice(priceCents)}) to access this webinar
          </span>
        </div>
        <Link
          href={checkoutUrl}
          className="rounded-lg bg-white/20 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-white/30"
        >
          Pay Now
        </Link>
      </div>
    </div>
  );
}
