# schultz-hockey-league - Epic Breakdown

**Author:** Schultz
**Date:** 2025-11-27
**Project Level:** 2
**Target Scale:** 20-40 stories

---

## Overview

This document provides the complete epic and story breakdown for schultz-hockey-league, decomposing the requirements from the [PRD](./PRD.md) into implementable stories.

**Living Document Notice:** This is the initial version. It will be updated after UX Design and Architecture workflows add interaction and technical details to stories.

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

### Story 1.1: Project setup and environments

As an admin, I want the project bootstrapped with env configs and deployment target, so that the league app can build and run in dev and prod.
**Acceptance Criteria:**

- Given the repo, when I install deps and run `npm run dev`, then the app starts with no blocking errors.
- Given Vercel + Neon env vars are configured, when deployed, then health endpoint responds OK.
- Then secrets live in env (not repo) and `.env.example` lists required keys.
  **Prerequisites:** None.
  **Technical Notes:** Follow architecture doc structure; add health route; verify Prisma connection.

### Story 1.2: Auth baseline with roles

As an admin, I want login with session cookies and roles (admin/manager/viewer), so that access is enforced per role.
**Acceptance Criteria:**

- Given a configured NextAuth provider, when a known user signs in, then a session cookie is set and user has a role.
- When a manager accesses admin-only endpoints, then access is denied with 403.
- When a viewer accesses read-only pages, then access succeeds without write affordances.
  **Prerequisites:** Story 1.1.
  **Technical Notes:** Role mapping table; middleware/guards on GraphQL/REST per architecture patterns.

### Story 1.3: RBAC enforcement helpers

As a developer, I want reusable policy helpers, so that APIs consistently enforce roles.
**Acceptance Criteria:**

- Given an API handler/resolver, when policy helper is applied, then unauthorized roles get 403.
- When policies are updated, then all guarded endpoints reflect changes without duplication.
  **Prerequisites:** Story 1.2.
  **Technical Notes:** Centralize policies in `src/auth/policies`; include league/season scoping.

### Story 1.4: Audit and logging baseline

As an admin, I want write actions audited and logs correlated, so that changes are traceable.
**Acceptance Criteria:**

- When a draft/roster/schedule/stats write occurs, then an audit entry records actor, target, action, timestamp.
- Logs include requestId and user context.
  **Prerequisites:** Story 1.3.
  **Technical Notes:** Add audit table; logging middleware as per architecture doc.

---

## Epic 2: Draft Board & Rosters

Goal: Run in-person drafts with live board, keepers, and roster publication.

### Story 2.1: Configure season draft settings

As an admin, I want to set draft order, keeper rules, and tiebreakers, so that the draft is configured before it starts.
**Acceptance Criteria:**

- Given league/season, when I set order and keeper slots, then settings save and are visible on the draft board.
- Tiebreaker rules stored with season.
  **Prerequisites:** Epic 1.
  **Technical Notes:** Prisma models for season/draft settings; validate input.

### Story 2.2: Player catalog for draft prep

As an admin, I want to manage player profiles (ratings, positions), so that the draft board has an available pool.
**Acceptance Criteria:**

- CRUD for players with position/ratings; available list feeds draft board.
- Exports/imports optional later; keep simple list now.
  **Prerequisites:** Story 2.1.
  **Technical Notes:** Player entity (FR19); basic search/filter.

### Story 2.3: Live draft board view

As an admin, I want a live draft board showing current pick, available players, order, and recent picks, so that the draft runs smoothly.
**Acceptance Criteria:**

- Board shows current pick, order, recent picks, available players.
- SSE stream updates board when picks/keeper actions occur.
- View-only mode for managers/viewers; admin controls visible only to admins.
  **Prerequisites:** Story 2.2.
  **Technical Notes:** SSE per league/season; UI per architecture patterns.

### Story 2.4: Record picks with manager override

As an admin/manager, I want to record picks with admin override, so that teams can be selected live.
**Acceptance Criteria:**

- Managers can record their team’s pick if allowed; admin can override/undo.
- Pick commits update roster in real time; duplicate pick prevented.
  **Prerequisites:** Story 2.3.
  **Technical Notes:** Mutation + SSE broadcast; optimistic UI optional.

### Story 2.5: Publish rosters after draft

As an admin, I want to publish finalized rosters, so that teams are visible post-draft.
**Acceptance Criteria:**

- When draft is closed, roster publication flag set; public roster views updated.
- Export roster list available.
  **Prerequisites:** Story 2.4.
  **Technical Notes:** Status flag on season; cached roster view invalidated.

### Story 2.6: Post-draft roster edits

As an admin, I want to add/drop players post-draft, so that rosters stay accurate.
**Acceptance Criteria:**

- Admin can add/drop; actions audited; roster view updates.
  **Prerequisites:** Story 2.5.
  **Technical Notes:** Reuse roster mutation and audit.

---

## Epic 3: Schedules

Goal: Create and publish league and team schedules with clear views and updates.

### Story 3.1: Create season schedule

As an admin, I want to create league-wide schedules with games, dates, times, and locations, so that the season plan exists.
**Acceptance Criteria:**

- Create/update games with home/away teams, date/time/location, season/league.
- Validation prevents overlaps per team at same time.
  **Prerequisites:** Epic 1.
  **Technical Notes:** Prisma models for game/schedule; basic conflict check.

### Story 3.2: Publish and republish schedules

As an admin, I want to publish and republish schedule changes, so that teams see the latest plan.
**Acceptance Criteria:**

- Publish flag makes schedules visible; republish updates views.
- Change audit recorded.
  **Prerequisites:** Story 3.1.
  **Technical Notes:** Cache invalidation on publish; ISR revalidation.

### Story 3.3: League schedule view

As a viewer, I want a league-wide schedule view, so that I can see all games.
**Acceptance Criteria:**

- Shows all games with filters by date/location; read-only for viewers.
  **Prerequisites:** Story 3.2.
  **Technical Notes:** GraphQL query + page cache.

### Story 3.4: Team schedule view

As a viewer/manager, I want a team-specific schedule, so that I can focus on my team’s games.
**Acceptance Criteria:**

- Filtered view by team; reflects publish state; respects permissions.
  **Prerequisites:** Story 3.3.
  **Technical Notes:** Team filter param; cache key per team.

### Story 3.5: Multi-season context

As a viewer, I want to select league + season context, so that I see the right schedule history.
**Acceptance Criteria:**

- UI/control to select season; data scoped to league/season.
  **Prerequisites:** Story 3.4.
  **Technical Notes:** Scope queries by leagueId/seasonId.

---

## Epic 4: Trades & Post-Draft Rosters

Goal: Track and approve trades and manage roster changes post-draft.

### Story 4.1: Propose trade

As an admin/manager, I want to propose a trade between teams, so that trade requests are tracked.
**Acceptance Criteria:**

- Create trade with from/to teams, assets (players/picks), status pending.
- Validation ensures assets exist and not duplicated.
  **Prerequisites:** Epic 2.
  **Technical Notes:** Trade entity; references roster/picks.

### Story 4.2: Approve/reject trade

As an admin, I want to approve or reject trades, so that rosters update only when approved.
**Acceptance Criteria:**

- Admin can approve/reject; audit logged; status updated.
- Approved trade updates rosters accordingly.
  **Prerequisites:** Story 4.1.
  **Technical Notes:** Transactional update; audit entry.

### Story 4.3: Trade history view

As a viewer, I want to see trade status/history, so that league actions are transparent.
**Acceptance Criteria:**

- List trades with status and involved assets; read-only to viewers.
  **Prerequisites:** Story 4.2.
  **Technical Notes:** GraphQL query; paginated.

### Story 4.4: Post-draft roster adjustment (manual)

As an admin, I want to adjust rosters manually post-draft, so that corrections are possible.
**Acceptance Criteria:**

- Admin can add/drop players outside trades; changes audited.
  **Prerequisites:** Story 4.2.
  **Technical Notes:** Reuse roster mutation; ensure audit.

---

## Epic 5: Stats & Results

Goal: Capture and display game results and stats with approvals.

### Story 5.1: Submit game results (manager)

As a manager, I want to submit game scores/penalties/stats, so that results are recorded.
**Acceptance Criteria:**

- Manager can submit results for their games; inputs validated.
- Submission enters pending state; audit logged.
  **Prerequisites:** Epic 1 (auth), Epic 3 (games exist).
  **Technical Notes:** REST upload optional; form submission allowed.

### Story 5.2: Admin review and approve stats

As an admin, I want to approve/reject submitted stats, so that published stats are accurate.
**Acceptance Criteria:**

- Pending submissions visible; admin can approve/reject with reason.
- Approved results update standings/stats; audit logged.
  **Prerequisites:** Story 5.1.
  **Technical Notes:** Status transitions; audit.

### Story 5.3: Publish scores and standings

As a viewer, I want to see published scores and standings, so that the league has transparency.
**Acceptance Criteria:**

- Read-only views for scores/standings/stat leaders; respects publish state.
  **Prerequisites:** Story 5.2.
  **Technical Notes:** GraphQL queries; cached public views.

### Story 5.4: Upload stats via CSV/JSON

As an admin, I want to upload stats files, so that bulk results can be ingested.
**Acceptance Criteria:**

- REST upload validates MIME/size; parses CSV/JSON; rejects invalid rows with errors.
- Ingested entries follow same approval flow.
  **Prerequisites:** Story 5.1.
  **Technical Notes:** REST handler; audit uploads.

---

## Epic 6: Exports & League Views

Goal: Provide exports and league/team visibility as a single source of truth.

### Story 6.1: Export rosters and schedules

As a user, I want to export rosters and schedules, so that I can reference them offline.
**Acceptance Criteria:**

- Export endpoints provide CSV/JSON for rosters and schedules scoped by league/season/team.
- Only authorized roles can export write-sensitive data; viewers can export read-only views.
  **Prerequisites:** Epics 2 and 3.
  **Technical Notes:** REST export; ensure auth and scoping.

### Story 6.2: League/Team overview dashboards

As a viewer, I want league and team overview pages, so that I can see key info at a glance.
**Acceptance Criteria:**

- League overview shows schedule highlights, standings link, draft/roster links.
- Team overview shows team schedule, roster, recent results.
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
