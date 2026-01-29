"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Mail, User } from "lucide-react";
import { registerForWebinar } from "@/app/actions/registration";
import { isValidEmail } from "@/lib/utils";

interface RegistrationFormProps {
  slug: string;
  ctaText?: string | null;
}

/**
 * Registration Form
 * Premium form with floating labels and gradient CTA
 */
export function RegistrationForm({ slug, ctaText }: RegistrationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    startTransition(async () => {
      const result = await registerForWebinar(slug, {
        email: email.trim(),
        name: name.trim() || undefined,
      });

      if (result.success) {
        router.push(
          `/webinar/${slug}/success?email=${encodeURIComponent(email)}`
        );
      } else {
        setError(result.error || "Registration failed. Please try again.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        {/* Email Input with Icon */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Mail className="h-5 w-5 text-funnel-text-muted" />
          </div>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isPending}
            className="w-full rounded-funnel-xl border border-funnel-border bg-funnel-bg-elevated/50 py-3.5 pl-12 pr-4 text-base text-funnel-text-primary placeholder-funnel-text-muted transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50"
          />
          <label
            htmlFor="email"
            className="absolute -top-2 left-3 bg-funnel-bg-card px-1 text-xs font-medium text-funnel-text-muted"
          >
            Email
          </label>
        </div>

        {/* Name Input with Icon */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <User className="h-5 w-5 text-funnel-text-muted" />
          </div>
          <input
            id="name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            className="w-full rounded-funnel-xl border border-funnel-border bg-funnel-bg-elevated/50 py-3.5 pl-12 pr-4 text-base text-funnel-text-primary placeholder-funnel-text-muted transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50"
          />
          <label
            htmlFor="name"
            className="absolute -top-2 left-3 bg-funnel-bg-card px-1 text-xs font-medium text-funnel-text-muted"
          >
            Name (optional)
          </label>
        </div>
      </div>

      {error && (
        <div className="rounded-funnel-lg bg-red-500/10 px-4 py-2 ring-1 ring-red-500/20">
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
              {ctaText || "Register Now"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </span>
      </button>
    </form>
  );
}

interface InlineRegistrationFormProps {
  slug: string;
  ctaText?: string | null;
}

/**
 * Inline Registration Form
 * Premium compact form for hero sections
 */
export function InlineRegistrationForm({
  slug,
  ctaText,
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

      if (result.success) {
        router.push(
          `/webinar/${slug}/success?email=${encodeURIComponent(email)}`
        );
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
            className="w-full rounded-funnel-xl border border-funnel-border bg-funnel-bg-elevated/50 py-3.5 pl-12 pr-4 text-base text-funnel-text-primary placeholder-funnel-text-muted transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50"
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
                {ctaText || "Reserve Your Spot"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </span>
        </button>
      </div>

      {error && (
        <div className="rounded-funnel-lg bg-red-500/10 px-4 py-2 ring-1 ring-red-500/20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Trust indicator */}
      <p className="text-center text-xs text-funnel-text-muted">
        Join thousands of attendees. Free to register.
      </p>
    </form>
  );
}
