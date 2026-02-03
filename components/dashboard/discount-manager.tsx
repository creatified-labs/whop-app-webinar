'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Copy, Check, Gift, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@whop/react/components';
import { formatNumber, formatPercentage, formatCurrency } from '@/lib/utils';
import type { DiscountCode, DiscountType } from '@/types/database';

interface DiscountManagerProps {
  discounts: DiscountCode[];
  webinarId: string;
  onCreateDiscount: (data: {
    code: string;
    description?: string;
    discount_type: DiscountType;
    discount_value: number;
    max_uses?: number;
    valid_from?: string;
    valid_until?: string;
    show_at_minutes?: number;
    auto_apply_url?: string;
  }) => Promise<void>;
  onToggleActive: (discountId: string) => Promise<void>;
  onDeleteDiscount: (discountId: string) => Promise<void>;
}

/**
 * Discount Manager
 * Create and manage discount codes
 */
export function DiscountManager({
  discounts,
  webinarId,
  onCreateDiscount,
  onToggleActive,
  onDeleteDiscount,
}: DiscountManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const router = useRouter();

  // New discount form state
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState(10);
  const [maxUses, setMaxUses] = useState<number | undefined>(undefined);
  const [showAtMinutes, setShowAtMinutes] = useState<number | undefined>(undefined);

  const handleCreate = () => {
    if (!code.trim()) return;

    startTransition(async () => {
      await onCreateDiscount({
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        discount_type: discountType,
        discount_value: discountValue,
        max_uses: maxUses,
        show_at_minutes: showAtMinutes,
      });

      // Reset form
      setCode('');
      setDescription('');
      setDiscountType('percentage');
      setDiscountValue(10);
      setMaxUses(undefined);
      setShowAtMinutes(undefined);
      setIsCreating(false);
      router.refresh();
    });
  };

  const handleToggleActive = (discountId: string) => {
    startTransition(async () => {
      await onToggleActive(discountId);
      router.refresh();
    });
  };

  const handleDelete = (discountId: string) => {
    if (!confirm('Are you sure you want to delete this discount code?')) return;
    startTransition(async () => {
      await onDeleteDiscount(discountId);
      router.refresh();
    });
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDiscount = (type: DiscountType, value: number) => {
    return type === 'percentage'
      ? `${value}% off`
      : formatCurrency(value) + ' off';
  };

  return (
    <div className="space-y-6">
      {/* Create Button */}
      {!isCreating && (
        <Button variant="solid" onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Discount Code
        </Button>
      )}

      {/* Create Form */}
      {isCreating && (
        <div className="rounded-3 border border-gray-a4 bg-gray-a2 p-6">
          <h3 className="mb-4 font-semibold text-gray-12">New Discount Code</h3>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-2 font-medium text-gray-12">
                  Code *
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="SAVE20"
                  className="mt-1 w-full rounded-2 border border-gray-a6 bg-gray-1 px-4 py-2.5 uppercase text-gray-12 placeholder:text-gray-9 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8"
                />
              </div>

              <div>
                <label className="block text-2 font-medium text-gray-12">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Special launch discount"
                  className="mt-1 w-full rounded-2 border border-gray-a6 bg-gray-1 px-4 py-2.5 text-gray-12 placeholder:text-gray-9 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-2 font-medium text-gray-12">
                  Discount Type
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                  className="mt-1 w-full rounded-2 border border-gray-a6 bg-gray-1 px-4 py-2.5 text-gray-12 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>

              <div>
                <label className="block text-2 font-medium text-gray-12">
                  {discountType === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={discountType === 'percentage' ? 100 : undefined}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="mt-1 w-full rounded-2 border border-gray-a6 bg-gray-1 px-4 py-2.5 text-gray-12 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-2 font-medium text-gray-12">
                  Max Uses (optional)
                </label>
                <input
                  type="number"
                  min={1}
                  value={maxUses || ''}
                  onChange={(e) => setMaxUses(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Unlimited"
                  className="mt-1 w-full rounded-2 border border-gray-a6 bg-gray-1 px-4 py-2.5 text-gray-12 placeholder:text-gray-9 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8"
                />
              </div>

              <div>
                <label className="block text-2 font-medium text-gray-12">
                  Show after X minutes (optional)
                </label>
                <input
                  type="number"
                  min={0}
                  value={showAtMinutes || ''}
                  onChange={(e) => setShowAtMinutes(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Show immediately"
                  className="mt-1 w-full rounded-2 border border-gray-a6 bg-gray-1 px-4 py-2.5 text-gray-12 placeholder:text-gray-9 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="soft"
                onClick={() => setIsCreating(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="solid"
                onClick={handleCreate}
                disabled={isPending || !code.trim()}
              >
                Create Code
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Discount List */}
      <div className="space-y-4">
        {discounts.length === 0 && !isCreating && (
          <div className="rounded-3 border border-dashed border-gray-a6 bg-gray-a2 p-8 text-center">
            <Gift className="mx-auto h-12 w-12 text-gray-8" />
            <h3 className="mt-4 text-3 font-medium text-gray-12">No discount codes yet</h3>
            <p className="mt-1 text-2 text-gray-11">
              Create discount codes to offer special deals during your webinar.
            </p>
          </div>
        )}

        {discounts.map((discount) => (
          <div
            key={discount.id}
            className={`rounded-3 border bg-gray-a2 p-6 ${
              discount.is_active ? 'border-gray-a4' : 'border-gray-a3 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <code className="rounded-2 bg-gray-a4 px-3 py-1 font-mono text-3 font-semibold text-gray-12">
                    {discount.code}
                  </code>
                  <button
                    onClick={() => copyCode(discount.code, discount.id)}
                    className="rounded-2 p-1.5 text-gray-11 hover:bg-gray-a4 hover:text-gray-12"
                    title="Copy code"
                  >
                    {copiedId === discount.id ? (
                      <Check className="h-4 w-4 text-green-11" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <span className={`text-3 font-semibold ${
                    discount.is_active ? 'text-green-11' : 'text-gray-9'
                  }`}>
                    {formatDiscount(discount.discount_type, discount.discount_value)}
                  </span>
                </div>
                {discount.description && (
                  <p className="mt-1 text-2 text-gray-11">{discount.description}</p>
                )}
                <div className="mt-2 flex gap-4 text-2 text-gray-11">
                  <span>
                    Used: {discount.times_used}
                    {discount.max_uses && ` / ${discount.max_uses}`}
                  </span>
                  {discount.show_at_minutes && (
                    <span>Shows after {discount.show_at_minutes} min</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleActive(discount.id)}
                  disabled={isPending}
                  className="rounded-2 p-2 text-gray-11 hover:bg-gray-a4 hover:text-gray-12"
                  title={discount.is_active ? 'Deactivate' : 'Activate'}
                >
                  {discount.is_active ? (
                    <ToggleRight className="h-5 w-5 text-green-11" />
                  ) : (
                    <ToggleLeft className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(discount.id)}
                  disabled={isPending}
                  className="rounded-2 p-2 text-gray-11 hover:bg-red-a3 hover:text-red-11"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
