"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Mail, User, Tag, CreditCard, Check, Phone, FileText } from "lucide-react";
import { registerForWebinar, validateDiscountCodeAction } from "@/app/actions/registration";
import { isValidEmail } from "@/lib/utils";
import { formatPrice } from "@/lib/whop/checkout";
import type { RegistrationField } from "@/types/database";

interface RegistrationFormProps {
  slug: string;
  ctaText?: string | null;
  isPaid?: boolean;
  priceCents?: number | null;
  allowFreeWithCode?: boolean;
  registrationFields?: RegistrationField[];
}

/**
 * Registration Form
 * Premium form with floating labels and gradient CTA
 */
// Default registration fields if none provided
const defaultRegistrationFields: RegistrationField[] = [
  { id: 'email', type: 'email', label: 'Email Address', required: true },
  { id: 'name', type: 'name', label: 'Full Name', required: false },
];

export function RegistrationForm({
  slug,
  ctaText,
  isPaid = false,
  priceCents,
  allowFreeWithCode = false,
  registrationFields = defaultRegistrationFields,
}: RegistrationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    grantsFreeAccess: boolean;
  } | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);

  // Get custom fields (excluding built-in types)
  const customFieldsList = registrationFields.filter(
    (f) => !['email', 'name', 'phone'].includes(f.type)
  );

  // Check if phone is in registration fields
  const phoneField = registrationFields.find((f) => f.type === 'phone');
  const nameField = registrationFields.find((f) => f.type === 'name');
  const emailField = registrationFields.find((f) => f.type === 'email');

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setCustomFields((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;

    setDiscountError(null);
    setIsValidatingCode(true);

    try {
      const result = await validateDiscountCodeAction(slug, discountCode.trim());

      if (result.success && result.data) {
        setAppliedDiscount({
          code: result.data.code,
          type: result.data.discount_type,
          value: result.data.discount_value,
          grantsFreeAccess: result.data.allows_free_access,
        });
        setDiscountError(null);
      } else {
        setDiscountError(result.error || "Invalid discount code");
        setAppliedDiscount(null);
      }
    } catch {
      setDiscountError("Failed to validate code");
      setAppliedDiscount(null);
    } finally {
      setIsValidatingCode(false);
    }
  };

  const calculateFinalPrice = () => {
    if (!priceCents) return 0;
    if (appliedDiscount?.grantsFreeAccess) return 0;
    if (!appliedDiscount) return priceCents;

    if (appliedDiscount.type === 'percentage') {
      return Math.round(priceCents * (1 - appliedDiscount.value / 100));
    } else {
      return Math.max(0, priceCents - appliedDiscount.value);
    }
  };

  const finalPrice = calculateFinalPrice();
  const hasDiscount = appliedDiscount && finalPrice < (priceCents || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Validate name if required
    if (nameField?.required && !name.trim()) {
      setError(`Please enter your ${nameField.label.toLowerCase()}`);
      return;
    }

    // Validate phone if required
    if (phoneField?.required && !phone.trim()) {
      setError(`Please enter your ${phoneField.label.toLowerCase()}`);
      return;
    }

    // Validate custom required fields
    for (const field of customFieldsList) {
      if (field.required && !customFields[field.id]?.trim()) {
        setError(`Please fill in ${field.label}`);
        return;
      }
    }

    startTransition(async () => {
      const result = await registerForWebinar(slug, {
        email: email.trim(),
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        custom_fields: Object.keys(customFields).length > 0 ? customFields : undefined,
        discount_code: appliedDiscount?.code,
      });

      if (result.success && result.data) {
        // For paid webinars, redirect based on payment status
        if (isPaid && result.data.payment_status === 'pending') {
          router.push(`/webinar/${slug}/checkout?registration_id=${result.data.id}`);
        } else {
          router.push(`/webinar/${slug}/success?email=${encodeURIComponent(email)}`);
        }
      } else {
        setError(result.error || "Registration failed. Please try again.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Price Display for Paid Webinars */}
      {isPaid && priceCents && (
        <div className="glass-depth shadow-glass-sm rounded-funnel-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-funnel-text-muted">Registration Price</span>
            <div className="text-right">
              {hasDiscount ? (
                <>
                  <span className="text-sm text-funnel-text-muted line-through">
                    {formatPrice(priceCents)}
                  </span>
                  <span className="ml-2 text-lg font-bold text-green-500">
                    {finalPrice === 0 ? 'FREE' : formatPrice(finalPrice)}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-funnel-text-primary">
                  {formatPrice(priceCents)}
                </span>
              )}
            </div>
          </div>
          {appliedDiscount && (
            <div className="mt-2 flex items-center gap-1 text-sm text-green-500">
              <Check className="h-4 w-4" />
              <span>
                {appliedDiscount.grantsFreeAccess
                  ? 'Free access code applied!'
                  : `${appliedDiscount.type === 'percentage' ? `${appliedDiscount.value}%` : formatPrice(appliedDiscount.value)} discount applied`}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {/* Email Input with Icon */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Mail className="h-5 w-5 text-funnel-text-muted" />
          </div>
          <input
            id="email"
            type="email"
            placeholder={emailField?.placeholder || "you@example.com"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isPending}
            className="w-full rounded-funnel-xl border border-funnel-border/50 glass-light py-3.5 pl-12 pr-4 text-base text-funnel-text-primary placeholder-funnel-text-muted transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:glass disabled:opacity-50"
          />
          <label
            htmlFor="email"
            className="absolute -top-2 left-3 bg-funnel-bg-card px-1 text-xs font-medium text-funnel-text-muted"
          >
            {emailField?.label || "Email"}
          </label>
        </div>

        {/* Name Input with Icon */}
        {nameField && (
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <User className="h-5 w-5 text-funnel-text-muted" />
            </div>
            <input
              id="name"
              type="text"
              placeholder={nameField.placeholder || "Your name"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={nameField.required}
              disabled={isPending}
              className="w-full rounded-funnel-xl border border-funnel-border/50 glass-light py-3.5 pl-12 pr-4 text-base text-funnel-text-primary placeholder-funnel-text-muted transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:glass disabled:opacity-50"
            />
            <label
              htmlFor="name"
              className="absolute -top-2 left-3 bg-funnel-bg-card px-1 text-xs font-medium text-funnel-text-muted"
            >
              {nameField.label}{!nameField.required && " (optional)"}
            </label>
          </div>
        )}

        {/* Phone Input with Icon */}
        {phoneField && (
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Phone className="h-5 w-5 text-funnel-text-muted" />
            </div>
            <input
              id="phone"
              type="tel"
              placeholder={phoneField.placeholder || "Your phone number"}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required={phoneField.required}
              disabled={isPending}
              className="w-full rounded-funnel-xl border border-funnel-border/50 glass-light py-3.5 pl-12 pr-4 text-base text-funnel-text-primary placeholder-funnel-text-muted transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:glass disabled:opacity-50"
            />
            <label
              htmlFor="phone"
              className="absolute -top-2 left-3 bg-funnel-bg-card px-1 text-xs font-medium text-funnel-text-muted"
            >
              {phoneField.label}{!phoneField.required && " (optional)"}
            </label>
          </div>
        )}

        {/* Custom Fields */}
        {customFieldsList.map((field) => (
          <div key={field.id} className="relative">
            {field.type === 'select' ? (
              <>
                <select
                  id={field.id}
                  value={customFields[field.id] || ""}
                  onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                  required={field.required}
                  disabled={isPending}
                  className="w-full rounded-funnel-xl border border-funnel-border/50 glass-light py-3.5 px-4 text-base text-funnel-text-primary transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:glass disabled:opacity-50"
                >
                  <option value="">{field.placeholder || `Select ${field.label.toLowerCase()}`}</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <label
                  htmlFor={field.id}
                  className="absolute -top-2 left-3 bg-funnel-bg-card px-1 text-xs font-medium text-funnel-text-muted"
                >
                  {field.label}{!field.required && " (optional)"}
                </label>
              </>
            ) : field.type === 'textarea' ? (
              <>
                <textarea
                  id={field.id}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  value={customFields[field.id] || ""}
                  onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                  required={field.required}
                  disabled={isPending}
                  rows={3}
                  className="w-full rounded-funnel-xl border border-funnel-border/50 glass-light py-3.5 px-4 text-base text-funnel-text-primary placeholder-funnel-text-muted transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:glass disabled:opacity-50 resize-none"
                />
                <label
                  htmlFor={field.id}
                  className="absolute -top-2 left-3 bg-funnel-bg-card px-1 text-xs font-medium text-funnel-text-muted"
                >
                  {field.label}{!field.required && " (optional)"}
                </label>
              </>
            ) : (
              <>
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <FileText className="h-5 w-5 text-funnel-text-muted" />
                </div>
                <input
                  id={field.id}
                  type="text"
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  value={customFields[field.id] || ""}
                  onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                  required={field.required}
                  disabled={isPending}
                  className="w-full rounded-funnel-xl border border-funnel-border/50 glass-light py-3.5 pl-12 pr-4 text-base text-funnel-text-primary placeholder-funnel-text-muted transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:glass disabled:opacity-50"
                />
                <label
                  htmlFor={field.id}
                  className="absolute -top-2 left-3 bg-funnel-bg-card px-1 text-xs font-medium text-funnel-text-muted"
                >
                  {field.label}{!field.required && " (optional)"}
                </label>
              </>
            )}
          </div>
        ))}

        {/* Discount Code Input for Paid Webinars */}
        {isPaid && allowFreeWithCode && (
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Tag className="h-5 w-5 text-funnel-text-muted" />
                </div>
                <input
                  type="text"
                  placeholder="Discount code"
                  value={discountCode}
                  onChange={(e) => {
                    setDiscountCode(e.target.value.toUpperCase());
                    if (appliedDiscount) setAppliedDiscount(null);
                  }}
                  disabled={isPending || isValidatingCode}
                  className="w-full rounded-funnel-xl border border-funnel-border/50 glass-light py-3.5 pl-12 pr-4 text-base text-funnel-text-primary placeholder-funnel-text-muted transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:glass disabled:opacity-50"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyDiscount}
                disabled={isPending || isValidatingCode || !discountCode.trim()}
                className="rounded-funnel-xl glass px-4 py-3.5 text-sm font-medium text-funnel-text-primary transition-all hover:glass-heavy hover:shadow-glass-sm disabled:opacity-50"
              >
                {isValidatingCode ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Apply'
                )}
              </button>
            </div>
            {discountError && (
              <p className="mt-1 text-xs text-red-400">{discountError}</p>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="glass-light rounded-funnel-lg bg-red-500/10 px-4 py-2 ring-1 ring-red-500/20 shadow-glass-sm">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Premium Gradient CTA Button */}
      <button
        type="submit"
        disabled={isPending}
        className="funnel-shimmer group relative w-full overflow-hidden rounded-funnel-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 text-base font-semibold text-white shadow-funnel-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-funnel-glow focus:outline-none focus:ring-4 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
      >
        <span className="relative flex items-center justify-center gap-2">
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Registering...
            </>
          ) : (
            <>
              {isPaid && finalPrice > 0 ? (
                <>
                  <CreditCard className="h-5 w-5" />
                  {ctaText || `Register for ${formatPrice(finalPrice)}`}
                </>
              ) : (
                <>
                  {ctaText || "Register Now"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </>
          )}
        </span>
      </button>

      {/* Trust indicator */}
      {!isPaid && (
        <p className="text-center text-xs text-funnel-text-muted">
          Join thousands of attendees. Free to register.
        </p>
      )}
      {isPaid && (
        <p className="text-center text-xs text-funnel-text-muted">
          Secure checkout powered by Whop
        </p>
      )}
    </form>
  );
}

interface InlineRegistrationFormProps {
  slug: string;
  ctaText?: string | null;
  isPaid?: boolean;
  priceCents?: number | null;
}

/**
 * Inline Registration Form
 * Premium compact form for hero sections
 */
export function InlineRegistrationForm({
  slug,
  ctaText,
  isPaid = false,
  priceCents,
}: InlineRegistrationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Invalid email address");
      return;
    }

    startTransition(async () => {
      const result = await registerForWebinar(slug, {
        email: email.trim(),
      });

      if (result.success && result.data) {
        // For paid webinars, redirect based on payment status
        if (isPaid && result.data.payment_status === 'pending') {
          router.push(`/webinar/${slug}/checkout?registration_id=${result.data.id}`);
        } else {
          router.push(`/webinar/${slug}/success?email=${encodeURIComponent(email)}`);
        }
      } else {
        setError(result.error || "Registration failed");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Email Input */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Mail className="h-5 w-5 text-funnel-text-muted" />
          </div>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
            className="w-full rounded-funnel-xl border border-funnel-border/50 glass-light py-3.5 pl-12 pr-4 text-base text-funnel-text-primary placeholder-funnel-text-muted transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:glass disabled:opacity-50"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="funnel-shimmer group relative overflow-hidden whitespace-nowrap rounded-funnel-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-3.5 text-base font-semibold text-white shadow-funnel-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-funnel-glow focus:outline-none focus:ring-4 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <span className="relative flex items-center justify-center gap-2">
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="hidden sm:inline">Registering...</span>
              </>
            ) : (
              <>
                {isPaid && priceCents ? (
                  <>
                    <CreditCard className="h-5 w-5" />
                    {ctaText || formatPrice(priceCents)}
                  </>
                ) : (
                  <>
                    {ctaText || "Reserve Your Spot"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </>
            )}
          </span>
        </button>
      </div>

      {error && (
        <div className="glass-light rounded-funnel-lg bg-red-500/10 px-4 py-2 ring-1 ring-red-500/20 shadow-glass-sm">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Trust indicator */}
      <p className="text-center text-xs text-funnel-text-muted">
        {isPaid
          ? "Secure checkout powered by Whop"
          : "Join thousands of attendees. Free to register."}
      </p>
    </form>
  );
}
