-- ============================================
-- ANALYTICS SUITE MIGRATION
-- Engagement tracking, watch time, lead scoring, A/B testing
-- ============================================

-- ============================================
-- ENGAGEMENT EVENTS TABLE
-- Track all user engagement actions for scoring
-- ============================================
CREATE TABLE engagement_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
    registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,

    -- Event type: chat_message, qa_submit, qa_upvote, poll_response, reaction, cta_click, watch_milestone
    event_type TEXT NOT NULL,

    -- Additional event data (e.g., milestone percentage, emoji type)
    event_data JSONB,

    -- Points earned for this action (based on company config)
    points_earned INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_engagement_events_webinar ON engagement_events(webinar_id);
CREATE INDEX idx_engagement_events_registration ON engagement_events(registration_id);
CREATE INDEX idx_engagement_events_type ON engagement_events(event_type);
CREATE INDEX idx_engagement_events_created ON engagement_events(created_at);

-- ============================================
-- WATCH SESSIONS TABLE
-- Track watch time and milestone completion
-- ============================================
CREATE TABLE watch_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
    registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,

    -- Session timing
    session_start TIMESTAMPTZ DEFAULT NOW(),
    session_end TIMESTAMPTZ,

    -- Total watch time in seconds
    total_watch_seconds INTEGER DEFAULT 0,

    -- Milestones reached (25, 50, 75, 100)
    milestones_reached INTEGER[] DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_watch_sessions_webinar ON watch_sessions(webinar_id);
CREATE INDEX idx_watch_sessions_registration ON watch_sessions(registration_id);

-- Add trigger for updated_at
CREATE TRIGGER update_watch_sessions_updated_at
    BEFORE UPDATE ON watch_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ENGAGEMENT CONFIGS TABLE
-- Configurable point values per company
-- ============================================
CREATE TABLE engagement_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,

    -- Point values for each action type
    chat_message_points INTEGER DEFAULT 1,
    qa_submit_points INTEGER DEFAULT 3,
    qa_upvote_points INTEGER DEFAULT 1,
    poll_response_points INTEGER DEFAULT 2,
    reaction_points INTEGER DEFAULT 1,
    cta_click_points INTEGER DEFAULT 5,

    -- Watch milestone points
    watch_25_points INTEGER DEFAULT 5,
    watch_50_points INTEGER DEFAULT 10,
    watch_75_points INTEGER DEFAULT 15,
    watch_100_points INTEGER DEFAULT 25,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_engagement_configs_company ON engagement_configs(company_id);

-- Add trigger for updated_at
CREATE TRIGGER update_engagement_configs_updated_at
    BEFORE UPDATE ON engagement_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- LEAD SCORES TABLE
-- Cached/computed scores per registration
-- ============================================
CREATE TABLE lead_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE UNIQUE,

    -- Score breakdown
    total_score INTEGER DEFAULT 0,
    engagement_score INTEGER DEFAULT 0,
    watch_time_score INTEGER DEFAULT 0,
    interaction_score INTEGER DEFAULT 0,

    -- Last calculation timestamp
    last_calculated_at TIMESTAMPTZ DEFAULT NOW(),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lead_scores_registration ON lead_scores(registration_id);
CREATE INDEX idx_lead_scores_total ON lead_scores(total_score DESC);

-- ============================================
-- LANDING PAGE VARIANTS TABLE
-- A/B testing for webinar landing pages
-- ============================================
CREATE TABLE landing_page_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,

    -- Variant identifier (A, B, control, etc.)
    variant_name TEXT NOT NULL,

    -- Override values for the landing page
    variant_config JSONB, -- { headline, cta_text, cover_image_url, etc. }

    -- Traffic allocation (percentage 0-100)
    traffic_percentage INTEGER DEFAULT 50 CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),

    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_landing_variants_webinar ON landing_page_variants(webinar_id);
CREATE INDEX idx_landing_variants_active ON landing_page_variants(webinar_id) WHERE is_active = true;

-- ============================================
-- ADD VARIANT TRACKING TO REGISTRATIONS
-- ============================================
ALTER TABLE registrations ADD COLUMN variant_id UUID REFERENCES landing_page_variants(id) ON DELETE SET NULL;

CREATE INDEX idx_registrations_variant ON registrations(variant_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_page_variants ENABLE ROW LEVEL SECURITY;

-- Public can view active landing page variants
CREATE POLICY "Public can view active variants" ON landing_page_variants
    FOR SELECT
    USING (is_active = true);

-- Service role handles all other operations
