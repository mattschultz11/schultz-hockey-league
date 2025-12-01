# Schultz Hockey League - Product Requirements Document

**Author:** Schultz
**Date:** 2025-11-27
**Version:** 1.0

---

## Executive Summary

Centralized web app for the Schultz Hockey League to manage current and future seasons: in-person draft board clarity, league/team schedule display, and simple stats upload/display so admins, managers, officials, players, and fans stay aligned.

### What Makes This Special

In-person draft board focus (order/keepers/availability clarity) with lightweight schedule display and basic stats upload/display—no notification or messaging overhead.

---

## Project Classification

**Technical Type:** web_app  
**Domain:** general  
**Complexity:** low

System supports multiple leagues and multiple seasons; the web UI scopes to a selected league with season history. Roles: admins (full write), team managers (limited write), viewers (read-only). No payments or notifications in MVP; focus on draft board, schedule display, stats upload/display, and roster/trade management.

References:

- Product brief: ai-docs/product-brief-schultz-hockey-league-2025-11-27.md
- Domain brief: none provided
- Research docs: none loaded

---

## Success Criteria

Success means preseason runs smoothly and the league has a single source of truth:

- Draft completes without disputes: clear order/keepers, accurate recorded picks, published rosters.
- Season schedule published before opening game: league-wide and team-level views remain consistent.
- Stats are captured and viewable: basic upload/display flows work and don’t block draft/scheduling.

### Business Metrics

Draft disputes (Epic 2): minimized/none after using the draft board (0 disputes per draft).  
Schedule coverage (Epic 3): full season published pre-season with league + team views (100% coverage before opening game).  
Stats coverage (Epic 5): basic uploads displayed accurately enough for league needs (≥95% games have published scores).

### Per-Epic Success Metrics

- Epic 1 (Foundation): Dev/prod deploy health endpoint returns OK; role enforcement enabled on protected routes; audits written for writes.
- Epic 2 (Draft Board & Rosters): 0 draft disputes; live board latency ≤500ms; roster publish completes with no missing picks.
- Epic 3 (Schedules): 100% games published before season start; P75 page render ≤2s for league/team views; no overlapping games per team.
- Epic 4 (Trades - Growth): 100% trades audited; no invalid asset duplication; optional defer if Level 2 scope.
- Epic 5 (Stats & Results): ≥95% games have approved stats; P75 stats publish/view ≤2s; approval SLA within agreed window.
- Epic 6 (Exports/Views - Growth): Exports complete ≤2s for typical season; dashboards reflect current publish state; optional defer if Level 2 scope.

---

## Product Scope

### MVP - Minimum Viable Product

MVP capabilities:

- In-person draft board: order/keepers, current pick, available players, recent picks; record picks; snake/linear formats; tiebreak handling.
- Schedule publishing: league-wide and team-level schedule views; publish/update schedules (no notifications).
- Stats upload + display: simple entry tool and dashboard; clear roles for who records/approves.
- Post-draft roster management: roster view/export; basic trade tracking/approval.

### Growth Features (Post-MVP)

- Optional notifications; mobile-friendly enhancements; richer stats/analytics; sponsorship/ads; deeper permissions/audit; online/remote draft flow.

### Vision (Future)

- Potential expansion to multi-league/SaaS offering; advanced analytics; richer UX polish.

### Out of Scope (Now)

- Payments and monetization
- In-app messaging/notifications
- Remote/online drafting
- Advanced analytics beyond standings/stat leaders
- Complex permissions/audit beyond baseline RBAC and logging

### Data Model Overview (for architecture/story grounding)

- League: id, name, createdAt
- Season: id, leagueId, name/year, draft settings (order, keeper slots, tiebreak rules), publish flags, createdAt/updatedAt
- Team: id, leagueId, seasonId, name, roster[], createdAt/updatedAt
- Player: id, leagueId, seasonId, name, position, rating, status (active/inactive), createdAt/updatedAt
- Game: id, leagueId, seasonId, homeTeamId, awayTeamId, date/time/location, status (scheduled/published/final), score (home/away), penalties, stat summary, createdAt/updatedAt
- DraftPick: id, leagueId, seasonId, pickNumber, round, teamId, playerId, keeper flag, timestamp, audit metadata
- Trade (Growth): id, leagueId, seasonId, fromTeamId, toTeamId, assets (players/picks), status (pending/approved/rejected), audit metadata
- StatsSubmission: id, gameId, submitterId, submitterRole, payload (scores/penalties/stats), status (pending/approved/rejected), audit metadata
- Export (Growth): scoped CSV/JSON endpoints for rosters/schedules; request scoped by league/season/team; audit download when needed

---

## Domain-Specific Requirements

None identified (general domain, low complexity).

## Innovation & Novel Patterns

None identified; focus is on reliability and clarity for league operations.

---

## web_app Specific Requirements

- Browser support: modern evergreen browsers; responsive design for desktop-first with usable mobile.
- Performance targets: draft board updates should feel real-time during in-person drafts; schedules/stats pages load within ~2s for typical league sizes with cached data where reasonable.
- SEO strategy: basic crawlable league/team schedules and standings pages.
- Accessibility level: readable, high-contrast layouts; keyboard navigation for core flows.

---

## User Experience Principles

- Clarity-first: live draft board emphasizes current pick, order, and available players.
- Role-aware: admins see controls for picks/rosters/trades/schedules; managers see their team actions; viewers see read-only views.
- Fast reads: schedules and stats pages prioritize legibility over decoration.
- Draft-day resilience: minimal navigation to record picks; obvious undo/override for admins.

### Key Interactions

- Admin sets up season (league selection, season context) and draft order/keepers.
- Admin runs the draft board, records picks, and publishes rosters.
- Admin publishes league and team schedules; can update and republish.
- Manager (if allowed) records picks for their team, submits game stats; admin can approve.
- Users view league and team schedules; view scores/standings/stat leaders.

---

## Functional Requirements

**Draft Board & Roster**

- FR-001 (MVP): Admins can configure draft order, keeper rules, and tiebreakers for each season.
- FR-002 (MVP): Admins can view a live draft board showing current pick, available players, draft order, and recent picks.
- FR-003 (MVP): Admins can record picks during an in-person draft, updating team rosters in real time.
- FR-004 (MVP): Admins can allow Team Managers to record their team’s picks (with admin override).
- FR-005 (MVP): Admins can publish finalized team rosters after the draft.
- FR-006 (MVP): Admins can manage roster updates post-draft, including adding/dropping players.
- FR-007 (Growth): Admins can track and approve trades between teams; trades update rosters once approved.
- FR-008 (MVP): Team Managers can view draft order, available players, and their current roster.

**Schedules**

- FR-009 (MVP): Admins can create and publish a league-wide season schedule with games, dates, times, and locations.
- FR-010 (MVP): Admins can update schedules and republish changes (no notifications required).
- FR-011 (MVP): Users (admins, managers, viewers) can view the full league schedule.
- FR-012 (MVP): Users can view team-level schedules filtered to a specific team.

**Stats & Results**

- FR-013 (MVP): Admins can enter game results (scores, penalties, key stats) and publish them.
- FR-014 (MVP): Team Managers can submit game results/stats for their games, subject to admin approval.
- FR-015 (MVP): Users can view published scores, standings, and stat/leaderboard summaries.

**Roles & Access**

- FR-016 (MVP): Admins have full write access across draft, rosters, schedules, and stats.
- FR-017 (MVP): Team Managers have limited write access (their team’s picks, roster updates as allowed, their game stats submission).
- FR-018 (MVP): Viewers have read-only access to schedules, scores, standings, and stats.

**General**

- FR-019 (MVP): Admins can manage player profiles, including ratings and positions, for draft preparation.
- FR-020 (MVP): System supports multiple leagues and seasons; the web UI scopes to a selected league with season history available.
- FR-021 (Growth): Users can export rosters and schedules for offline/reference use.

---

## Non-Functional Requirements

### Performance

- Draft board updates should reflect picks near-instantly for in-person use; avoid noticeable lag when advancing picks (target <500ms UI update after commit).
- Schedule and stats pages should load quickly for typical league sizes; allow caching to keep views snappy during games/drafts (target P75 <2s).

### Security

- Authentication required for admin/manager actions; role-based access enforced for all writes.
- Protect draft/state data from unauthorized changes; audit overrides/edits on picks, rosters, and stats.
- Use HTTPS and secure session handling.

### Scalability

- Support multiple leagues and seasons in the data model; UI scopes to selected league with season history.
- Handle typical league concurrency (draft-day admin/manager actions + viewer traffic) without degradation.

### Accessibility

- High-contrast, readable layouts; keyboard navigation for core flows (draft actions, schedules, stats).
- Responsive design usable on desktop and acceptable on mobile for viewing.

### Integration

- Exports for rosters/schedules; no external integrations required in MVP.
- Dependencies on hosting (Vercel) and database (Neon) to be confirmed during implementation; list env vars in `.env.example`.

### Risks and Unknowns

- Data shape details to finalize during architecture (player ratings/positions taxonomy; stat payload fields per game).
- Performance baselines are targets; validate with staging data and adjust budgets.
- Bulk upload, exports, dashboards, and trades are Growth items; defer if Level 2 scope needs to stay lean.
- Edge cases to track: schedule conflicts, duplicate picks, trade conflicts (if enabled), stat submission validation.

---

## PRD Summary

- Functional requirements: 21
- Non-functional areas covered: performance, security, scalability, accessibility, integration
- MVP focus: in-person draft clarity, schedule display, basic stats upload/display, roster/trade management with role-aware access
- Scope posture: notifications and payments excluded; multi-league/multi-season supported in data model; UI scoped to selected league with season history

---

_This PRD captures the essence of Schultz Hockey League — a multi-league, multi-season web app with in-person draft clarity, league/team schedule display, and simple stats/roster management._

_Created through collaborative discovery between Schultz and AI facilitator._

---

## Epics Reference

- Primary epic breakdown: ai-docs/bmm-epics-and-stories-2025-11-27.md
- Mirror (kept in sync): ai-docs/epics.md
