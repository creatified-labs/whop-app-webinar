-- ============================================
-- ADD VIDEO INTEGRATIONS MIGRATION
-- Add Google Meet and Zoom video types
-- ============================================

-- Drop the existing constraint
ALTER TABLE webinars
DROP CONSTRAINT IF EXISTS webinars_video_type_check;

-- Add new constraint with all video types including Google Meet and Zoom
ALTER TABLE webinars
ADD CONSTRAINT webinars_video_type_check
CHECK (video_type IN ('url', 'whop_live', 'google_meet', 'zoom'));
