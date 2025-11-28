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

- Product brief: docs/product-brief-schultz-hockey-league-2025-11-27.md
- Domain brief: none provided
- Research docs: none loaded

---

## Success Criteria

Success means preseason runs smoothly and the league has a single source of truth:

- Draft completes without disputes: clear order/keepers, accurate recorded picks, published rosters.
- Season schedule published before opening game: league-wide and team-level views remain consistent.
- Stats are captured and viewable: basic upload/display flows work and don’t block draft/scheduling.

### Business Metrics

Draft disputes: minimized/none after using the draft board.  
Schedule coverage: full season published pre-season with league + team views.  
Stats coverage: basic uploads displayed accurately enough for league needs.

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

---

## Domain-Specific Requirements

None identified (general domain, low complexity).

## Innovation & Novel Patterns

None identified; focus is on reliability and clarity for league operations.

---

## web_app Specific Requirements

- Browser support: modern evergreen browsers; responsive design for desktop-first with usable mobile.
- Performance targets: draft board updates should feel real-time during in-person drafts; schedules/stats pages load quickly with cached data where reasonable.
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

- FR1: Admins can configure draft order, keeper rules, and tiebreakers for each season.
- FR2: Admins can view a live draft board showing current pick, available players, draft order, and recent picks.
- FR3: Admins can record picks during an in-person draft, updating team rosters in real time.
- FR4: Admins can allow Team Managers to record their team’s picks (with admin override).
- FR5: Admins can publish finalized team rosters after the draft.
- FR6: Admins can manage roster updates post-draft, including adding/dropping players.
- FR7: Admins can track and approve trades between teams; trades update rosters once approved.
- FR8: Team Managers can view draft order, available players, and their current roster.

**Schedules**

- FR9: Admins can create and publish a league-wide season schedule with games, dates, times, and locations.
- FR10: Admins can update schedules and republish changes (no notifications required).
- FR11: Users (admins, managers, viewers) can view the full league schedule.
- FR12: Users can view team-level schedules filtered to a specific team.

**Stats & Results**

- FR13: Admins can enter or upload game results (scores, penalties, key stats) and publish them.
- FR14: Team Managers can submit game results/stats for their games, subject to admin approval.
- FR15: Users can view published scores, standings, and stat/leaderboard summaries.

**Roles & Access**

- FR16: Admins have full write access across draft, rosters, schedules, and stats.
- FR17: Team Managers have limited write access (their team’s picks, roster updates as allowed, their game stats submission).
- FR18: Viewers have read-only access to schedules, scores, standings, and stats.

**General**

- FR19: Admins can manage player profiles, including ratings and positions, for draft preparation.
- FR20: System supports multiple leagues and seasons; the web UI scopes to a selected league with season history available.
- FR21: Users can export rosters and schedules for offline/reference use.

---

## Non-Functional Requirements

### Performance

- Draft board updates should reflect picks near-instantly for in-person use; avoid noticeable lag when advancing picks.
- Schedule and stats pages should load quickly for typical league sizes; allow caching to keep views snappy during games/drafts.

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

---

## PRD Summary

- Functional requirements: 21
- Non-functional areas covered: performance, security, scalability, accessibility, integration
- MVP focus: in-person draft clarity, schedule display, basic stats upload/display, roster/trade management with role-aware access
- Scope posture: notifications and payments excluded; multi-league/multi-season supported in data model; UI scoped to selected league with season history

---

_This PRD captures the essence of Schultz Hockey League — a multi-league, multi-season web app with in-person draft clarity, league/team schedule display, and simple stats/roster management._

_Created through collaborative discovery between Schultz and AI facilitator._
