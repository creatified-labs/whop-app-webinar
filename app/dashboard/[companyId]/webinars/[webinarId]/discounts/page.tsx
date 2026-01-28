import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { whopsdk } from '@/lib/whop-sdk';
import { getWebinarById } from '@/lib/data/webinars';
import {
  getWebinarDiscountCodes,
  createDiscountCode,
  toggleDiscountCodeActive,
  deleteDiscountCode,
} from '@/lib/data/discounts';
import { DiscountManager } from '@/components/dashboard/discount-manager';
import type { DiscountType } from '@/types/database';

interface DiscountsPageProps {
  params: Promise<{ companyId: string; webinarId: string }>;
}

/**
 * Discounts Page
 * Create and manage discount codes
 */
export default async function DiscountsPage({ params }: DiscountsPageProps) {
  const { companyId, webinarId } = await params;

  // Verify user
  await whopsdk.verifyUserToken(await headers());

  // Get webinar
  const webinar = await getWebinarById(webinarId);
  if (!webinar) {
    notFound();
  }

  // Get discount codes
  const discounts = await getWebinarDiscountCodes(webinarId);

  // Server actions
  async function handleCreateDiscount(data: {
    code: string;
    description?: string;
    discount_type: DiscountType;
    discount_value: number;
    max_uses?: number;
    valid_from?: string;
    valid_until?: string;
    show_at_minutes?: number;
    auto_apply_url?: string;
  }) {
    'use server';
    await createDiscountCode(webinarId, {
      code: data.code,
      description: data.description ?? null,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      max_uses: data.max_uses ?? null,
      valid_from: data.valid_from ?? null,
      valid_until: data.valid_until ?? null,
      show_at_minutes: data.show_at_minutes ?? null,
      auto_apply_url: data.auto_apply_url ?? null,
      is_active: true,
      times_used: 0,
    });
  }

  async function handleToggleActive(discountId: string) {
    'use server';
    await toggleDiscountCodeActive(discountId);
  }

  async function handleDeleteDiscount(discountId: string) {
    'use server';
    await deleteDiscountCode(discountId);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/${companyId}/webinars/${webinarId}`}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Webinar
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Discount Codes</h1>
        <p className="mt-1 text-gray-500">
          {webinar.title} &bull; {discounts.length} codes
        </p>
      </div>

      {/* Discount Manager */}
      <DiscountManager
        discounts={discounts}
        webinarId={webinarId}
        onCreateDiscount={handleCreateDiscount}
        onToggleActive={handleToggleActive}
        onDeleteDiscount={handleDeleteDiscount}
      />
    </div>
  );
}
