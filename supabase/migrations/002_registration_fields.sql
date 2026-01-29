-- Migration: Add registration fields configuration to webinars
-- This allows webinar creators to configure what information to collect from registrants

-- Add registration_fields JSONB column to webinars table
ALTER TABLE webinars
ADD COLUMN IF NOT EXISTS registration_fields JSONB DEFAULT '[
  {"id": "name", "type": "name", "label": "Full Name", "required": true},
  {"id": "email", "type": "email", "label": "Email Address", "required": true}
]'::jsonb;

-- Add phone column to registrations table (for standard phone field)
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- Add custom_fields JSONB column to registrations table
-- This stores answers to custom questions configured on the webinar
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Add index for querying registrations by custom fields
CREATE INDEX IF NOT EXISTS idx_registrations_custom_fields ON registrations USING gin(custom_fields);

-- Comment on new columns
COMMENT ON COLUMN webinars.registration_fields IS 'JSON array of fields to collect during registration. Each field has: id, type, label, required, placeholder, options';
COMMENT ON COLUMN registrations.phone IS 'Registrant phone number (optional standard field)';
COMMENT ON COLUMN registrations.custom_fields IS 'JSON object storing answers to custom questions. Keys are field IDs, values are answers';
