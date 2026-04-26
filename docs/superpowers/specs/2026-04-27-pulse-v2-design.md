# Pulse v2 — Soap Box Demo Spec

**Date:** 2026-04-27
**Target demo:** ISB BTC Soap Box, May 15
**Owner:** Eshan Jain (PGP Co'27, BTC President candidate)
**Build window:** 17 days

---

## Goal

Ship the demo loop that makes the cohort go *"wait, what?"* on May 15:

> Drop a sloppy 4-line announcement in a WhatsApp group → 8 seconds later it's a Luma-grade event page with section-tagged RSVPs.

Everything else is supporting tissue.

---

## Architecture (unchanged)

Three units, Supabase as sole shared boundary:

1. **Web App** — React + Vite + TS + Tailwind, Vercel-hosted at `pulse.eshanjain.in`
2. **Pulse Bot** — Node + Baileys, Railway-hosted, dedicated WA number (procuring this week)
3. **Edge Functions** — Supabase Deno, OpenRouter-backed for Claude calls

---

## The Demo Loop (P0)

### 1. Bot detects event in WhatsApp group

Bot is in N groups (no whitelist — bot reads what it's added to). For every group message:

**Trigger heuristic** (must match 2+):
- Contains time keyword: `\b(\d{1,2}\s*(?:am|pm|AM|PM)|tonight|tomorrow|today|morning|evening)\b`
- Contains venue keyword: `\b(LT\s*\d|atrium|room|hall|zoom|teams|online|library|cafe)\b`
- Contains action verb: `\b(join|come|RSVP|all welcome|happening|hosting)\b`
- Length > 60 chars, not a reply to another message

False-positive cost = a 📅 reaction that ages out. Cheap and reversible.

### 2. Bot reacts 📅 in the group + DMs the sender

- Group: silent emoji reaction (Baileys `sendMessage` with reaction payload)
- DM to sender (use sender's JID from `msg.key.participant`):
  - **If sender already linked**: rich preview from Claude parse + "Reply YES to publish, EDIT to fix, NO to skip"
  - **If sender NOT linked yet**: soft-pitch the link first — "I'm Pulse Bot, your cohort uses me to track sessions. Get your code at pulse.eshanjain.in → Profile, then DM me `link 123456`."

Track `bot_dm_pitches` (jid + first_pitched_at) so we never pitch the same person twice.

### 3. On YES → bot publishes + posts to group

- Insert into `sessions` with `creator_id = sender's user_id`, `wa_group_jid = group_jid`
- Send ONE clean message to the group: `✅ Added to Pulse — RSVP here: pulse.eshanjain.in/s/{session_id}`
- The link unfurls into a beautiful OG image preview (event card)

### 4. The event page (Partiful-grade)

Replace the current functional `SessionDetail.tsx` with a sharable, beautiful page:

- Dark gradient hero with big title in serif typeface
- "Hosted by [Name] · Gladiators" with avatar
- When + Where with proper formatting
- RSVP CTA — single tap, confetti animation on success
- **Going-list with section badges**: avatars, names, color-coded section pill (Gladiators=red, Heralds=blue, etc.)
- "5 of your OGSG are going" callout if applicable
- `.ics` download button → calendar add
- Share to WhatsApp button (deep-link with pre-filled message)

OG image generation: Vercel OG endpoint at `/api/og?session={id}` returns a 1200×630 PNG with the event title, time, host. WhatsApp link previews use this.

---

## Section Identity (P0)

Sections are **the** social primitive. Six sections, named:

| Code | Name | Color (suggested) |
|------|------|-------------------|
| G | Gladiators | `#D4621A` (orange) |
| H | Heralds | `#1C3A6E` (navy) |
| I | Imperials | `#7A5000` (amber) |
| J | Jedi | `#1A7A4A` (green) |
| K | Knights | `#6B2C5A` (plum) |
| L | Legends | `#3B5BBA` (blue) |

Surfaced everywhere:
- Onboarding asks for section + OGSG
- ProfilePage shows "Gladiators · OGSG 4"
- SessionCard shows host's section pill
- Going-list shows each attendee's section
- "Visible to" filter on session creation: Everyone / My Section / My OGSG / Custom (multi-select)

**Schema additions:**
```sql
alter table public.users add column if not exists ogsg int check (ogsg between 1 and 12);
alter table public.users add column if not exists location_sharing boolean not null default false;
alter table public.sessions add column if not exists visible_to_sections text[] not null default '{}';
alter table public.sessions add column if not exists visible_to_ogsgs text[] not null default '{}';
```

Section codes stay as `G/H/I/J/K/L` in the DB. UI translates to display names.

---

## Onboarding Quiz (P1)

Replace current bland onboarding. **All questions optional, none mandatory.** 5 screens, ~90 seconds:

| # | Question | Type | Drives |
|---|---|---|---|
| 1 | What section are you in? | Pick 1 of 6 with mascot card | Filtering |
| 2 | OGSG? | Dropdown 1–12 + "Skip" | Filtering |
| 3 | Friday 9PM, your usual move? | Pick: Studying / Club event / Cohort dinner / Party / Sleeping already | Recs + signal |
| 4 | What would you actually show up for? | Multi-select: P2P / Career talks / Open mic / Sports / Food crawl / Treks / Movie nights / Tech demos | Recs |
| 5 | Most chaotic thing you've done at ISB? | Free text, ≤80 chars, optional | Social signal — shown on profile hover |

Each screen has a "Skip" button. Final screen: "Let's go" → land in Sessions tab.

---

## Calendar Invite (P0, .ics version)

`.ics` file generation in-browser, no Outlook Graph integration. One button on event page → downloads `.ics` → user's default calendar app handles the rest.

Implementation: a small `lib/ics.ts` helper that takes session data, builds a valid VCALENDAR/VEVENT string, returns a `Blob` URL.

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Pulse//ISB//EN
BEGIN:VEVENT
UID:{session_id}@pulse.eshanjain.in
DTSTAMP:{now in UTC}
DTSTART:{starts_at in UTC}
DTEND:{ends_at or starts_at + 1h}
SUMMARY:{title}
DESCRIPTION:{description}
LOCATION:{venue}
URL:https://pulse.eshanjain.in/s/{session_id}
END:VEVENT
END:VCALENDAR
```

---

## Azure SSO (P1, via Supabase OAuth)

Supabase has Microsoft as a built-in OAuth provider. No custom MSAL code.

**User journey replacement:**
- Login page: "Sign in with ISB email" button (Microsoft logo)
- Click → Supabase OAuth flow → Azure AD multi-tenant or ISB tenant → callback → user logged in
- Magic link as fallback for users who can't OAuth (still keep the form)

**Setup checklist (Eshan does):**
1. Create Azure App Registration in personal Azure tenant
2. Set redirect URI to `https://ujnrgvmbahbepdnahtle.supabase.co/auth/v1/callback`
3. Note Client ID + Client Secret
4. Paste into Supabase Dashboard → Auth → Providers → Azure
5. Restrict to `@isb.edu` domain via tenant config or Supabase email filter

**Code changes:** Add `signInWithAzure()` to `useAuth.ts`. Add Azure button to `Login.tsx`. Done.

---

## Bug fixes (P0)

1. `location_sharing` column missing — handled in schema additions above
2. ProfilePage shows raw LID in "Linked (+213386960847015@lid)" — replace with "Linked ✓" only, no ID
3. Dead code removal: `GoingPage.tsx`, `MapPage.tsx` (not in nav, never reached)
4. Discover hardcoded — replace with `places` table query
5. Test sessions in DB — clean up the 5 "Sukhna Lake" test rows

---

## Discover tab improvements (P1)

- Show real `places` rows from DB (not hardcoded)
- Each card has "Open in Maps" button (uses `google_maps_url` if set, else builds maps.google.com query from name+area)
- Each card has "Host event here" button → opens SessionNew with venue pre-filled

---

## Out of scope (post-election)

- Heatmap + location sharing UI
- Outlook Graph mass-email
- Personality matchmaking based on quiz answers
- Session transcript summarization
- Native iOS/Android app

These are post-election. Not in this plan.

---

## Success metrics (May 15)

- ≥3 real sessions posted via bot auto-detect (not manual)
- ≥30 cohort members logged in
- ≥10 WhatsApp accounts linked
- 1 successful soap-box demo where the audience watches the loop happen live

---

## Open questions

None. Lock and load.

---

## Self-review

**Spec coverage:** All four elevated features (bot auto-detect, beautiful event page, section identity, onboarding quiz) covered + calendar invite + Azure SSO + bug fixes. ✓

**Internal consistency:** Section schema (`text[]` for `visible_to_sections`) consistent across UI and bot. Section codes G/H/... stable. ✓

**Scope check:** 17 days for ~10 work-units. Aggressive but achievable if Phase 1 ships by day 7. ✓

**Ambiguity check:** Bot DM flow specified for both linked + unlinked sender cases. Calendar = `.ics` only (no Outlook Graph). Section colors finalized. ✓
