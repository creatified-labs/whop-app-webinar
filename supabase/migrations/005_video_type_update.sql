-- ============================================
-- VIDEO TYPE UPDATE MIGRATION
-- Update video types to support multiple sources
-- ============================================

-- Update existing video types to 'url' (they were all URL-based)
UPDATE webinars
SET video_type = 'url'
WHERE video_type IN ('youtube', 'vimeo', 'hls', 'custom');

-- Drop the old constraint
ALTER TABLE webinars
DROP CONSTRAINT IF EXISTS webinars_video_type_check;

-- Add new constraint with all video types
ALTER TABLE webinars
ADD CONSTRAINT webinars_video_type_check
CHECK (video_type IN ('url', 'whop_live', 'google_meet', 'zoom'));

-- Update default value
ALTER TABLE webinars
ALTER COLUMN video_type SET DEFAULT 'url';
