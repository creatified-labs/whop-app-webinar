-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS TABLE
-- Synced from Whop user data
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whop_user_id TEXT UNIQUE NOT NULL,
    email TEXT,
    name TEXT,
    username TEXT,
    profile_pic_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_whop_user_id ON users(whop_user_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- COMPANIES TABLE
-- Synced from Whop company data
-- ============================================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whop_company_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_whop_company_id ON companies(whop_company_id);

-- ============================================
-- COMPANY MEMBERS TABLE
-- Links users to companies with roles
-- ============================================
CREATE TABLE company_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, user_id)
);

CREATE INDEX idx_company_members_company_id ON company_members(company_id);
CREATE INDEX idx_company_members_user_id ON company_members(user_id);

-- ============================================
-- WEBINARS TABLE
-- Core webinar data
-- ============================================
CREATE TABLE webinars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Basic Info
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,

    -- Scheduling
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    timezone TEXT NOT NULL DEFAULT 'America/New_York',

    -- Status: draft, scheduled, live, ended, cancelled
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'live', 'ended', 'cancelled')),

    -- Video Configuration
    video_type TEXT NOT NULL DEFAULT 'youtube' CHECK (video_type IN ('youtube', 'vimeo', 'hls', 'custom')),
    video_url TEXT,
    replay_url TEXT,

    -- Landing Page Customization
    cover_image_url TEXT,
    cta_text TEXT DEFAULT 'Register Now',
    cta_url TEXT,
    show_host_info BOOLEAN DEFAULT true,

    -- Features
    chat_enabled BOOLEAN DEFAULT true,
    qa_enabled BOOLEAN DEFAULT true,
    polls_enabled BOOLEAN DEFAULT true,
    reactions_enabled BOOLEAN DEFAULT true,

    -- Email Settings
    send_confirmation_email BOOLEAN DEFAULT true,
    send_reminder_1h BOOLEAN DEFAULT true,
    send_reminder_24h BOOLEAN DEFAULT true,
    send_replay_email BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, slug)
);

CREATE INDEX idx_webinars_company_id ON webinars(company_id);
CREATE INDEX idx_webinars_slug ON webinars(slug);
CREATE INDEX idx_webinars_status ON webinars(status);
CREATE INDEX idx_webinars_scheduled_at ON webinars(scheduled_at);

-- ============================================
-- WEBINAR HOSTS TABLE
-- Multiple hosts per webinar
-- ============================================
CREATE TABLE webinar_hosts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Can have external hosts (not in system)
    name TEXT NOT NULL,
    title TEXT,
    bio TEXT,
    image_url TEXT,

    -- Order for display
    display_order INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webinar_hosts_webinar_id ON webinar_hosts(webinar_id);

-- ============================================
-- REGISTRATIONS TABLE
-- Webinar registrations (public, no auth required)
-- ============================================
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,

    -- Registration Info
    email TEXT NOT NULL,
    name TEXT,

    -- Optional: Link to Whop user if they're logged in
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Registration Source
    source TEXT, -- utm_source or referrer
    utm_campaign TEXT,
    utm_medium TEXT,
    utm_content TEXT,

    -- Status
    attended BOOLEAN DEFAULT false,
    attended_at TIMESTAMPTZ,
    watched_replay BOOLEAN DEFAULT false,
    watched_replay_at TIMESTAMPTZ,

    -- Email Status
    confirmation_sent BOOLEAN DEFAULT false,
    reminder_1h_sent BOOLEAN DEFAULT false,
    reminder_24h_sent BOOLEAN DEFAULT false,
    replay_sent BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(webinar_id, email)
);

CREATE INDEX idx_registrations_webinar_id ON registrations(webinar_id);
CREATE INDEX idx_registrations_email ON registrations(email);
CREATE INDEX idx_registrations_user_id ON registrations(user_id);

-- ============================================
-- CHAT MESSAGES TABLE
-- Real-time chat during webinars
-- ============================================
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
    registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,

    message TEXT NOT NULL,

    -- Moderation
    is_pinned BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_webinar_id ON chat_messages(webinar_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- ============================================
-- Q&A QUESTIONS TABLE
-- Questions submitted during webinars
-- ============================================
CREATE TABLE qa_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
    registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,

    question TEXT NOT NULL,

    -- Status: pending, answered, dismissed
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'dismissed')),

    -- Answer (by host)
    answer TEXT,
    answered_by UUID REFERENCES users(id) ON DELETE SET NULL,
    answered_at TIMESTAMPTZ,

    -- Moderation
    is_highlighted BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,

    -- Upvotes (denormalized for performance)
    upvote_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_qa_questions_webinar_id ON qa_questions(webinar_id);
CREATE INDEX idx_qa_questions_status ON qa_questions(status);
CREATE INDEX idx_qa_questions_upvote_count ON qa_questions(upvote_count DESC);

-- ============================================
-- Q&A UPVOTES TABLE
-- Track who upvoted which questions
-- ============================================
CREATE TABLE qa_upvotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES qa_questions(id) ON DELETE CASCADE,
    registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(question_id, registration_id)
);

CREATE INDEX idx_qa_upvotes_question_id ON qa_upvotes(question_id);

-- ============================================
-- POLLS TABLE
-- Polls created by hosts
-- ============================================
CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,

    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of {id: string, text: string}

    -- Status: draft, active, closed
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),

    -- Settings
    allow_multiple BOOLEAN DEFAULT false,
    show_results_live BOOLEAN DEFAULT true,

    -- Timing
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_polls_webinar_id ON polls(webinar_id);
CREATE INDEX idx_polls_status ON polls(status);

-- ============================================
-- POLL RESPONSES TABLE
-- Individual poll responses
-- ============================================
CREATE TABLE poll_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,

    selected_options JSONB NOT NULL, -- Array of option IDs

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(poll_id, registration_id)
);

CREATE INDEX idx_poll_responses_poll_id ON poll_responses(poll_id);

-- ============================================
-- REACTIONS TABLE
-- Emoji reactions during live webinars
-- ============================================
CREATE TABLE reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
    registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,

    emoji TEXT NOT NULL, -- e.g., '🔥', '❤️', '👏'

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reactions_webinar_id ON reactions(webinar_id);
CREATE INDEX idx_reactions_created_at ON reactions(created_at);

-- ============================================
-- DISCOUNT CODES TABLE
-- Discount codes shown during webinars
-- ============================================
CREATE TABLE discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,

    code TEXT NOT NULL,
    description TEXT,

    -- Discount Type
    discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL,

    -- Limits
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,

    -- Validity
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,

    -- Display Settings
    show_at_minutes INTEGER, -- Minutes into webinar to display
    auto_apply_url TEXT, -- URL with discount pre-applied

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_discount_codes_webinar_id ON discount_codes(webinar_id);

-- ============================================
-- EMAIL QUEUE TABLE
-- Queue for sending emails
-- ============================================
CREATE TABLE email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Email Type
    email_type TEXT NOT NULL CHECK (email_type IN ('confirmation', 'reminder_1h', 'reminder_24h', 'replay', 'custom')),

    -- Recipient
    registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    to_email TEXT NOT NULL,
    to_name TEXT,

    -- Content
    subject TEXT NOT NULL,
    template_data JSONB,

    -- Scheduling
    scheduled_for TIMESTAMPTZ NOT NULL,

    -- Status: pending, sent, failed
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMPTZ,
    error_message TEXT,

    -- Retry tracking
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_scheduled_for ON email_queue(scheduled_for);
CREATE INDEX idx_email_queue_registration_id ON email_queue(registration_id);

-- ============================================
-- ANALYTICS EVENTS TABLE
-- Track user interactions
-- ============================================
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
    registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,

    -- Event Info
    event_type TEXT NOT NULL, -- page_view, registration, join, leave, cta_click, etc.
    event_data JSONB,

    -- Session tracking
    session_id TEXT,

    -- Device/Browser info
    user_agent TEXT,
    ip_address TEXT,
    referrer TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_webinar_id ON analytics_events(webinar_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webinars_updated_at
    BEFORE UPDATE ON webinars
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update Q&A upvote count
CREATE OR REPLACE FUNCTION update_qa_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE qa_questions SET upvote_count = upvote_count + 1 WHERE id = NEW.question_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE qa_questions SET upvote_count = upvote_count - 1 WHERE id = OLD.question_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_qa_upvote_count_trigger
    AFTER INSERT OR DELETE ON qa_upvotes
    FOR EACH ROW
    EXECUTE FUNCTION update_qa_upvote_count();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinar_hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be managed via service role key on server-side
-- Public pages will use anon key with specific policies

-- Allow public read access to webinars that are scheduled or live
CREATE POLICY "Public can view scheduled/live webinars" ON webinars
    FOR SELECT
    USING (status IN ('scheduled', 'live', 'ended'));

-- Allow public to create registrations
CREATE POLICY "Public can register for webinars" ON registrations
    FOR INSERT
    WITH CHECK (true);

-- Allow registrants to read their own registration
CREATE POLICY "Users can view own registration" ON registrations
    FOR SELECT
    USING (true); -- Will be filtered by email in application logic

-- Allow public to view chat messages for webinars they're in
CREATE POLICY "Public can view chat messages" ON chat_messages
    FOR SELECT
    USING (is_hidden = false);

-- Allow public to view Q&A questions
CREATE POLICY "Public can view qa questions" ON qa_questions
    FOR SELECT
    USING (is_hidden = false);

-- Allow public to view active polls
CREATE POLICY "Public can view polls" ON polls
    FOR SELECT
    USING (status IN ('active', 'closed'));

-- Allow public to view webinar hosts
CREATE POLICY "Public can view webinar hosts" ON webinar_hosts
    FOR SELECT
    USING (true);

-- Service role bypasses RLS for all admin operations
