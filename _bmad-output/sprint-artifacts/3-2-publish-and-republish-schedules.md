# Story 3.2: Publish and Republish Schedules

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **admin**,
I want to send a "schedule is ready" email to players (and resend when it changes),
so that players are notified that the season schedule has been published or updated and can follow the link to the always-up-to-date website view.

**Epic Context:** Epic 3 — Schedules (story 2 of 5). Story 3.1 shipped the admin CRUD for games and the unified public/admin schedule view at `/leagues/[leagueSlug]/seasons/[seasonSlug]/games` — the public page reads Prisma on every request (no caching), so changes are already visible in real time. Story 6.4 shipped the full email integration (Mailgun + `sendBulkEmail` mutation + compose UI at `/admin/email` + history at `/admin/email/history`). This story therefore reduces to **adding a new HTML email template** (`schedule-published.html`) that admins copy into the existing compose flow. **There is no new backend, no database migration, no `published` flag, and no ISR/cache work** — all of those were ruled out by decisions carried into 3.1 and by the real-time posture of the existing public page. **An earlier draft of this story included an "Email Schedule" button on the admin schedule page + query-param deep-link to `/admin/email`; that entry point was dropped during code review (see Change Log 2026-04-21).** Admins reach `/admin/email` via existing navigation.

## Acceptance Criteria

1. **Given** the new template file `src/service/email/templates/schedule-published.html` exists
   **When** an admin opens it in an editor (or copies its content into the `/admin/email` compose body)
   **Then** the template is a standalone, inline-styled, email-client-safe HTML document matching the visual conventions of the existing templates (`season-confirmation.html`, `rate-skate-confirmation.html`, `game-day.html`)
   **And** it uses only the template variables already supported by `emailService.renderTemplate` (dot-path substitution — no loops, no conditionals)

2. **Given** an admin pastes the `schedule-published.html` body into the compose form, selects a season and recipients, and sends
   **When** each recipient receives the email
   **Then** the greeting personalizes with `{{player.user.firstName}}`
   **And** the header shows `{{player.season.league.name}}` and `{{player.season.name}}`
   **And** the CTA button links to `{{baseUrl}}/leagues/{{player.season.league.slug}}/seasons/{{player.season.slug}}/games`
   **And** the footer matches the brand style of the other templates

3. **Given** an admin sends the schedule email twice for the same season (publish, then republish after changes)
   **When** the admin views `/admin/email/history`
   **Then** both sends are listed as separate `EmailSend` rows with timestamps and recipient counts
   **And** each send also produced an `AuditLog` entry via the existing `sendBulkEmail` resolver path (automatic — no new audit code needed)

4. **Given** the template is rendered via `emailService.sendBulkTemplatedEmail` (existing flow)
   **When** a token resolves to `null`/`undefined` (e.g., a player with no team → `player.team.name`)
   **Then** the token renders as empty string without crashing (per existing `renderTemplate` behavior — already unit-tested in `test/service/email/emailService.test.ts`)

5. **Given** an admin pastes `schedule-published.html` into the compose body
   **When** the compose page auto-generates the plain-text fallback
   **Then** anchor tag URLs are preserved in the text as `link text (url)` format
   **And** the CTA URL is still discoverable for plain-text email clients

## Tasks / Subtasks

- [x] **Task 1: Add `schedule-published.html` template** (AC: #1, #2, #4)
  - [x] Create `src/service/email/templates/schedule-published.html`
  - [x] Mirror the table-based, inline-styled structure from `src/service/email/templates/season-confirmation.html` (closest analog — single CTA button + personalized greeting + header/footer)
  - [x] Header: league name `{{player.season.league.name}}` + subtitle `Schedule — {{player.season.name}}`
  - [x] Body: personalized greeting `Hi {{player.user.firstName}},`, one short paragraph. Copy softened during code review (L1) to avoid coupling to the current no-cache posture — now reads "The schedule page always shows the latest version" (was "stays up to date automatically — just refresh").
  - [x] CTA button linking to `{{baseUrl}}/leagues/{{player.season.league.slug}}/seasons/{{player.season.slug}}/games` — style identical to `season-confirmation.html`
  - [x] Footer: `{{player.season.league.name}} — {{player.season.name}}` (matches convention)
  - [x] Contact line: `support@schultzhockey.com` link (matches convention)
  - [x] Publish/republish-neutral wording — same template works for first publish and subsequent updates. Do NOT create two separate templates.
  - [ ] Validate in Gmail, Outlook web, and Apple Mail using Mailgun test sends. _(deferred to user — mail-client render verification per project convention)_

- [x] **Task 2: ~~Add "Email Schedule" action on the admin schedule page~~** _(DROPPED — see Change Log 2026-04-21)_
  - Original plan was to add an "Email Schedule" button on `src/components/GamesHeader.tsx` deep-linking to `/admin/email?leagueId=…&seasonId=…`. User decided against adding a dedicated entry point during code-review iteration; admins reach `/admin/email` via existing navigation. No code changes to `GamesHeader.tsx` in this story.

- [x] **Task 3: ~~Wire query params into `/admin/email` compose page~~** _(ROLLED BACK — see Change Log 2026-04-21)_
  - Original plan was to pre-select league/season from `?leagueId=&seasonId=` query params. A first pass added a `<Suspense>` wrapper + `useSearchParams()` + lazy-`useState` init; on code review that code was orphaned (Task 2 was dropped, no UI produces the URL), so it was rolled back to the original `useState("")` initializers. Zero net change to `/admin/email` for league/season selection behavior.

- [x] **Task 4: Tests + code-review fix** (AC: #1, #2, #5)
  - [x] Unit test in `test/service/email/emailService.test.ts`: reads `schedule-published.html` via `fs.readFileSync`, calls `renderTemplate` against a full `templateData` fixture, asserts substitutions and no leftover `{{…}}` tokens (2 new tests)
  - [x] Improved `htmlToPlainText` in `src/app/admin/email/page.tsx` (code-review M2): anchor tags now become `text (url)` so plain-text clients see the CTA URL; also added `</tr>`, `</table>`, `&mdash;`, `&rsquo;` handling and trailing-whitespace cleanup. Benefits the new template AND the three existing HTML-heavy templates.
  - [x] `npm test -- --runInBand` — 425/425 pass (+2 new tests, 0 regressions)
  - [x] `npm run typecheck` clean
  - [x] `npm run lint` clean

- [ ] **Task 5: Manual verification** _(user-owned per project convention)_ (AC: #1, #2, #3)
  - [ ] Copy `schedule-published.html` content into `/admin/email` body, pick a season, pick a small recipient set, send. Verify the email renders correctly in at least one mail client.
  - [ ] Send twice for the same season; confirm two rows appear in `/admin/email/history`.

## Dev Notes

### Scope — what this story does NOT do

The epic text (see `_bmad-output/epics.md` lines 611–639) prescribed ACs for a `published` flag, ISR caching, and cache invalidation on republish. **All of those are ruled out.** The rationale, carried forward from 3.1 and confirmed by the user in this story's kickoff:

- **No `published` flag on `Game`.** Story 3.1's public schedule page reads Prisma on every request (see `src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/games/page.tsx` — no `revalidate` directive, no `cache: "force-cache"`). Games are visible to all users as soon as they are created/edited. Adding a `published` boolean now would mean either (a) breaking the current "always live" UX or (b) adding a flag that defaults to `true` and is never flipped — dead weight.
- **No ISR / `revalidateTag`.** Follows from the above. There is no cached page to invalidate.
- **No new `publishSchedule` / `republishSchedule` GraphQL mutation.** The "publish event" in this product is the email send. The existing `sendBulkEmail` mutation already audits and records history.
- **No inline games list in the email.** `emailService.renderTemplate` (see `src/service/email/emailService.ts:236-246`) only supports dot-path token substitution — no loops, no conditionals. Rendering a variable-length games table inside the template would require either extending the template engine or pre-rendering an HTML fragment server-side; both are out of scope. The email links to the live schedule page instead. If inline games become a user request, carve it out as a separate story.
- **No new template engine features.** Do not add Handlebars, Liquid, MJML, or similar. Keep parity with the three existing templates.

### Existing infrastructure (already in place)

- **Email service**: `src/service/email/emailService.ts` — `sendEmail`, `sendBulkEmail`, `sendBulkTemplatedEmail`, `renderTemplate`. The "templated" variant fetches players by email + seasonId, builds per-recipient `templateData = { baseUrl, player: { ... } }`, renders html/subject/text per recipient, sends individually, persists `EmailSend` + `EmailRecipient` rows, and writes an `AuditLog` entry. See lines 115–234.
- **GraphQL wiring**: `src/graphql/resolvers.ts:247-270` — `sendBulkEmail` mutation gated by `PolicyName.ADMIN` and validated by `sendBulkEmailSchema` (`src/service/validation/schemas.ts:294-300`). Input: `seasonId`, `recipientEmails[]`, `subject`, `html`, optional `text`.
- **Admin compose UI**: `src/app/admin/email/page.tsx` — league/season cascading selects, player filter + table + checkbox selection, subject input, HTML textarea, optional preview, confirmation modal, send. This is the entry point admins already know.
- **History**: `src/app/admin/email/history/page.tsx` + `[id]/page.tsx` — list + detail views.
- **Existing templates**: `src/service/email/templates/{season-confirmation,rate-skate-confirmation,game-day}.html`. All three are standalone HTML documents with inline styles. They are NOT loaded from disk at runtime by the app — admins open the file, copy the `<html>…</html>` body, and paste it into the compose textarea. (The one runtime consumer of the templates directory is Task 4's test, which will `readFileSync` the file for assertion purposes only.)
- **Audit**: The `sendBulkEmail` resolver already writes `AuditLog` via `sendBulkTemplatedEmail` (emailService.ts:225-231). No additional audit wiring needed.

### Architecture Compliance

- **Template convention**: Follow the existing three templates' structure: outer `<table>` with `role="presentation"`, 600px inner table, header/body/footer sections, inline styles only (no `<style>` block — email clients strip them inconsistently), brand colors `#18181b` (header background), `#3b82f6` (CTA button), `#27272a` (body text), `#a1a1aa` (footer muted). Match `season-confirmation.html` line-for-line where possible — it is the closest analog (single-CTA email).
- **Template variables**: Only use dot-path tokens supported by `renderTemplate` and populated by `sendBulkTemplatedEmail`: `baseUrl`, `player.user.firstName`, `player.user.lastName`, `player.user.email`, `player.season.name`, `player.season.slug`, `player.season.league.name`, `player.season.league.slug`, `player.team.name`, `player.team.slug`, `player.number`, `player.position`, `player.classification`, `player.id`. See `emailService.ts:136-164` for the exact shape.
- **Admin route gating**: `/admin/email` is already gated elsewhere (existing middleware + page-level check — do not re-verify here, it is outside this story's scope). The "Email Schedule" link on the schedule page is already within the `isAdmin` conditional — mirrors the "New Game" button added in 3.1.
- **Deep-linking via query params**: The only admin page that currently uses `useSearchParams` for league/season scoping is `AdminGamesTable`. Follow its pattern for the pre-select effect in `/admin/email`, but guard with a `useRef<boolean>(false)` so admin-initiated dropdown changes aren't clobbered by the effect re-running.
- **No server-side rendering of email HTML**: The compose UI is a client component and admin pastes raw HTML. Do not server-render the template in this story. (If we later decide to auto-populate subject + body via a link like `/admin/email?template=schedule-published`, that's a separate enhancement with server → client handoff that needs its own design.)

### Library & Framework Requirements

- **No new packages.** `mailgun.js`, `form-data`, HeroUI, Apollo — all installed via 6.4 and 3.1. The only new artifact is one `.html` file + minimal edits to two existing `.tsx` files.
- **Next 16 `useSearchParams`** — already in use elsewhere; the admin email page edit will adopt it.

### File Structure

```
NEW:
  src/service/email/templates/schedule-published.html   # Publish/republish template; CTA links to live schedule

MODIFIED:
  src/app/admin/email/page.tsx                          # Improved htmlToPlainText (anchors → "text (url)", table/tr breaks, more entity decodes)
  test/service/email/emailService.test.ts               # +2 tests covering schedule-published.html render

NOT MODIFIED (explicitly):
  src/components/GamesHeader.tsx                        # No "Email Schedule" button — entry point dropped during review
  prisma/schema.prisma                                  # No published flag, no new tables
  src/graphql/type-defs.mjs                             # No new mutation
  src/graphql/resolvers.ts                              # No new resolver
  src/service/email/emailService.ts                     # No engine changes; existing renderTemplate sufficient
  src/service/validation/schemas.ts                     # No new input schema
```

### Testing Requirements

- **Location**: `test/service/email/emailService.test.ts` — add one test that reads the new template from disk and asserts the rendered output contains expected substitutions and no residual `{{…}}` tokens.
- **Fixture shape**: mirror exactly what `sendBulkTemplatedEmail` builds (emailService.ts:136-164) — full `{ baseUrl, player: { id, number, position, classification, user: {…}, season: { slug, name, league: { slug, name } }, team: { slug, name } } }`. Don't shortcut with a shallow object; the test should also protect against future token additions that depend on the full shape.
- **Coverage**: email services already meet thresholds via 6.4's suite. No new coverage floor needed.
- **No component tests** — project has no `test/components/` directory.

### Gotchas

- **Template files are NOT loaded at runtime by the app.** They exist as HTML sources that admins copy-paste into the compose textarea. The only runtime consumer of the `templates/` directory is the new Jest test this story adds. Do NOT add a `fs.readFileSync("templates/schedule-published.html")` call into any code path under `src/service/` — it would break Next.js bundling for Vercel. Keep the read confined to the test file.
- **`renderTemplate` returns empty string for undefined/null tokens** (see `emailService.ts:237-245` and existing test at `test/service/email/emailService.test.ts:102-109`). This means a player with no team will render an empty `{{player.team.name}}`. Our template must not rely on `player.team.name` (or any other token that can legitimately be absent) in a way that would leave broken copy — e.g., avoid `Your team is {{player.team.name}}` since "Your team is" with an empty value reads badly. Use only season/league tokens in visible copy and `player.user.firstName` for the greeting.
- **`{{baseUrl}}` defaults to `http://localhost:3000`** in emailService.ts:135 if `NEXTAUTH_URL` is not set. In production on Vercel, `NEXTAUTH_URL` is set to the deployed domain — links in sent emails resolve correctly. Do NOT hardcode `https://schultzhockey.com` in the template.
- **Query-param pre-select must be idempotent and must not fight the admin's dropdown changes.** Guard with a `useRef<boolean>(false)` that flips true once the effect has applied the params; subsequent `onSelectionChange` events from admin clicks are not re-overridden.
- **`useSearchParams` is a client hook** — the admin compose page is already `"use client"`, so this works without a wrapper. If you add it inside a server component anywhere, wrap the subtree in `Suspense` (not needed here).
- **Per-recipient render happens server-side** in `sendBulkTemplatedEmail` before calling Mailgun. `{{player.user.firstName}}` etc. are NOT Mailgun recipient-variable tokens — they are substituted by our `renderTemplate` before the Mailgun API call. Don't confuse the two systems. See `emailService.ts:115-200` for the full flow.
- **Schema has `datetime` (single field), not `date` + `time`.** Story 3.1 originally kept them split; commit `aab3b43 "Add game schedule admin + combine date/time into single datetime"` merged them. This is not directly relevant to this story (no schema changes), but if any future work on inline games embedding comes back, use `game.datetime` (single `DateTime`), not the now-removed pair.
- **Admin discoverability**: besides the new button on the schedule page, admins can still reach `/admin/email` from wherever they reach it today (top nav, bookmark, etc.) — we are not building a dedicated "schedule email" landing page. If admins find the "open compose, pick season, copy HTML, paste" flow too manual, a follow-up story can add a one-click "Send schedule email for this season" action.

### Previous Story Intelligence

From **3.1 (Create Season Schedule)**:

- The unified public/admin schedule page already routes `isAdmin` conditionals — the new "Email Schedule" button slots in next to "New Game" trivially. See `src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/games/page.tsx`.
- `GamesSection` uses `searchParams` + `useRef<boolean>(didMount)` to avoid rewriting the URL on mount. Use the same `useRef` guard pattern in the `/admin/email` pre-select effect to avoid fighting admin-initiated selection changes (H1 in 3.1's review fixes).

From **6.4 (Email Integration)**:

- The email compose page is `"use client"` — cannot import from `@/service/prisma` or server-only modules. Pre-select logic must stay in the client component using Apollo queries already present on the page.
- All email sends go through `sendBulkTemplatedEmail`, which handles audit, history, per-recipient template rendering, and failure capture in one service call. Don't try to invent a parallel pathway.
- Template variables are **scalar only** — no array iteration, no conditional blocks. A cross-recipient constant (e.g., first game date) can be baked directly into the copy or added later as a new token if needed.

From **2.5 (Admin Player Edit)** via 3.1:

- Apollo error messages are stripped with `err.message.replace(/^[^:]+:\s*/, "")` — project-wide convention. Relevant only if new error-handling UI is introduced, which this story does not do.

### Git Intelligence Summary

- `aab3b43` (current HEAD) — admin schedule CRUD from 3.1; the `isAdmin` conditional + admin/public unified schedule page is the entry point this story builds on.
- `2ec110d Rate skate confirmation` and `3e2eba3 Add player season confirmation flow with email template` established the pattern used by `season-confirmation.html` and `rate-skate-confirmation.html` — single CTA button, personalized greeting, brand header/footer. `schedule-published.html` should be a near clone of `season-confirmation.html` in structure, differing mainly in copy and CTA target.
- `3de1f28 Add email integration with Mailgun, player filtering, and template rendering` — the 6.4 commit. All backend and compose UI for this story already landed here.
- Commit hygiene note from 3.1's review: aim for a descriptive commit message on this story's single commit (one template file + two small UI edits → subject like `Add schedule-published email template + admin schedule → email deep-link`).

### Project Context Reference

No `**/project-context.md` file exists at the project root. Follow conventions in `CLAUDE.md` and project memory:

- GraphQL Yoga + Prisma 7 + Effect library
- `withPolicy()` HOF wraps mutations with RBAC — already applied to `sendBulkEmail`; this story adds no new mutations
- HeroUI + Tailwind for UI
- Jest 30 + `@ngneat/falso`; run with `npm test -- --runInBand`
- Test factories in `test/modelFactory.ts` — not needed for this story (no DB fixtures required)

### References

- [Source: _bmad-output/epics.md#Story-3.2 lines 611–639] — Original epic ACs (superseded by this story's reframing — see Scope section above)
- [Source: _bmad-output/sprint-artifacts/3-1-create-season-schedule.md] — Dev Notes "Caching / ISR Posture" section establishes no-published-flag, no-ISR stance this story inherits
- [Source: _bmad-output/sprint-artifacts/6-4-email-integration.md] — Full email infrastructure this story rides on
- [Source: src/service/email/emailService.ts:115-246] — `sendBulkTemplatedEmail` + `renderTemplate` (the only backend this story touches — via test only)
- [Source: src/service/email/templates/season-confirmation.html] — Closest structural analog; clone its layout
- [Source: src/service/email/templates/rate-skate-confirmation.html] — Second analog; also a single-CTA email
- [Source: src/service/email/templates/game-day.html] — Reference for more complex layouts, but NOT a template for this story (hardcodes games for a specific date — wrong pattern for a publish-schedule email)
- [Source: src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/games/page.tsx] — Unified public/admin schedule page; add "Email Schedule" button inside existing `isAdmin` block
- [Source: src/app/admin/email/page.tsx] — Compose UI; add `useSearchParams` pre-select for leagueId + seasonId
- [Source: src/graphql/resolvers.ts:247-270] — `sendBulkEmail` mutation; no changes, reference only
- [Source: src/service/validation/schemas.ts:294-300] — `sendBulkEmailSchema`; no changes, reference only
- [Source: test/service/email/emailService.test.ts:81-125] — Existing `renderTemplate` tests; extend with a `schedule-published.html` render test

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context)

### Debug Log References

- Template file is not loaded by any runtime code path; confirmed by grepping — the only on-disk consumer is the new Jest test. Per Dev Notes gotcha, the `fs.readFileSync` is confined to the test file.
- First-pass implementation added an "Email Schedule" button in `GamesHeader.tsx` + `<Suspense>` + `useSearchParams` + lazy-init for deep-link query-param pre-select in `/admin/email`. Both were removed during code review — user decided against the dedicated entry point; without it the query-param code was orphaned. Net code-diff for this story is the template file + `htmlToPlainText` improvement + 2 tests.
- Lint rule `react-hooks/set-state-in-effect` (project-wide) blocks `setState` inside `useEffect`. During the first-pass lazy-init refactor this forced a switch away from the story's originally-prescribed `useEffect`+`useRef` pattern. Note retained for any future story that needs URL-seeded state.

### Completion Notes List

- **Task 1 (template)**: Added `src/service/email/templates/schedule-published.html`. Structure mirrors `season-confirmation.html`: 600px table, inline styles, header `#18181b`, single CTA button `#3b82f6`, muted footer. Copy is publish/republish-neutral — same template works for first publish and subsequent updates. CTA links to `{{baseUrl}}/leagues/{{player.season.league.slug}}/seasons/{{player.season.slug}}/games`. Copy softened during review (L1) — removed the "just refresh" promise that tied copy to the current no-cache posture.
- **Task 2 (admin button)**: Dropped during review. No changes to `GamesHeader.tsx`. Admins reach `/admin/email` via existing navigation.
- **Task 3 (query-param pre-select)**: Rolled back during review. `/admin/email/page.tsx` is back to its original `useState("")` initializers — no `Suspense`, no `useSearchParams`, no lazy init. No behavior change for admins who already use the page.
- **Task 4 (tests + M2 fix)**: 2 new Jest tests cover the new template. Also improved `htmlToPlainText` in `/admin/email/page.tsx` (code-review M2) — anchor tags now serialize as `text (url)` so plain-text clients keep the CTA URL; added `</tr>`, `</table>`, `&mdash;`, `&rsquo;` handling. This is a net improvement for the three existing HTML-heavy templates as well. Full suite: 425 passing (was 423 on main).
- **Task 5 (manual verification)**: Deferred to Matt. Two items remain: mail-client render check via a live Mailgun send, and the duplicate-send → history check. The non-admin access check was dropped along with the button.

**Scope outcome**: Story delivers exactly one production artifact (`schedule-published.html`) plus one cross-template plain-text quality fix. Original dual-scope plan (template + admin deep-link) was narrowed during review.

### File List

**New:**

- `src/service/email/templates/schedule-published.html` — publish/republish email template (clone of `season-confirmation.html` layout with a "View Schedule" CTA)

**Modified:**

- `src/app/admin/email/page.tsx` — `htmlToPlainText` preserves anchor URLs as `text (url)`; also handles table-row breaks and additional HTML entities. Fixes code-review M2 for this template and all pre-existing ones.
- `test/service/email/emailService.test.ts` — added `schedule-published.html template` describe block (2 tests: substitution correctness + no residual tokens)

**Not modified (explicitly):**

- `src/components/GamesHeader.tsx` — no "Email Schedule" button (entry point dropped)
- `prisma/schema.prisma` — no `published` flag (real-time schedule, per Dev Notes Scope)
- `src/graphql/type-defs.mjs`, `src/graphql/resolvers.ts` — no new mutation (reused `sendBulkEmail`)
- `src/service/email/emailService.ts` — no engine changes; existing `renderTemplate` handles everything
- `src/service/validation/schemas.ts` — no new input schema

### Change Log

- 2026-04-21: Story 3.2 initial pass — template + admin deep-link button + query-param pre-select. 425 tests passing.
- 2026-04-21: Code review (adversarial). 2 HIGH + 2 MEDIUM + 2 LOW findings. H1 (button not actually committed to `GamesHeader.tsx` despite being listed in File List) triggered a scope decision.
- 2026-04-21: Review fixes applied.
  - **Scope narrow**: Dropped the "Email Schedule" admin entry point (Task 2) per user decision. AC #1 and AC #5 removed; ACs renumbered.
  - **M1** Rolled back the orphaned query-param pre-select code in `/admin/email/page.tsx` — removed `<Suspense>`, `useSearchParams`, lazy init. Page back to original `useState("")` initializers.
  - **M2** Improved `htmlToPlainText`: anchor tags → `text (url)`, `</tr>` / `</table>` → newline, added `&mdash;` / `&rsquo;` entities, added trailing-space cleanup. New AC #5 pins the behavior.
  - **L1** Template body copy softened from "stays up to date automatically — just refresh" to "always shows the latest version" — no longer couples emailed copy to an architectural posture that may change.
  - **L2 noted, not fixed**: CTA button color stays `#3b82f6` (blue) to match the other three templates. Epic UX spec mandates teal `#16A394` as primary — flag for a future cross-template brand-sync pass.
  - File List + Completion Notes rewritten to match git reality. 425/425 tests still pass; typecheck + lint clean.

## Senior Developer Review (AI)

**Reviewer:** Matt
**Date:** 2026-04-21
**Outcome:** Approved after scope narrow + fixes applied.

**Findings summary (pre-fix):**

- **H1** (HIGH) — Task 2 marked `[x]` but `GamesHeader.tsx` had no git changes; AC #1 not satisfied.
- **H2** (HIGH) — AC #5 vacuously passing (no button → no `isAdmin` gate to verify).
- **M1** (MEDIUM) — Query-param pre-select in `/admin/email` orphaned (no UI path produced the deep-link URL).
- **M2** (MEDIUM) — `htmlToPlainText` stripped anchor tags entirely — CTA URLs disappeared in plain-text fallback.
- **L1** (LOW) — Template copy coupled tightly to current no-cache posture; fragile to future architectural changes.
- **L2** (LOW) — CTA color (`#3b82f6` blue) doesn't match epic UX primary (`#16A394` teal) — inherited cross-template inconsistency.

**Action Items:**

- [x] [AI-Review][HIGH] H1: Scope narrow — drop the "Email Schedule" admin button and AC #1/#5 instead of re-adding the button (user decision).
- [x] [AI-Review][HIGH] H2: Removed along with AC #1 when the button was dropped.
- [x] [AI-Review][MEDIUM] M1: Removed orphaned `<Suspense>` + `useSearchParams` + lazy-init code from `src/app/admin/email/page.tsx`. [page.tsx:30-31,157-163]
- [x] [AI-Review][MEDIUM] M2: `htmlToPlainText` now serializes anchor tags as `text (url)`, breaks on `</tr>` / `</table>`, decodes additional entities. [page.tsx:250-267]
- [x] [AI-Review][LOW] L1: Body copy softened — "stays up to date automatically — just refresh" → "always shows the latest version". [schedule-published.html:50]
- [ ] [AI-Review][LOW] L2: Cross-template brand-sync pass (blue → teal) deferred to a dedicated future story. Not actioned in 3.2.
