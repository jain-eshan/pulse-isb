# Pulse — Design Spec

**Date:** 2026-04-24
**Author:** Eshan Jain
**Status:** Draft for review
**Context:** Flagship product for Eshan's BTC (Business & Technology Club) President campaign, ISB PGP Co'27 Mohali. Soap Box: May 15. Elections: May 20. Build window: 7 days of focused work.

---

## 1. Product Summary

**Pulse** is a WhatsApp-native peer-session platform for the ISB PGP cohort. It replaces the current pattern — one fresh Google Form + WhatsApp poll + Teams link per session — with a single identity-aware system where sessions are created once, propagated into existing WhatsApp groups automatically, RSVP'd in one tap, added to Outlook calendar, and archived as searchable transcripts with AI summaries.

**One-liner:** *Luma, but living inside your ISB WhatsApp groups.*

**Why this wins the BTC election:** The product maps directly to four BTC constitutional KPIs — L&D (P2P + workshops), member engagement, communication, cross-campus collaboration — and demonstrates that the candidate can ship the kind of platform a Tech Club President will actually use for the next twelve months. The WhatsApp-native distribution is the differentiator: anyone can build a web app; nobody else in the field will ship an in-group bot.

---

## 2. Users & Jobs

| User | Primary job |
|---|---|
| **Organizer** (session host — e.g., Saurav, Syed, Hritik) | Post a session and get people to show up, without managing a form, poll, venue ping, and reminder chain |
| **Attendee** (any Co'27 student) | Know what's happening this week, RSVP in one tap from WhatsApp, get a calendar invite, catch up on missed sessions via transcript |
| **Candidate/Eshan** | Demonstrate product chops; own the distribution channel the cohort already lives in |

Out of scope for the campaign build: recruiters, alumni, faculty, Co'26.

---

## 3. Scope for the 7-Day Build

### In scope
- Microsoft SSO (ISB email only) — existing MSAL wiring preserved
- **Polished onboarding flow** (4 steps, <60s): SSO → section/cohort → interests → optional WA link → "This week" landing
- **Sessions surface:** create / list / detail / RSVP
- **Pulse wishlist** (upvote-based demand signal)
- **Discover tab reactivated** — existing `isb-explorer` UI stays, seeded with ~30 curated places + cohort "Add a spot" contribution
- **WhatsApp bot with Native Events:** paste-to-parse incoming group message → create native WA Event in the group → observe RSVPs → sync to Supabase. Plus DM commands and reminders.
- **Outlook Calendar auto-invite** on RSVP via Microsoft Graph
- **Micro-interactions**: confetti on first RSVP, skeleton loaders, page transitions, empty states with voice, haptic feedback, social-proof toasts
- Public landing page (unauthenticated) — campaign-visible demo surface
- Mobile-first, carrying the existing isb-explorer design system verbatim

### Out of scope (parked for post-election manifesto promises)
- **Transcript upload + Claude summary + searchable archive** — cut from MVP (low near-term value per cohort signal)
- Cross-campus Hyderabad feed
- Pulse → Club routing (wishlist items auto-notify relevant club presidents) — Term 1 promise
- Speaker/industry event booking with external guests
- Attendance marking + CAS reporting integration
- Weekly auto-digest newsletter
- Referrals/CV board (separate product, Term 1 promise)
- Admin moderation tools beyond basic delete-own
- Scraped place data (Reddit/Insta) — post-election enrichment layer

---

## 4. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        PULSE                                │
│                                                             │
│  ┌────────────┐     ┌────────────┐     ┌───────────────┐   │
│  │  Web App   │     │ Pulse Bot  │     │  Claude API   │   │
│  │ (existing  │     │ (Baileys   │     │ (summaries,   │   │
│  │  Vite+MSAL)│     │  Node svc) │     │  paste-parse) │   │
│  └─────┬──────┘     └──────┬─────┘     └───────┬───────┘   │
│        │                   │                   │           │
│        └───────────┬───────┴───────────────────┘           │
│                    ▼                                        │
│           ┌────────────────┐                                │
│           │   Supabase     │                                │
│           │  (Postgres +   │                                │
│           │   Auth link)   │                                │
│           └────────┬───────┘                                │
│                    ▼                                        │
│           ┌────────────────┐                                │
│           │ Microsoft Graph│ ← Outlook calendar invites     │
│           └────────────────┘                                │
└─────────────────────────────────────────────────────────────┘
```

**Three units, each with one clear purpose:**

### 4a. Web App (existing `isb-explorer` repo, rebranded)
- Stack: React 19 + Vite + TS + Tailwind + shadcn/Radix (already in place)
- Auth: MSAL (existing) — whitelist `@isb.edu` tenant
- Routes: `/`, `/sessions`, `/sessions/:id`, `/sessions/new`, `/pulse`, `/archive`, `/profile`
- Consumes Supabase for all data
- Issues Microsoft Graph calls for calendar invites on RSVP
- Calls Claude API (via Supabase Edge Function to keep key server-side) for paste-to-parse and transcript summaries

### 4b. Pulse Bot (new: `pulse-bot/` — standalone Node service)
- Stack: Node + `@whiskeysockets/baileys` + Supabase client
- Deployment: **Railway** (long-lived WebSocket process; Vercel/serverless cannot host this)
- Four responsibilities, strictly:
  1. **Listen** — in whitelisted groups, watch for session-announcement-shaped messages; react 📅 and reply-thread "Turn into Pulse event? Reply `yes`."
  2. **Create WA Native Event** — on `yes`, after Claude parse, the bot posts a **native WhatsApp Event** back into the group using Baileys' event message type. Cohort RSVPs inside WhatsApp (1 tap, no migration).
  3. **Sync RSVPs** — observe WA event-response messages → upsert into `rsvps` with `responded_via = 'wa_native_event'`. Trigger Outlook calendar invite server-side for linked users.
  4. **DM interface + Notify** — `/sessions`, `/rsvp <id>`, `/going` commands. Account linking via one-time code. Reminders 1h before.
- Contract with web app: Supabase is the only shared boundary. Bot never calls the web app's API and vice versa — state flows through the database.

### 4c. Claude API worker (Supabase Edge Function)
- Two endpoints:
  - `parseSessionText(raw)` → `{title, date, venue, description, tags}`
  - `summarizeTranscript(text)` → `{tldr, keyPoints[], tags[]}`
- Uses prompt caching on a fixed system prompt describing ISB context + output JSON schema
- Rate-limited; called only from backend (never from the browser)

---

## 5. Data Model (Supabase / Postgres)

```sql
users          -- extends auth.users; stores isb_email, campus, section, cohort_year, interests[], wa_phone (nullable)
sessions       -- id, creator_id, title, description, starts_at, ends_at, venue, tags[], wa_event_id nullable, wa_group_jid nullable, created_at, archived
rsvps          -- session_id, user_id, status (going|maybe|cant), responded_via (web|wa_native_event|bot_dm|calendar), created_at
pulse_items    -- id, creator_id, title, description, tags[], status (open|planned|done), linked_session_id nullable, created_at
pulse_votes    -- pulse_id, user_id, created_at  (unique together)
places         -- id, name, category (food|cafe|nightlife|travel), vibe_tags[], budget (low|mid|high), area, description, added_by_user_id, created_at
place_reviews  -- place_id, user_id, rating, note, created_at
wa_links       -- user_id, wa_phone, verified_at, onetime_code_hash, code_expires_at
wa_groups      -- group_jid, name, campus, added_by_user_id, is_whitelisted
bot_events     -- group_jid, source_message_id, parsed_session_id nullable, action, created_at  (audit log)
```
Transcripts table deferred — not in MVP.

RLS policies: every table scoped to `auth.uid()`. Sessions readable by any authenticated user; writeable only by creator. Transcripts readable by attendees and creator.

---

## 6. Key Flows

### 6a. Zero-friction session creation from WhatsApp
1. Organizer writes their usual session announcement in a WhatsApp group. (No behavior change.)
2. Pulse Bot (added to the group beforehand) detects it, reacts 📅, replies: *"Turn into Pulse event? Reply `yes`."*
3. Organizer replies `yes` → bot runs `parseSessionText` via Claude → DMs organizer a confirmation card: *"Session: [title], [date], [venue]. RSVP link: pulse.eshanjain.in/s/abc123. Anything to change?"*
4. On organizer `ok` → event goes live, bot posts a clean RSVP card back into the original group with the link.
5. Attendees tap link → MSAL SSO (one-tap if logged into Outlook) → RSVP'd → calendar invite sent.

### 6b. RSVP from within WhatsApp (no website visit)
- Attendee DMs the bot `going abc123` (or taps quick-reply) → bot checks `wa_links` table → if linked, insert RSVP directly → reply "✅ You're in. Calendar invite coming."
- If not linked: bot replies with a one-tap SSO link that binds their WA phone to their MSAL identity.

### 6c. Transcript → archive
- After the session, organizer pastes the transcript (or a co-host does) via web or DMs the bot.
- Claude summary runs; summary surfaces in `/archive` with tags, searchable by keyword or tag chip.

### 6d. Pulse (wishlist)
- Any student posts a request: *"Want a session on product analytics from a senior PM."*
- Others upvote. Sorted by vote count.
- When an organizer picks one up, it links to the created session and marks `planned`.

---

## 7. Visual Language (inherited from isb-explorer design system)

No new design system. We carry forward, verbatim:

- **Header:** `bg-gradient-to-br from-[#1a1a2e] to-[#16213e]`, white text, emoji + title.
- **Brand:** `brand-500 #4f6ef7` for primary CTAs, `brand-50 #f0f4ff` for selected states.
- **Vibe colors** (repurposed for session category tags): purple = product/strategy, orange = consulting/finance, green = academics/FADM, pink = social/cultural, blue = tech/AI, yellow = careers.
- **Cards:** white bg, `border-gray-100`, `shadow-sm`, `rounded-3xl`, gradient header strip.
- **CTA gradient:** `from-brand-500 to-vibe-purple` for "RSVP" and "Create Session".
- **Emoji-as-icons:** continue the pattern. 📅 for sessions, 💡 for Pulse, 📚 for archive, 🔔 for notifications, 🤖 for bot.
- **Typography:** system-ui, antialiased, same scale (24 / 16 / 14 / 12).
- **Layout:** mobile-first, `max-w-md` centered, sticky bottom nav.

The existing `PlaceCard.tsx` becomes the template for `SessionCard.tsx`. `GoingPage.tsx` adapts into the RSVP surface. `Onboarding.tsx` stays almost as-is, swapping vibe tags for interest tags (product, consulting, tech, careers, etc.).

**Logo:** keep the existing purple lightning bolt SVG — semantically fits "Pulse" perfectly (one-off line, it's the original `assets/logo.svg`).

---

## 8. Auth & Identity

- **Primary identity:** MSAL with tenant restriction to ISB. Existing wiring preserved.
- **WhatsApp linking:** user visits `/profile`, taps "Link WhatsApp", receives a 6-digit code. DMs `link 123456` to the bot. Bot verifies and binds `wa_phone → user_id`.
- **Why one-time code not phone-number-claim:** prevents someone else typing your phone number into the web form and hijacking your identity.

---

## 9. WhatsApp Bot: Risk & Mitigation

**Risk:** Baileys is unofficial; the bot's number can be banned by Meta heuristics (bulk messaging, reports, unusual patterns).

**Mitigations:**
1. Dedicated prepaid SIM, never reused elsewhere.
2. Rate-limit outbound to well under WA's informal thresholds (~20 DMs/min, ~500/day).
3. Only DM users who have explicitly linked their account.
4. Never proactively add the bot to groups — someone else (organizer/admin) adds it. Bot never sends unsolicited group messages.
5. Graceful fallback: if the bot goes down, the web app + share-to-WA deep links keep everything functional. Nothing is bot-only.
6. Keep a second SIM on standby for the last 48 hours of the campaign.

---

## 10. Error Handling & Edge Cases

- **Parse failure:** Claude returns low confidence or malformed JSON → bot replies "Couldn't parse — want to fill it in yourself? [link]"
- **RSVP without link:** bot sends SSO bind link, holds the intended RSVP in memory for 10 min.
- **Calendar invite fails** (Graph 401): silently fall back to `.ics` download link in the web RSVP confirmation.
- **Transcript too long** (>100k chars): truncate with notice; user can split.
- **Duplicate session detection:** when paste-to-parse runs, check for existing session within ±2 hours with same title — prompt "duplicate?"
- **Bot re-auth:** Baileys sessions can expire — on disconnect, bot posts an alert to a private admin channel (Eshan's DM), web app continues unaffected.

---

## 11. Testing

- Unit: session / RSVP / pulse-vote business logic in Supabase Edge Functions (Deno test).
- Integration: seed a test cohort, run create-session → RSVP → calendar-invite → transcript-upload end-to-end on a staging Supabase project.
- Manual: seed 5 real sessions with real organizers (Saurav, Hritik, one consulting P2P) before launch. The product has to feel inhabited on Day 1.
- Bot: dry-run with 3 personal WhatsApp accounts in a test group before pointing at cohort groups.

---

## 12. 7-Day Build Plan (to be expanded in the implementation plan)

| Day | Deliverable |
|---|---|
| 1 | Rebrand `isb-explorer` → `pulse` in place. Schema migration (add sessions, rsvps, pulse_*, places, wa_*). Onboarding flow polished: section + cohort + interests + optional WA link. Deploy web to Vercel. |
| 2 | Sessions CRUD + RSVP UI. Outlook Graph calendar invite on RSVP. Session card component (reusing PlaceCard pattern). |
| 3 | Pulse Bot MVP on Railway: Baileys init, DM command handlers, WA account linking via one-time code. Paste-to-parse Claude Edge Function. |
| 4 | Bot in-group listener + 📅-react → **create native WA Event** on organizer confirm. RSVP sync back from WA events. Reminder cron (1h before). |
| 5 | Pulse wishlist page (upvote-based). Discover tab reactivated — seed 30 curated places, "Add a spot" flow for cohort contributions. |
| 6 | Public landing page (unauthenticated campaign surface). Polish pass: micro-interactions (confetti, skeletons, toasts, page transitions, empty-state copy). Seed 5 real sessions with real organizers. |
| 7 | Soft-launch to 20 beta users, fix critical bugs, write campaign announcement copy, rehearse Soap Box demo. |

**Margin:** this is a 7-day plan for ~18 days of calendar time. Buffer goes to real user feedback, Hritik-collab polish, and Soap Box demo prep.

---

## 13. Launch & Campaign Integration

- **URL:** `pulse.eshanjain.in` (subdomain on existing personal domain; neutral branding, no ISB marks).
- **Positioning:** "Built by Eshan (Co'27) — independent candidate initiative. Not an official ISB product."
- **Soap Box demo (May 15):** 60-second live demo — paste a session announcement into the bot, show it appear in the web app, RSVP, show calendar invite land. This *is* the pitch.
- **Manifesto language:** Pulse exists → "Vote to make this the default." Post-election roadmap: cross-campus feed, WA Business API migration, attendance tracking, referrals board.
- **Hritik collaboration:** P2P matching logic lives inside Pulse as a module Hritik co-owns; reference each other in manifestos. (Eshan owns the conversation; no collab pitch needed from Claude.)

---

## 14. Onboarding & UX Principles

**Core belief:** the campaign is judged on product feel, not feature count. Every journey must be seamless, intuitive, short.

**Onboarding — 4 steps, <60 seconds:**
1. **Splash + SSO** — dark gradient, lightning bolt logo, "Sign in with ISB email"
2. **Identity** — section (A–H) + cohort (Mohali/Hyderabad); big emoji cards with `scale-105` select
3. **Interests** — 6 chips: Product 💡, Consulting 📊, Tech 🤖, Careers 🎯, Academics 📚, Social 🎭. Shapes Sessions feed + Discover filters.
4. **Link WhatsApp** — one-tap optional with soft-skip "You can do this later"
5. **Landing** — "Here's what's happening this week" with 3 real seeded sessions. First screen must feel inhabited.

**Micro-interactions (all cheap, all high-impact):**
- Confetti on first RSVP (`canvas-confetti`)
- Skeleton loaders on every data fetch — never spinners
- Page transitions via Framer Motion on route change
- Empty states with voice: *"No sessions yet. Be the one to start 🚀"*
- Haptic feedback on mobile taps (`navigator.vibrate(10)`)
- Social-proof toasts: *"Hritik just RSVP'd to FADM P2P"*
- Session card 3D tilt on desktop hover
- Loading copy that's personality: *"Checking who's cool this week..."*

**Voice & tone** — inherited from `isb-explorer` design system: first person, warm, ISB-aware, emoji-native, 2-sentences-max.

## 15. Open Questions

None blocking. Items deferred to implementation plan:
- Exact prompts for `parseSessionText` (and later, `summarizeTranscript` when transcripts return)
- Specific whitelisted WhatsApp groups — Eshan to curate Day 5
- Initial 30 places for Discover seed — Eshan curates Day 5

---

## 16. Success Criteria

**Campaign:**
- ≥5 real sessions hosted through Pulse by May 20
- ≥100 unique Co'27 logins (25% of Mohali cohort)
- ≥30 WhatsApp-linked accounts
- Live demo at Soap Box goes cleanly end-to-end
- 1-2 organizer testimonials usable in manifesto

**Product (longer term, if elected):**
- 80%+ of cohort peer sessions go through Pulse within 30 days
- Transcript archive reaches 20+ searchable sessions by end of Term 1
- Hyderabad cohort onboarded by end of Term 2
