'use client';

import { useState, useTransition } from 'react';
import { Building2, Upload, Loader2 } from 'lucide-react';
import { Card, Heading, Text, Button, Avatar } from '@whop/react/components';
import { updateCompanyProfile } from '@/app/actions/settings';
import type { Company } from '@/types/database';

interface CompanyProfileFormProps {
  company: Company;
  whopCompanyId: string;
}

export function CompanyProfileForm({ company, whopCompanyId }: CompanyProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(company.name);
  const [imageUrl, setImageUrl] = useState(company.image_url || '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasChanges = name !== company.name || imageUrl !== (company.image_url || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateCompanyProfile(whopCompanyId, {
        name,
        image_url: imageUrl || null,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <Card size="2">
      <div className="mb-4">
        <Heading size="4" weight="semi-bold">
          Company Profile
        </Heading>
        <Text size="2" color="gray" className="mt-0.5">
          Update your company&apos;s public information
        </Text>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Company Logo */}
        <div className="flex items-center gap-4">
          <Avatar
            size="5"
            src={imageUrl || undefined}
            fallback={name.charAt(0).toUpperCase()}
          />
          <div className="flex-1">
            <Text size="2" weight="medium" className="mb-1">
              Company Logo
            </Text>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full rounded-2 border border-gray-a6 bg-gray-1 px-3 py-2 text-2 text-gray-12 placeholder:text-gray-9 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8"
            />
            <Text size="1" color="gray" className="mt-1">
              Enter a URL for your company logo
            </Text>
          </div>
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-2 font-medium text-gray-12 mb-1">
            Company Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-2 border border-gray-a6 bg-gray-1 px-3 py-2 text-2 text-gray-12 placeholder:text-gray-9 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8"
          />
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Text size="2" color="red">
            {error}
          </Text>
        )}
        {success && (
          <Text size="2" color="green">
            Profile updated successfully
          </Text>
        )}

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            size="2"
            variant="solid"
            disabled={isPending || !hasChanges}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
}
