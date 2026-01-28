'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@whop/react/components';
import { registerForWebinar } from '@/app/actions/registration';
import { isValidEmail } from '@/lib/utils';

interface RegistrationFormProps {
  slug: string;
  ctaText?: string | null;
}

/**
 * Registration Form
 * Email/name capture form with validation
 */
export function RegistrationForm({ slug, ctaText }: RegistrationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    startTransition(async () => {
      const result = await registerForWebinar(slug, {
        email: email.trim(),
        name: name.trim() || undefined,
      });

      if (result.success) {
        router.push(`/webinar/${slug}/success?email=${encodeURIComponent(email)}`);
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isPending}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:opacity-60"
          />
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name (optional)
          </label>
          <input
            id="name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:opacity-60"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Button
        type="submit"
        variant="solid"
        className="w-full"
        disabled={isPending}
      >
        {isPending ? 'Registering...' : (ctaText || 'Register Now')}
      </Button>
    </form>
  );
}

interface InlineRegistrationFormProps {
  slug: string;
  ctaText?: string | null;
}

/**
 * Inline Registration Form
 * Compact horizontal form for embedding in hero sections
 */
export function InlineRegistrationForm({ slug, ctaText }: InlineRegistrationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Invalid email address');
      return;
    }

    startTransition(async () => {
      const result = await registerForWebinar(slug, {
        email: email.trim(),
      });

      if (result.success) {
        router.push(`/webinar/${slug}/success?email=${encodeURIComponent(email)}`);
      } else {
        setError(result.error || 'Registration failed');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <Button
          type="submit"
          variant="solid"
          disabled={isPending}
          className="whitespace-nowrap px-6"
        >
          {isPending ? 'Registering...' : (ctaText || 'Register Now')}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </form>
  );
}
