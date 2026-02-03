-- Add Zoom fields to webinars table
ALTER TABLE webinars
ADD COLUMN IF NOT EXISTS zoom_meeting_id TEXT,
ADD COLUMN IF NOT EXISTS zoom_meeting_password TEXT,
ADD COLUMN IF NOT EXISTS zoom_host_email TEXT;

-- Track Zoom session analytics
CREATE TABLE IF NOT EXISTS zoom_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_zoom_sessions_webinar ON zoom_sessions(webinar_id);
CREATE INDEX IF NOT EXISTS idx_zoom_sessions_registration ON zoom_sessions(registration_id);
CREATE INDEX IF NOT EXISTS idx_webinars_zoom_meeting ON webinars(zoom_meeting_id) WHERE zoom_meeting_id IS NOT NULL;
