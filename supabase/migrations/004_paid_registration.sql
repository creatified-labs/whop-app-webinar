-- ============================================
-- Phase 2: Paid Registration
-- ============================================

-- Webinar payment configuration
ALTER TABLE webinars ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
ALTER TABLE webinars ADD COLUMN IF NOT EXISTS price_cents INTEGER;
ALTER TABLE webinars ADD COLUMN IF NOT EXISTS whop_product_id TEXT;
ALTER TABLE webinars ADD COLUMN IF NOT EXISTS whop_plan_id TEXT;
ALTER TABLE webinars ADD COLUMN IF NOT EXISTS allow_free_with_code BOOLEAN DEFAULT false;

-- Registration payment tracking
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'not_required';
  -- Values: not_required, pending, completed, refunded
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS payment_amount_cents INTEGER;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS whop_payment_id TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS whop_membership_id TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS discount_code_id UUID REFERENCES discount_codes(id);
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS discount_amount_cents INTEGER DEFAULT 0;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Discount code enhancement for free access
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS allows_free_access BOOLEAN DEFAULT false;

-- Indexes for payment queries
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_registrations_whop_payment_id ON registrations(whop_payment_id);
CREATE INDEX IF NOT EXISTS idx_webinars_is_paid ON webinars(is_paid) WHERE is_paid = true;

-- Comments for documentation
COMMENT ON COLUMN webinars.is_paid IS 'Whether this webinar requires payment to access';
COMMENT ON COLUMN webinars.price_cents IS 'Price in cents (e.g., 2999 = $29.99)';
COMMENT ON COLUMN webinars.whop_product_id IS 'Whop product ID for checkout';
COMMENT ON COLUMN webinars.whop_plan_id IS 'Whop plan ID for checkout';
COMMENT ON COLUMN webinars.allow_free_with_code IS 'Allow free access with valid discount code';
COMMENT ON COLUMN registrations.payment_status IS 'Payment status: not_required, pending, completed, refunded';
COMMENT ON COLUMN registrations.payment_amount_cents IS 'Amount paid in cents after discounts';
COMMENT ON COLUMN registrations.whop_payment_id IS 'Whop payment ID from checkout';
COMMENT ON COLUMN registrations.whop_membership_id IS 'Whop membership ID if applicable';
COMMENT ON COLUMN registrations.discount_code_id IS 'Discount code used at registration';
COMMENT ON COLUMN registrations.discount_amount_cents IS 'Discount amount in cents';
COMMENT ON COLUMN registrations.paid_at IS 'Timestamp when payment was completed';
COMMENT ON COLUMN discount_codes.allows_free_access IS 'If true, this code grants free access (100% discount)';
