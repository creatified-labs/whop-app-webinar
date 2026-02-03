-- Migration: 008_live_streaming.sql
-- Add Mux live streaming support to webinars

-- Add streaming fields to webinars table
ALTER TABLE webinars
ADD COLUMN IF NOT EXISTS stream_key TEXT,
ADD COLUMN IF NOT EXISTS mux_stream_id TEXT,
ADD COLUMN IF NOT EXISTS mux_playback_id TEXT,
ADD COLUMN IF NOT EXISTS stream_status TEXT DEFAULT 'idle';

-- Add comment for stream_status values
COMMENT ON COLUMN webinars.stream_status IS 'Stream status: idle, connecting, live, ended';

-- Track streaming sessions for analytics
CREATE TABLE IF NOT EXISTS stream_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  peak_viewers INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stream_sessions_webinar ON stream_sessions(webinar_id);

-- Enable RLS on stream_sessions
ALTER TABLE stream_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for stream_sessions (allow public read for webinar analytics)
CREATE POLICY "Stream sessions are viewable by company members"
  ON stream_sessions FOR SELECT
  USING (
    webinar_id IN (
      SELECT id FROM webinars WHERE company_id IN (
        SELECT company_id FROM company_members WHERE user_id = auth.uid()
      )
    )
  );

-- Allow insert for streaming operations (service role)
CREATE POLICY "Stream sessions can be created by authenticated users"
  ON stream_sessions FOR INSERT
  WITH CHECK (true);

-- Allow update for streaming operations
CREATE POLICY "Stream sessions can be updated by company members"
  ON stream_sessions FOR UPDATE
  USING (
    webinar_id IN (
      SELECT id FROM webinars WHERE company_id IN (
        SELECT company_id FROM company_members WHERE user_id = auth.uid()
      )
    )
  );
