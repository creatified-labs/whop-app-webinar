import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, CreditCard, Lock, Shield, Check } from 'lucide-react';
import { getWebinarBySlug } from '@/lib/data/webinars';
import { getRegistrationById } from '@/lib/data/registrations';
import { generateCheckoutUrl, formatPrice } from '@/lib/whop/checkout';

interface CheckoutPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ registration_id?: string; cancelled?: string }>;
}

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { slug } = await params;
  const webinar = await getWebinarBySlug(slug);

  if (!webinar) {
    return { title: 'Checkout - Webinar Not Found' };
  }

  return {
    title: `Checkout - ${webinar.title}`,
    description: `Complete your registration for ${webinar.title}`,
  };
}

/**
 * Checkout Page
 * Pre-checkout confirmation before redirecting to Whop payment
 */
export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const { slug } = await params;
  const { registration_id, cancelled } = await searchParams;

  const webinar = await getWebinarBySlug(slug);
  if (!webinar) {
    notFound();
  }

  // Ensure webinar is paid
  if (!webinar.is_paid || !webinar.price_cents || !webinar.whop_plan_id) {
    redirect(`/webinar/${slug}`);
  }

  // Validate registration exists
  if (!registration_id) {
    redirect(`/webinar/${slug}/register`);
  }

  const registration = await getRegistrationById(registration_id);
  if (!registration || registration.webinar_id !== webinar.id) {
    redirect(`/webinar/${slug}/register`);
  }

  // If already paid, redirect to watch
  if (registration.payment_status === 'completed') {
    redirect(`/webinar/${slug}/watch?email=${encodeURIComponent(registration.email)}`);
  }

  // If not pending payment, redirect to register
  if (registration.payment_status !== 'pending') {
    redirect(`/webinar/${slug}/register`);
  }

  // Calculate display prices
  const originalPrice = webinar.price_cents;
  const finalPrice = registration.payment_amount_cents || originalPrice;
  const discount = registration.discount_amount_cents || 0;
  const hasDiscount = discount > 0;

  // Generate Whop checkout URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const checkoutUrl = generateCheckoutUrl(webinar.whop_plan_id, {
    email: registration.email,
    name: registration.name || undefined,
    redirectUrl: `${baseUrl}/webinar/${slug}/payment-complete?registration_id=${registration_id}`,
    metadata: {
      registration_id: registration_id,
      webinar_id: webinar.id,
      webinar_slug: slug,
    },
  });

  return (
    <div className="min-h-screen bg-funnel-bg-base">
      {/* Header */}
      <div className="border-b border-funnel-border bg-funnel-bg-card">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link
            href={`/webinar/${slug}`}
            className="inline-flex items-center gap-2 text-sm text-funnel-text-muted hover:text-funnel-text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to webinar
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Cancelled Warning */}
        {cancelled && (
          <div className="mb-6 rounded-funnel-lg bg-amber-500/10 px-4 py-3 text-amber-600 ring-1 ring-amber-500/20">
            <p className="text-sm">
              Your checkout was cancelled. You can try again when you&apos;re ready.
            </p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: Order Summary */}
          <div className="rounded-funnel-2xl bg-funnel-bg-card p-6 ring-1 ring-funnel-border">
            <h1 className="mb-6 text-2xl font-bold text-funnel-text-primary">
              Complete Your Registration
            </h1>

            {/* Webinar Info */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-funnel-text-primary">{webinar.title}</h2>
              {webinar.description && (
                <p className="mt-2 text-sm text-funnel-text-secondary line-clamp-2">
                  {webinar.description}
                </p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 border-t border-funnel-border pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-funnel-text-muted">Registration</span>
                <span className="text-funnel-text-primary">{formatPrice(originalPrice)}</span>
              </div>

              {hasDiscount && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-500">Discount</span>
                  <span className="text-green-500">-{formatPrice(discount)}</span>
                </div>
              )}

              <div className="flex justify-between border-t border-funnel-border pt-3 text-lg font-bold">
                <span className="text-funnel-text-primary">Total</span>
                <span className="text-funnel-text-primary">{formatPrice(finalPrice)}</span>
              </div>
            </div>

            {/* Registration Details */}
            <div className="mt-6 rounded-funnel-lg bg-funnel-bg-elevated p-4">
              <p className="text-xs text-funnel-text-muted">Registering as</p>
              <p className="font-medium text-funnel-text-primary">{registration.email}</p>
              {registration.name && (
                <p className="text-sm text-funnel-text-secondary">{registration.name}</p>
              )}
            </div>
          </div>

          {/* Right: Checkout CTA */}
          <div className="flex flex-col justify-center">
            <div className="rounded-funnel-2xl bg-funnel-bg-card p-6 ring-1 ring-funnel-border">
              {/* Security Badge */}
              <div className="mb-6 flex items-center gap-2 text-funnel-text-muted">
                <Shield className="h-5 w-5 text-green-500" />
                <span className="text-sm">Secure checkout powered by Whop</span>
              </div>

              {/* What You Get */}
              <div className="mb-6 space-y-2">
                <p className="text-sm font-medium text-funnel-text-primary">What you&apos;ll get:</p>
                <ul className="space-y-2 text-sm text-funnel-text-secondary">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Full access to the live webinar
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Replay access after the event
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Confirmation and reminder emails
                  </li>
                </ul>
              </div>

              {/* Checkout Button */}
              <a
                href={checkoutUrl}
                className="funnel-shimmer group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-funnel-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 text-base font-semibold text-white shadow-funnel-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-funnel-glow"
              >
                <CreditCard className="h-5 w-5" />
                Pay {formatPrice(finalPrice)}
                <Lock className="h-4 w-4" />
              </a>

              <p className="mt-4 text-center text-xs text-funnel-text-muted">
                You&apos;ll be redirected to Whop&apos;s secure checkout to complete your payment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
