'use client';

import { useState, useTransition } from 'react';
import { DollarSign, Tag, Loader2, Check, Gift } from 'lucide-react';
import { Card, Heading, Text, Button } from '@whop/react/components';
import { updateWebinarPricing } from '@/app/actions/webinar';
import { formatPrice } from '@/lib/whop/checkout';

interface PricingConfigProps {
  webinarId: string;
  initialConfig?: {
    is_paid: boolean;
    price_cents: number | null;
    whop_plan_id: string | null;
    allow_free_with_code: boolean;
  };
}

export function PricingConfig({ webinarId, initialConfig }: PricingConfigProps) {
  const [isPending, startTransition] = useTransition();
  const [isPaid, setIsPaid] = useState(initialConfig?.is_paid ?? false);
  const [priceAmount, setPriceAmount] = useState(
    initialConfig?.price_cents ? (initialConfig.price_cents / 100).toFixed(2) : ''
  );
  const [whopPlanId, setWhopPlanId] = useState(initialConfig?.whop_plan_id ?? '');
  const [allowFreeWithCode, setAllowFreeWithCode] = useState(
    initialConfig?.allow_free_with_code ?? false
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (isPaid && !priceAmount) {
      setError('Please enter a price');
      return;
    }

    if (isPaid && !whopPlanId) {
      setError('Please enter a Whop plan ID');
      return;
    }

    const priceCents = priceAmount ? Math.round(parseFloat(priceAmount) * 100) : null;

    if (isPaid && priceCents && priceCents < 100) {
      setError('Minimum price is $1.00');
      return;
    }

    startTransition(async () => {
      const result = await updateWebinarPricing(webinarId, {
        is_paid: isPaid,
        price_cents: priceCents,
        whop_plan_id: whopPlanId || null,
        allow_free_with_code: allowFreeWithCode,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || 'Failed to update pricing');
      }
    });
  };

  const inputClassName =
    'w-full rounded border border-gray-a6 bg-gray-1 px-3 py-2 text-sm text-gray-12 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8';

  return (
    <Card size="2">
      <div className="mb-4">
        <Heading size="4" weight="semi-bold">
          <DollarSign className="mr-2 inline h-5 w-5 text-green-500" />
          Pricing
        </Heading>
        <Text size="2" color="gray" className="mt-0.5">
          Configure paid access for this webinar
        </Text>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Paid Toggle */}
        <div className="flex items-center justify-between rounded-2 border border-gray-a4 p-3">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-blue-500" />
            <div>
              <Text size="2" weight="medium">
                Paid Webinar
              </Text>
              <Text size="1" color="gray">
                Require payment to access
              </Text>
            </div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={isPaid}
              onChange={(e) => setIsPaid(e.target.checked)}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-gray-a6 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-accent-9 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-3" />
          </label>
        </div>

        {isPaid && (
          <>
            {/* Price Input */}
            <div className="space-y-2">
              <Text size="2" weight="medium" color="gray">
                Price (USD)
              </Text>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-11">$</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={priceAmount}
                  onChange={(e) => setPriceAmount(e.target.value)}
                  placeholder="29.99"
                  className={`${inputClassName} pl-7`}
                />
              </div>
              {priceAmount && (
                <Text size="1" color="gray">
                  Attendees will pay {formatPrice(Math.round(parseFloat(priceAmount || '0') * 100))}
                </Text>
              )}
            </div>

            {/* Whop Plan ID */}
            <div className="space-y-2">
              <Text size="2" weight="medium" color="gray">
                Whop Plan ID
              </Text>
              <input
                type="text"
                value={whopPlanId}
                onChange={(e) => setWhopPlanId(e.target.value)}
                placeholder="plan_xxx..."
                className={inputClassName}
              />
              <Text size="1" color="gray">
                Find this in your Whop dashboard under Products &gt; Plans
              </Text>
            </div>

            {/* Allow Free with Code */}
            <div className="flex items-center justify-between rounded-2 border border-gray-a4 p-3">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-purple-500" />
                <div>
                  <Text size="2" weight="medium">
                    Allow Free Access Codes
                  </Text>
                  <Text size="1" color="gray">
                    Enable discount codes that grant free access
                  </Text>
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={allowFreeWithCode}
                  onChange={(e) => setAllowFreeWithCode(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-a6 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-accent-9 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-3" />
              </label>
            </div>
          </>
        )}

        {!isPaid && (
          <div className="rounded-2 bg-gray-a2 p-4 text-center">
            <Text size="2" color="gray">
              This webinar is free to access. Enable paid mode to require payment.
            </Text>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <Text size="2" color="red">
            {error}
          </Text>
        )}
        {success && (
          <div className="flex items-center gap-2 text-green-600">
            <Check className="h-4 w-4" />
            <Text size="2" color="green">
              Pricing updated successfully
            </Text>
          </div>
        )}

        {/* Submit Button */}
        <Button type="submit" size="2" variant="solid" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Pricing
        </Button>
      </form>
    </Card>
  );
}
