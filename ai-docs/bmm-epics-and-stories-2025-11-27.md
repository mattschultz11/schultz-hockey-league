# schultz-hockey-league - Epic Breakdown

**Author:** Schultz
**Date:** 2025-11-27
**Project Level:** 2
**Target Scale:** 20-40 stories

---

## Overview

This document provides the complete epic and story breakdown for schultz-hockey-league, decomposing the requirements from the [PRD](./prd.md) into implementable stories.

**Living Document Notice:** This is the initial version. It will be updated after UX Design and Architecture workflows add interaction and technical details to stories.

**Global NFR Expectations (apply to all UI/API stories unless overridden):**

- Page render P75 ≤2s for typical league/season sizes; SSE updates ≤500ms for draft events.
- Accessibility: high contrast, keyboard navigation for core flows.
- Security: role enforcement per FR-016/017/018; audit on write actions.
- Operational: env vars documented; errors observable (logs with requestId/user).

**Per-Epic Success Metrics (mirror PRD):**

- Epic 1: Health endpoint returns OK in dev/prod; role enforcement enabled; audits written for writes.
- Epic 2: 0 draft disputes; live board latency ≤500ms; rosters publish with no missing picks.
- Epic 3: 100% games published pre-season; P75 league/team views ≤2s; no overlapping games per team.
- Epic 4 (Growth): 100% trades audited; no invalid asset duplication; deferable for Level 2.
- Epic 5: ≥95% games have approved stats; P75 stats publish/view ≤2s; approval SLA within agreed window.
- Epic 6 (Growth): Exports complete ≤2s for typical season; dashboards respect publish state; deferable for Level 2.

## Proposed Epic Structure (Value-Focused)

- Epic 1: Foundation & Access
  - Goal: Stand up the app, auth, RBAC, and environments so league users can sign in and the system is deployable.
  - FRs: supports FR16–FR18 indirectly, enables all.
- Epic 2: Draft Board & Rosters
  - Goal: Run in-person drafts with live board, keepers, and roster publication.
  - FRs: FR1–FR8, FR19 (player profiles for draft prep).
- Epic 3: Schedules
  - Goal: Create and publish league and team schedules with clear views and updates.
  - FRs: FR9–FR12, FR20 (multi-season context).
- Epic 4: Trades & Post-Draft Roster Management
  - Goal: Track and approve trades and manage roster changes post-draft.
  - FRs: FR6–FR7, FR19.
- Epic 5: Stats & Results
  - Goal: Capture and display game results and stats with approvals.
  - FRs: FR13–FR15.
- Epic 6: Exports & League Views
  - Goal: Provide exports and league-wide views as a single source of truth.
  - FRs: FR11–FR12, FR21, FR20 (visibility/scoping).

FR Coverage Map (epic → FRs)

- Epic 1: Foundation & Access → FR16–FR18 (enabling), all FRs enabled
- Epic 2: Draft Board & Rosters → FR1–FR8, FR19
- Epic 3: Schedules → FR9–FR12, FR20
- Epic 4: Trades & Post-Draft Rosters → FR6–FR7, FR19
- Epic 5: Stats & Results → FR13–FR15
- Epic 6: Exports & League Views → FR11–FR12, FR21, FR20

---

## Functional Requirements Inventory

- FR1: Admins configure draft order, keeper rules, and tiebreakers per season.
- FR2: Admins view a live draft board showing current pick, available players, draft order, and recent picks.
- FR3: Admins record picks during an in-person draft; updates rosters in real time.
- FR4: Admins allow Team Managers to record their team’s picks (admin override).
- FR5: Admins publish finalized team rosters after draft.
- FR6: Admins manage roster updates post-draft (add/drop players).
- FR7: Admins track and approve trades; trades update rosters once approved.
- FR8: Team Managers view draft order, available players, and current roster.
- FR9: Admins create and publish league-wide season schedule (games, dates, times, locations).
- FR10: Admins update schedules and republish changes (no notifications).
- FR11: Users view full league schedule.
- FR12: Users view team-level schedules filtered to a team.
- FR13: Admins enter or upload game results (scores, penalties, key stats) and publish.
- FR14: Team Managers submit game results/stats for their games, subject to admin approval.
- FR15: Users view published scores, standings, and stat/leaderboard summaries.
- FR16: Admins have full write access (draft, rosters, schedules, stats).
- FR17: Team Managers have limited write (their picks, roster updates as allowed, their game stats submission).
- FR18: Viewers have read-only access (schedules, scores, standings, stats).
- FR19: Admins manage player profiles (ratings, positions) for draft prep.
- FR20: System supports multiple leagues and seasons; UI scopes to selected league with season history.
- FR21: Users can export rosters and schedules for offline/reference use.

---

## FR Coverage Map

- Epic 1: Foundation & Access → FR16, FR17, FR18 (enabling), supports all
- Epic 2: Draft Board & Rosters → FR1, FR2, FR3, FR4, FR5, FR6, FR8, FR19
- Epic 3: Schedules → FR9, FR10, FR11, FR12, FR20
- Epic 4: Trades & Post-Draft Rosters → FR6, FR7, FR19
- Epic 5: Stats & Results → FR13, FR14, FR15
- Epic 6: Exports & League Views → FR11, FR12, FR20, FR21

---

## Epic 1: Foundation & Access

Goal: Stand up the app, auth, RBAC, and environments so league users can sign in and the system is deployable.

### Story 1.1a: Local project setup (MVP)

_Refs: FR-016, FR-017, FR-018 (enabling)_

As an admin, I want the project bootstrapped locally with env configs, so that the app can run in dev.
**Acceptance Criteria:**

1. Given the repo, when I install deps and run `npm run dev`, the app starts with no blocking errors.
2. `.env.example` lists required keys; secrets not in repo.
3. Health endpoint responds within 500ms in dev (performance NFR).
   **Prerequisites:** None.
   **Technical Notes:** Follow architecture doc structure; add health route; verify Prisma connection.

### Story 1.1b: Production deployment baseline (MVP)

_Refs: FR-016, FR-017, FR-018 (enabling)_

As an admin, I want a deployable baseline with Vercel + Neon envs, so that prod runs healthily.
**Acceptance Criteria:**

1. Given Vercel + Neon env vars are configured, the deployed health endpoint responds OK within 500ms.
2. Required env vars documented; missing vars fail fast with clear errors.
3. Build pipeline succeeds and deploys without manual fixes.
   **Prerequisites:** Story 1.1a.
   **Technical Notes:** Deployment config per architecture; smoke check for health route.

### Story 1.2: Auth baseline with roles (MVP)

_Refs: FR-016, FR-017, FR-018_

As an admin, I want login with session cookies and roles (admin/manager/viewer), so that access is enforced per role.
**Acceptance Criteria:**

1. Given a configured NextAuth provider, when a known user signs in, then a session cookie is set and user has a role.
2. When a manager accesses admin-only endpoints, then access is denied with 403.
3. When a viewer accesses read-only pages, then access succeeds without write affordances.
4. Session cookies are httpOnly/secure and role is enforced in API guards (security NFR).
5. Metrics: 100% protected routes enforce role; 0 unauthorized writes observed in audit.
   **Prerequisites:** Story 1.1.
   **Technical Notes:** Role mapping table; middleware/guards on GraphQL/REST per architecture patterns.

### Story 1.3: RBAC enforcement helpers (MVP)

_Refs: FR-016, FR-017, FR-018_

As a developer, I want reusable policy helpers, so that APIs consistently enforce roles.
**Acceptance Criteria:**

1. Given an API handler/resolver, when policy helper is applied, then unauthorized roles get 403.
2. When policies are updated, then all guarded endpoints reflect changes without duplication.
3. Policy helpers support league/season scoping and are covered by unit tests (security NFR).
4. Metrics: 100% guarded endpoints use shared helpers; 0 policy bypasses in audit.
   **Prerequisites:** Story 1.2.
   **Technical Notes:** Centralize policies in `src/auth/policies`; include league/season scoping.

### Story 1.4: Audit and logging baseline (MVP)

_Refs: FR-016 (audit), Security NFR_

As an admin, I want write actions audited and logs correlated, so that changes are traceable.
**Acceptance Criteria:**

1. When a draft/roster/schedule/stats write occurs, an audit entry records actor, target, action, timestamp.
2. Logs include requestId and user context.
3. Audit records are queryable per league/season and stored with retention policy.
4. Metrics: 100% write actions produce audit entries; log coverage observed in smoke tests.
   **Prerequisites:** Story 1.3.
   **Technical Notes:** Add audit table; logging middleware as per architecture doc.

---

## Epic 2: Draft Board & Rosters

Goal: Run in-person drafts with live board, keepers, and roster publication.

### Story 2.1: Configure season draft settings (MVP)

_Refs: FR-001_

As an admin, I want to set draft order, keeper rules, and tiebreakers, so that the draft is configured before it starts.
**Acceptance Criteria:**

1. Given league/season, when I set order and keeper slots, then settings save and are visible on the draft board.
2. Tiebreaker rules stored with season.
3. Validation prevents duplicate picks/slots for the same round.
   **Prerequisites:** Epic 1.
   **Technical Notes:** Prisma models for season/draft settings; validate input.

### Story 2.2: Player catalog for draft prep (MVP)

_Refs: FR-019_

As an admin, I want to manage player profiles (ratings, positions), so that the draft board has an available pool.
**Acceptance Criteria:**

1. CRUD for players with position/ratings; available list feeds draft board.
2. Exports/imports optional later; keep simple list now.
3. Player list searchable by name/position and scoped to league/season.
   **Prerequisites:** Story 2.1.
   **Technical Notes:** Player entity (FR19); basic search/filter.

### Story 2.3: Live draft board view (MVP)

_Refs: FR-002, FR-008_

As an admin, I want a live draft board showing current pick, available players, order, and recent picks, so that the draft runs smoothly.
**Acceptance Criteria:**

1. Board shows current pick, order, recent picks, available players.
2. SSE stream updates board when picks/keeper actions occur (UI updates within 500ms).
3. View-only mode for managers/viewers; admin controls visible only to admins.
4. Access respects role (admin/manager/viewer) per FR-016/017/018.
5. Metrics: P75 SSE update latency ≤500ms during draft; 0 unauthorized board writes.
   **Prerequisites:** Story 2.2.
   **Technical Notes:** SSE per league/season; UI per architecture patterns.

### Story 2.4: Record picks with manager override (MVP)

_Refs: FR-003, FR-004, FR-017_

As an admin/manager, I want to record picks with admin override, so that teams can be selected live.
**Acceptance Criteria:**

1. Managers can record their team’s pick if allowed; admin can override/undo.
2. Pick commits update roster in real time; duplicate pick prevented.
3. Audit entry captured for each pick/override.
4. Metrics: 0 duplicate picks; 0 missing pick audits; P75 pick commit-to-UI update ≤500ms.
   **Prerequisites:** Story 2.3.
   **Technical Notes:** Mutation + SSE broadcast; optimistic UI optional.

### Story 2.5: Publish rosters after draft (MVP)

_Refs: FR-005_

As an admin, I want to publish finalized rosters, so that teams are visible post-draft.
**Acceptance Criteria:**

1. When draft is closed, roster publication flag set; public roster views updated.
2. Export roster list available.
3. Audit entry records publish action.
4. Metrics: 100% teams have rosters published; publish completes without errors.
   **Prerequisites:** Story 2.4.
   **Technical Notes:** Status flag on season; cached roster view invalidated.

### Story 2.6: Post-draft roster edits (MVP)

_Refs: FR-006_

As an admin, I want to add/drop players post-draft, so that rosters stay accurate.
**Acceptance Criteria:**

1. Admin can add/drop; actions audited; roster view updates.
2. Prevent edits on locked seasons; enforce role checks.
   **Prerequisites:** Story 2.5.
   **Technical Notes:** Reuse roster mutation and audit.

---

## Epic 3: Schedules

Goal: Create and publish league and team schedules with clear views and updates.

### Story 3.1: Create season schedule (MVP)

_Refs: FR-009_

As an admin, I want to create league-wide schedules with games, dates, times, and locations, so that the season plan exists.
**Acceptance Criteria:**

1. Create/update games with home/away teams, date/time/location, season/league.
2. Validation prevents overlaps per team at same time.
3. Schedule creation scoped to league/season context.
   **Prerequisites:** Epic 1.
   **Technical Notes:** Prisma models for game/schedule; basic conflict check.

### Story 3.2: Publish and republish schedules (MVP)

_Refs: FR-010_

As an admin, I want to publish and republish schedule changes, so that teams see the latest plan.
**Acceptance Criteria:**

1. Publish flag makes schedules visible; republish updates views.
2. Change audit recorded.
3. Published views refresh within 2s of republish (performance NFR).
   **Prerequisites:** Story 3.1.
   **Technical Notes:** Cache invalidation on publish; ISR revalidation.

### Story 3.3: League schedule view (MVP)

_Refs: FR-011_

As a viewer, I want a league-wide schedule view, so that I can see all games.
**Acceptance Criteria:**

1. Shows all games with filters by date/location; read-only for viewers.
2. Page renders within 2s for typical season size (performance NFR).
3. Metrics: P75 league schedule render ≤2s; 0 auth violations on read-only view.
   **Prerequisites:** Story 3.2.
   **Technical Notes:** GraphQL query + page cache.

### Story 3.4: Team schedule view (MVP)

_Refs: FR-012_

As a viewer/manager, I want a team-specific schedule, so that I can focus on my team’s games.
**Acceptance Criteria:**

1. Filtered view by team; reflects publish state; respects permissions.
2. Page renders within 2s for typical season size (performance NFR).
3. Metrics: P75 team schedule render ≤2s; 0 auth violations on read-only view.
   **Prerequisites:** Story 3.3.
   **Technical Notes:** Team filter param; cache key per team.

### Story 3.5: Multi-season context (MVP)

_Refs: FR-020_

As a viewer, I want to select league + season context, so that I see the right schedule history.
**Acceptance Criteria:**

1. UI/control to select season; data scoped to league/season.
2. Selection persists per user session.
   **Prerequisites:** Story 3.4.
   **Technical Notes:** Scope queries by leagueId/seasonId.

---

## Epic 4: Trades & Post-Draft Rosters

Goal: Track and approve trades and manage roster changes post-draft.

### Story 4.1: Propose trade (Growth - deferable)

_Refs: FR-007_

As an admin/manager, I want to propose a trade between teams, so that trade requests are tracked.
**Acceptance Criteria:**

1. Create trade with from/to teams, assets (players/picks), status pending.
2. Validation ensures assets exist and not duplicated.
3. Audit entry captures trade proposal.
   **Prerequisites:** Epic 2.
   **Technical Notes:** Trade entity; references roster/picks.

### Story 4.2: Approve/reject trade (Growth - deferable)

_Refs: FR-007_

As an admin, I want to approve or reject trades, so that rosters update only when approved.
**Acceptance Criteria:**

1. Admin can approve/reject; audit logged; status updated.
2. Approved trade updates rosters accordingly.
3. Conflict checks prevent trades on already moved assets.
   **Prerequisites:** Story 4.1.
   **Technical Notes:** Transactional update; audit entry.

### Story 4.3: Trade history view (Growth - deferable)

_Refs: FR-007_

As a viewer, I want to see trade status/history, so that league actions are transparent.
**Acceptance Criteria:**

1. List trades with status and involved assets; read-only to viewers.
2. Pagination supports typical season volume.
   **Prerequisites:** Story 4.2.
   **Technical Notes:** GraphQL query; paginated.

### Story 4.4: Post-draft roster adjustment (manual) (Growth - deferable)

_Refs: FR-006, FR-019_

As an admin, I want to adjust rosters manually post-draft, so that corrections are possible.
**Acceptance Criteria:**

1. Admin can add/drop players outside trades; changes audited.
2. Validation prevents invalid roster state (e.g., duplicate players).
   **Prerequisites:** Story 4.2.
   **Technical Notes:** Reuse roster mutation; ensure audit.

---

## Epic 5: Stats & Results

Goal: Capture and display game results and stats with approvals.

### Story 5.1: Submit game results (manager) (MVP)

_Refs: FR-013, FR-017_

As a manager, I want to submit game scores/penalties/stats, so that results are recorded.
**Acceptance Criteria:**

1. Manager can submit results for their games; inputs validated.
2. Submission enters pending state; audit logged.
3. Input validation rejects malformed scores/penalties; errors surfaced to user.
4. Metrics: Submission success rate ≥95% for valid payloads; 0 unauthorized submissions outside role scope.
   **Prerequisites:** Epic 1 (auth), Epic 3 (games exist).
   **Technical Notes:** REST upload optional; form submission allowed.

### Story 5.2: Admin review and approve stats (MVP)

_Refs: FR-014_

As an admin, I want to approve/reject submitted stats, so that published stats are accurate.
**Acceptance Criteria:**

1. Pending submissions visible; admin can approve/reject with reason.
2. Approved results update standings/stats; audit logged.
3. Rejections include required reason; submitter can resubmit.
4. Metrics: Approval SLA met per agreed window; 100% approved stats audited.
   **Prerequisites:** Story 5.1.
   **Technical Notes:** Status transitions; audit.

### Story 5.3: Publish scores and standings (MVP)

_Refs: FR-015_

As a viewer, I want to see published scores and standings, so that the league has transparency.
**Acceptance Criteria:**

1. Read-only views for scores/standings/stat leaders; respects publish state.
2. Page renders within 2s for typical season size (performance NFR).
3. Metrics: P75 scores/standings render ≤2s; 0 auth violations on read-only view.
   **Prerequisites:** Story 5.2.
   **Technical Notes:** GraphQL queries; cached public views.

### Story 5.4a: Upload stats via CSV/JSON (Growth - deferable)

_Refs: FR-013_

As an admin, I want to upload stats files, so that bulk results can be ingested.
**Acceptance Criteria:**

1. REST upload validates MIME/size; parses CSV/JSON; rejects invalid rows with errors.
2. Ingested entries follow same approval flow as manual entries.
3. Upload attempts are audited (who/when/file size/type).
   **Prerequisites:** Story 5.1.
   **Technical Notes:** REST handler; audit uploads.

### Story 5.4b: Upload error reporting and quotas (Growth - deferable)

_Refs: FR-013_

As an admin, I want clear upload error reporting and basic quotas, so that bulk uploads are reliable.
**Acceptance Criteria:**

1. Upload errors return row-level failures with counts and reasons.
2. Rate/size limits enforced to prevent abuse; errors surfaced clearly.
3. Success/failure stats visible in audit/logs with requestId.
   **Prerequisites:** Story 5.4a.
   **Technical Notes:** Consider per-league/season quotas; reuse logging/audit patterns.

---

## Epic 6: Exports & League Views

Goal: Provide exports and league/team visibility as a single source of truth.

### Story 6.1: Export rosters and schedules (Growth - deferable)

_Refs: FR-021, FR-020_

As a user, I want to export rosters and schedules, so that I can reference them offline.
**Acceptance Criteria:**

1. Export endpoints provide CSV/JSON for rosters and schedules scoped by league/season/team.
2. Only authorized roles can export write-sensitive data; viewers can export read-only views.
3. Exports complete within 2s for typical season size (performance NFR).
   **Prerequisites:** Epics 2 and 3.
   **Technical Notes:** REST export; ensure auth and scoping.

### Story 6.2: League/Team overview dashboards (Growth - deferable)

_Refs: FR-011, FR-012, FR-020_

As a viewer, I want league and team overview pages, so that I can see key info at a glance.
**Acceptance Criteria:**

1. League overview shows schedule highlights, standings link, draft/roster links.
2. Team overview shows team schedule, roster, recent results.
3. Overviews load within 2s and respect publish state (performance/accessibility NFR).
4. Metrics: P75 dashboard render ≤2s; 0 stale data after publish within 2s refresh window.
   **Prerequisites:** Epic 2, Epic 3, Epic 5.
   **Technical Notes:** GraphQL queries; cached public pages.

---

## FR Coverage Matrix

- FR1 → Epic 2 (Story 2.1)
- FR2 → Epic 2 (Story 2.3)
- FR3 → Epic 2 (Story 2.4)
- FR4 → Epic 2 (Story 2.4)
- FR5 → Epic 2 (Story 2.5)
- FR6 → Epic 2 (Story 2.6), Epic 4 (Story 4.4)
- FR7 → Epic 4 (Stories 4.1, 4.2)
- FR8 → Epic 2 (Story 2.3)
- FR9 → Epic 3 (Story 3.1)
- FR10 → Epic 3 (Story 3.2)
- FR11 → Epic 3 (Story 3.3), Epic 6 (Story 6.2)
- FR12 → Epic 3 (Story 3.4), Epic 6 (Story 6.2)
- FR13 → Epic 5 (Story 5.1)
- FR14 → Epic 5 (Story 5.1, 5.2)
- FR15 → Epic 5 (Story 5.3)
- FR16 → Epic 1 (Story 1.2)
- FR17 → Epic 1 (Story 1.2), Epic 2 (Story 2.4), Epic 5 (Story 5.1)
- FR18 → Epic 1 (Story 1.2)
- FR19 → Epic 2 (Story 2.2), Epic 4 (Story 4.4)
- FR20 → Epic 3 (Story 3.5), Epic 6 (Story 6.1)
- FR21 → Epic 6 (Story 6.1)

---

## Summary

Epic breakdown complete with 6 epics and 22 stories:

- Epic 1: Foundation & Access — 4 stories (enabling auth/RBAC/audit/deploy)
- Epic 2: Draft Board & Rosters — 6 stories (draft config, player pool, board, picks/override, publish rosters, post-draft edits)
- Epic 3: Schedules — 5 stories (create, publish, league view, team view, multi-season context)
- Epic 4: Trades & Post-Draft Rosters — 4 stories (propose, approve/reject, history, manual adjust)
- Epic 5: Stats & Results — 4 stories (submit, approve, publish, upload)
- Epic 6: Exports & League Views — 2 stories (exports, overview dashboards)

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._

_This document will be updated after UX Design and Architecture workflows to incorporate interaction details and technical decisions._
