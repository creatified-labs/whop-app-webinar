# Whop Webinar Funnels App - Project Plan

## Project Overview

A Whop app that enables hosts to create webinar funnels with public sign-up pages, manage live or pre-recorded webinars, and engage attendees through an interactive portal with chat, Q&A, polls, and promotional cards.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| UI | React, Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Whop OAuth + Supabase Auth |
| Hosting | Vercel |
| Email | Resend |
| Payments | Whop Built-in Payments |
| Live Video | Whop Livestream API |
| External Video | Zoom API, Google Meet API |
| Pre-recorded Hosting | Whop Infrastructure / YouTube / Loom / Vimeo embeds |
| Real-time | Supabase Realtime (for chat/reactions) |

---

## User Roles & Permissions

| Role | Description | Permissions |
|------|-------------|-------------|
| **Host** | Creates and manages webinars | Full CRUD on webinars, manage all users, go live, upload recordings, view analytics, send promotions |
| **Moderator** | Assists during webinars | Pin messages, manage Q&A queue, remove messages, mute attendees, post promotional cards |
| **Guest Speaker** | Invited to present | Join live stream as presenter, access speaker controls (if using Whop livestream) |
| **Attendee** | Watches and participates | View webinar, send chat messages, react, submit questions, vote in polls |

---

## Core Features

### MVP (Phase 1)

1. **Funnel & Sign-up**
   - Public landing page for each webinar
   - Email capture form
   - Free vs paid registration (via Whop payments)
   - Discount codes
   - Early bird pricing (time-based pricing tiers)
   - Whop account creation/linking on registration

2. **Webinar Management (Host Dashboard)**
   - Create/edit/delete webinars
   - Set webinar type: Live (Whop) or Pre-recorded
   - Schedule date/time with timezone support
   - Configure pricing (free/paid/early bird)
   - Manage discount codes
   - Invite moderators and guest speakers
   - Upload or link pre-recorded video (Whop, YouTube, Loom, Vimeo)

3. **Webinar Portal (Attendee Experience)**
   - Dedicated webinar page within the app
   - Video player (live stream or pre-recorded embed)
   - Real-time chat with:
     - Text messages
     - Pinned messages
     - Reactions (emoji)
     - Promotional cards (styled differently)
   - Q&A queue (submit questions, upvote)
   - Polls (host-created, real-time results)

4. **Notifications & Reminders**
   - Email confirmation on registration
   - Email reminders (24h, 1h, 15min before)
   - Access link delivery via email

5. **Replay Access**
   - Automatic replay availability after live ends
   - Email replay link to attendees
   - Replay accessible within Whop portal

### Future Enhancements (Phase 2+)

- SMS reminders (Twilio)
- Evergreen/automated webinar scheduling
- Advanced analytics dashboard
- Attendee engagement scoring
- Integration with Whop's product/checkout for live selling
- Custom branding per webinar
- Waiting room with countdown
- Breakout rooms
- Screen sharing for external calls
- Calendar integrations (Google Calendar, Outlook)
- Webhook notifications for third-party tools

---

## Data Models (Supabase Schema)

```sql
-- Users (extends Whop user data)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whop_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webinars
CREATE TABLE webinars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic Info
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  duration_minutes INT DEFAULT 60,
  status TEXT DEFAULT 'draft', -- draft, scheduled, live, ended, cancelled
  
  -- Type & Source
  webinar_type TEXT NOT NULL, -- 'live_whop', 'pre_recorded'
  video_source TEXT, -- 'whop', 'youtube', 'loom', 'vimeo', 'zoom', 'google_meet'
  video_url TEXT, -- External URL if applicable
  whop_livestream_id TEXT, -- If using Whop livestream
  
  -- Pricing
  is_free BOOLEAN DEFAULT true,
  price_cents INT,
  early_bird_price_cents INT,
  early_bird_deadline TIMESTAMPTZ,
  whop_product_id TEXT, -- Whop payment product ID
  
  -- Replay
  replay_enabled BOOLEAN DEFAULT true,
  replay_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webinar Team (moderators, speakers)
CREATE TABLE webinar_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id UUID REFERENCES webinars(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'moderator', 'speaker'
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(webinar_id, user_id)
);

-- Discount Codes
CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id UUID REFERENCES webinars(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL, -- 'percentage', 'fixed'
  discount_value INT NOT NULL, -- percentage (0-100) or cents
  max_uses INT,
  current_uses INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(webinar_id, code)
);

-- Registrations
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id UUID REFERENCES webinars(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Registration Details
  email TEXT NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  registration_type TEXT NOT NULL, -- 'free', 'paid'
  
  -- Payment
  amount_paid_cents INT,
  discount_code_id UUID REFERENCES discount_codes(id),
  whop_payment_id TEXT,
  
  -- Attendance
  attended BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  
  -- Reminders
  reminder_24h_sent BOOLEAN DEFAULT false,
  reminder_1h_sent BOOLEAN DEFAULT false,
  reminder_15m_sent BOOLEAN DEFAULT false,
  
  UNIQUE(webinar_id, user_id)
);

-- Chat Messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id UUID REFERENCES webinars(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  message_type TEXT DEFAULT 'text', -- 'text', 'promo_card'
  content TEXT NOT NULL,
  
  -- Promo card specific
  promo_title TEXT,
  promo_url TEXT,
  promo_image_url TEXT,
  
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Reactions
CREATE TABLE chat_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Floating Reactions (live reactions that float across screen)
CREATE TABLE floating_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id UUID REFERENCES webinars(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Q&A Questions
CREATE TABLE qa_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id UUID REFERENCES webinars(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  is_answered BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  upvote_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Q&A Upvotes
CREATE TABLE qa_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES qa_questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_id, user_id)
);

-- Polls
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id UUID REFERENCES webinars(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Poll Options
CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  vote_count INT DEFAULT 0,
  display_order INT DEFAULT 0
);

-- Poll Votes
CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- Email Queue (for scheduled reminders)
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL, -- 'confirmation', 'reminder_24h', 'reminder_1h', 'reminder_15m', 'replay'
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_webinars_host ON webinars(host_id);
CREATE INDEX idx_webinars_status ON webinars(status);
CREATE INDEX idx_webinars_scheduled ON webinars(scheduled_at);
CREATE INDEX idx_registrations_webinar ON registrations(webinar_id);
CREATE INDEX idx_registrations_user ON registrations(user_id);
CREATE INDEX idx_chat_messages_webinar ON chat_messages(webinar_id);
CREATE INDEX idx_qa_questions_webinar ON qa_questions(webinar_id);
CREATE INDEX idx_email_queue_scheduled ON email_queue(scheduled_for) WHERE status = 'pending';
```

---

## User Flows

### Flow 1: Attendee Registration (Free)

```
1. Attendee lands on public funnel page (/webinar/[slug])
2. Views webinar details, date/time, host info
3. Clicks "Register Free"
4. Redirected to Whop OAuth (create/login account)
5. Returns to app → registration created
6. Confirmation email sent via Resend
7. Redirected to "You're registered" page with:
   - Add to calendar button
   - Webinar details
   - "Join" button (disabled until webinar starts)
```

### Flow 2: Attendee Registration (Paid)

```
1. Attendee lands on public funnel page (/webinar/[slug])
2. Views pricing (early bird if applicable)
3. Optionally enters discount code → price updates
4. Clicks "Purchase Access"
5. Redirected to Whop OAuth (create/login account)
6. Whop payment flow (Whop handles checkout)
7. Webhook received → registration created with payment info
8. Confirmation email sent
9. Redirected to "You're registered" page
```

### Flow 3: Host Creates Webinar

```
1. Host accesses dashboard (authenticated via Whop)
2. Clicks "Create Webinar"
3. Fills form:
   - Title, description, thumbnail
   - Date/time + timezone
   - Type: Live (Whop) or Pre-recorded
   - If pre-recorded: upload to Whop or paste external URL
   - Pricing: Free or Paid (set price, early bird)
4. Saves as draft or publishes immediately
5. If paid: Whop product created automatically
6. Unique funnel URL generated (/webinar/[slug])
7. Host can share URL for promotion
```

### Flow 4: Live Webinar Session

```
1. Host clicks "Go Live" from dashboard
2. Whop livestream initialized
3. Webinar status → 'live'
4. Attendees see "Join Now" button enabled
5. Attendees enter portal:
   - Video player shows live stream
   - Chat panel opens (real-time via Supabase)
   - Q&A tab available
   - Polls appear when host activates them
6. Host/Moderators can:
   - Pin messages
   - Post promotional cards
   - Manage Q&A queue
   - Launch polls
7. Host ends stream → status → 'ended'
8. Replay automatically available (if enabled)
9. Replay email sent to all registrants
```

### Flow 5: Pre-recorded Webinar Session

```
1. Scheduled time arrives
2. Webinar status → 'live' (even though pre-recorded)
3. Attendees can join portal
4. Video player shows pre-recorded content
5. Chat is live and interactive
6. Host can still post promo cards, run polls, manage Q&A
7. When video ends (or host manually ends) → status → 'ended'
8. Replay available
```

---

## Page/Route Structure

```
/
├── (public)
│   ├── /webinar/[slug]                 # Public funnel/landing page
│   ├── /webinar/[slug]/register        # Registration flow
│   ├── /webinar/[slug]/success         # Post-registration confirmation
│   └── /webinar/[slug]/watch           # Webinar portal (authenticated)
│
├── (dashboard) - Whop authenticated
│   ├── /dashboard                      # Host overview
│   ├── /dashboard/webinars             # List all webinars
│   ├── /dashboard/webinars/new         # Create webinar
│   ├── /dashboard/webinars/[id]        # Edit webinar
│   ├── /dashboard/webinars/[id]/live   # Live control room (for hosts)
│   ├── /dashboard/webinars/[id]/registrations  # View registrants
│   ├── /dashboard/webinars/[id]/analytics      # Post-webinar stats
│   └── /dashboard/settings             # Account settings
│
├── (api)
│   ├── /api/auth/whop                  # Whop OAuth callback
│   ├── /api/webhooks/whop              # Whop payment webhooks
│   ├── /api/webinars                   # CRUD webinars
│   ├── /api/webinars/[id]/register     # Registration endpoint
│   ├── /api/webinars/[id]/discount     # Validate discount code
│   ├── /api/webinars/[id]/chat         # Chat messages
│   ├── /api/webinars/[id]/questions    # Q&A
│   ├── /api/webinars/[id]/polls        # Polls
│   ├── /api/webinars/[id]/reactions    # Floating reactions
│   ├── /api/cron/reminders             # Cron job for email reminders
│   └── /api/cron/status-update         # Cron to auto-start scheduled webinars
```

---

## Third-Party Integrations

### Whop SDK/API

- **OAuth**: User authentication
- **Payments**: Product creation, checkout, webhooks
- **Livestream**: Start/stop streams, get stream URLs
- **User Data**: Fetch user profiles

### Supabase

- **Database**: PostgreSQL for all data
- **Realtime**: Subscribe to chat, reactions, polls, Q&A
- **Auth**: Session management (linked to Whop)
- **Storage**: Optional for thumbnails/uploads

### Resend

- **Transactional Emails**:
  - Registration confirmation
  - Reminder emails (24h, 1h, 15m)
  - Replay access email
  - Team invitations

### External Video (Future/Optional)

- **Zoom API**: Create meetings, get join URLs
- **Google Meet API**: Create meetings, get join URLs

---

## Phased Development Plan

### Phase 1: Foundation (Week 1-2)

**Setup & Infrastructure**
- [ ] Initialize Next.js 14 project with App Router
- [ ] Configure Tailwind CSS
- [ ] Set up Supabase project and connection
- [ ] Configure Vercel deployment
- [ ] Set up Resend account and API keys
- [ ] Implement Whop OAuth authentication flow
- [ ] Create database schema (run migrations)

**Core Models & API**
- [ ] User sync with Whop (create/update on login)
- [ ] Webinar CRUD API endpoints
- [ ] Basic dashboard layout and navigation

### Phase 2: Funnel & Registration (Week 2-3)

**Public Funnel Page**
- [ ] Dynamic landing page (/webinar/[slug])
- [ ] Webinar details display (title, description, date, host)
- [ ] Countdown timer to webinar start
- [ ] Price display with early bird logic
- [ ] Discount code input and validation
- [ ] "Register" / "Purchase" CTA buttons

**Registration Flow**
- [ ] Free registration flow (Whop OAuth → create registration)
- [ ] Paid registration flow (Whop checkout integration)
- [ ] Whop webhook handler for payment confirmation
- [ ] Confirmation page with calendar add button
- [ ] Confirmation email via Resend

### Phase 3: Host Dashboard (Week 3-4)

**Webinar Management**
- [ ] Webinar list view (draft, scheduled, live, ended)
- [ ] Create webinar form
  - [ ] Basic info (title, description, thumbnail upload)
  - [ ] Scheduling (date picker, time, timezone)
  - [ ] Type selection (live vs pre-recorded)
  - [ ] Video source configuration
  - [ ] Pricing configuration
- [ ] Edit webinar
- [ ] Delete/cancel webinar
- [ ] Discount code management (create, edit, deactivate)

**Team Management**
- [ ] Invite moderators (email invite)
- [ ] Invite guest speakers
- [ ] Accept/decline invitation flow
- [ ] Team member list with role badges

### Phase 4: Webinar Portal (Week 4-6)

**Video Player**
- [ ] Whop livestream embed integration
- [ ] External video embed (YouTube, Loom, Vimeo)
- [ ] Responsive player layout
- [ ] Fullscreen support

**Real-time Chat**
- [ ] Supabase Realtime subscription setup
- [ ] Message list with auto-scroll
- [ ] Send message input
- [ ] User avatars and names
- [ ] Pinned messages (highlighted at top)
- [ ] Promotional cards (styled differently)
- [ ] Message reactions (emoji picker)
- [ ] Floating reactions animation

**Moderation Tools**
- [ ] Pin/unpin messages
- [ ] Delete messages
- [ ] Post promotional card modal
- [ ] Mute user (future: timeout system)

**Q&A System**
- [ ] Submit question form
- [ ] Question list with upvote button
- [ ] Sort by upvotes or time
- [ ] Mark as answered
- [ ] Hide inappropriate questions

**Polls**
- [ ] Create poll modal (host/moderator)
- [ ] Activate/deactivate poll
- [ ] Vote on poll (attendees)
- [ ] Real-time results display
- [ ] Close poll and show final results

### Phase 5: Notifications & Reminders (Week 6-7)

**Email System**
- [ ] Email templates (React Email or HTML)
  - [ ] Registration confirmation
  - [ ] 24-hour reminder
  - [ ] 1-hour reminder
  - [ ] 15-minute reminder
  - [ ] Replay available
- [ ] Email queue system
- [ ] Cron job for processing email queue (Vercel Cron)
- [ ] Track sent status

**Webinar Status Automation**
- [ ] Cron job to auto-update status to 'live' at scheduled time
- [ ] Auto-update to 'ended' when stream ends

### Phase 6: Replay & Polish (Week 7-8)

**Replay Functionality**
- [ ] Store replay URL after webinar ends
- [ ] Replay page (same portal, but with recorded video)
- [ ] Send replay email to all registrants
- [ ] Replay accessible from Whop/dashboard

**Polish & Testing**
- [ ] Error handling and loading states
- [ ] Mobile responsiveness
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] End-to-end testing of all flows

---

## File Structure (Recommended)

```
/app
  /(public)
    /webinar/[slug]
      page.tsx              # Funnel landing
      register/page.tsx     # Registration
      success/page.tsx      # Confirmation
      watch/page.tsx        # Webinar portal
  /(dashboard)
    /dashboard
      page.tsx              # Overview
      /webinars
        page.tsx            # List
        new/page.tsx        # Create
        [id]/page.tsx       # Edit
        [id]/live/page.tsx  # Control room
  /api
    /auth/whop/route.ts
    /webhooks/whop/route.ts
    /webinars/route.ts
    /webinars/[id]/...
    /cron/...

/components
  /ui                       # Reusable UI (buttons, inputs, cards)
  /webinar                  # Webinar-specific components
    VideoPlayer.tsx
    Chat.tsx
    ChatMessage.tsx
    PromoCard.tsx
    QAPanel.tsx
    PollWidget.tsx
    ReactionOverlay.tsx
  /dashboard                # Dashboard components
    WebinarForm.tsx
    DiscountCodeManager.tsx
    TeamManager.tsx
  /funnel                   # Public funnel components
    CountdownTimer.tsx
    PricingCard.tsx
    RegistrationForm.tsx

/lib
  /supabase
    client.ts               # Supabase client
    server.ts               # Server-side client
    types.ts                # Generated types
  /whop
    client.ts               # Whop SDK setup
    auth.ts                 # OAuth helpers
    payments.ts             # Payment helpers
  /resend
    client.ts               # Resend client
    templates/              # Email templates
  /utils
    dates.ts                # Date/timezone helpers
    validation.ts           # Zod schemas

/hooks
  useWebinar.ts
  useChat.ts
  usePolls.ts
  useQA.ts
  useReactions.ts

/types
  index.ts                  # Shared TypeScript types
```

---

## Environment Variables

```env
# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Whop
WHOP_API_KEY=
WHOP_CLIENT_ID=
WHOP_CLIENT_SECRET=
WHOP_WEBHOOK_SECRET=

# Resend
RESEND_API_KEY=

# Optional: External integrations
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## Success Metrics (MVP)

- [ ] Host can create and publish a webinar
- [ ] Public funnel page displays correctly
- [ ] Free registration works end-to-end
- [ ] Paid registration works with Whop payments
- [ ] Discount codes apply correctly
- [ ] Early bird pricing shows/hides based on deadline
- [ ] Email reminders send at correct times
- [ ] Webinar portal loads with video player
- [ ] Real-time chat works for all attendees
- [ ] Host can pin messages and post promo cards
- [ ] Q&A and polls function correctly
- [ ] Replay is available after webinar ends

---

## Notes & Considerations

1. **Whop API Limitations**: Review Whop's API docs for rate limits and available endpoints. Some features may need workarounds.

2. **Real-time Scale**: Supabase Realtime works well for moderate scale. For very large webinars (1000+ concurrent), consider a dedicated solution like Ably or Pusher.

3. **Video Latency**: Whop livestream will have inherent latency (10-30 seconds typical). Chat will feel slightly "ahead" of video - this is normal for live streaming.

4. **Timezone Handling**: Store all times in UTC, convert to user's timezone on display. Use a library like `date-fns-tz` or `luxon`.

5. **Cron Jobs**: Vercel Cron has limits on free tier. For production, consider Vercel Pro or an external scheduler (e.g., QStash, Inngest).

6. **Mobile Experience**: The portal needs to work well on mobile - consider a stacked layout (video on top, chat below) for smaller screens.
