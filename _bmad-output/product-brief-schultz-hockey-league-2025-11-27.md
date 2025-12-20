# Product Brief: Schultz Hockey League

**Date:** 2025-11-27  
**Author:** Schultz  
**Context:** Greenfield league management web app

---

## Executive Summary

Build a web app for the Schultz Hockey League that centralizes management of the current league and future seasons—covering schedules, rosters, drafts, scores, and stats—so admins, managers, officials, players, and fans stay aligned.

### Initial Vision

- Manage the current league and future leagues in one place.
- Provide scheduling, roster, draft, scoring, and stats workflows tailored to hockey.
- Serve multiple roles (admin, manager, official, player/fan) with clear permissions.

---

## Core Vision

### Problem Statement

Drafting teams is messy, season schedules are hard to share reliably, and recording stats is inconsistent—making it tough to keep admins, managers, officials, and players aligned.

### Problem Impact

- Draft chaos: unclear draft order/keepers leads to disputes and delays.
- Schedule confusion: updates don’t reach everyone, causing missed or rescheduled games.
- Stat gaps: scores/penalties/leaderboards are slow or error-prone to record, hurting transparency and engagement.

### Why Existing Solutions Fall Short

- Spreadsheets worked when the league was smaller, but they don’t scale for drafts, schedule visibility, or consistent stats entry.
- Manual updates create version drift and confusion (especially for schedule changes).
- No single place for draft state, roster updates, and stats display.

### Proposed Solution

A web app that streamlines in-person drafts, publishes schedules clearly, and standardizes stat entry/visibility:

- Draft board UI (in-person): live view of current team pick, available players, draft order, and recent picks; simple controls to record picks and keepers; support for basic formats (snake/linear) and tiebreak rules.
- Scheduling: build and publish season schedules; display league-wide schedule and team-specific views; no notifications required.
- Stats: simple uploader/tool for scores/penalties/stats plus a dashboard to display them; clear roles for who records/approves.

### Key Differentiators

- In-person draft board focus: optimized for live drafts (no complex online draft mechanics needed) with clarity on order, keepers, and available players.
- Lightweight scheduling display: clear season and per-team schedule views without notification overhead.
- Clear stat roles + dashboard: straightforward entry/approval and a dedicated display for league stats/leaderboards.

---

## Target Users

### Primary Users

- Admins — full write; create seasons/divisions/teams, set draft order/keepers, record picks, publish schedules, upload/approve stats.
- Team Managers — limited write; manage roster availability, record draft picks for their team (with admin oversight), submit scores/penalties/stats for their games.
- Viewers — read-only; see schedules (league + team), standings, scores, stats/leaderboards.

### Secondary Users

None identified.

### User Journey

- Admin: set up season → define draft order/keepers → run in-person draft board → publish league + team schedules → approve/aggregate stats.
- Team Manager: review draft order → enter picks during draft (as allowed) → manage roster → submit game scores/stats → review schedules.
- Viewer: browse league and team schedules → check scores/standings/stat leaders.

---

## Success Metrics

- Drafting runs smoothly with clear order/keepers and no disputes; draft board captures picks accurately and produces published team rosters.
- Season schedule is published cleanly (league + team views) before opening game and stays consistent.
- Game stats are a secondary priority; basic upload/display is acceptable as long as it doesn’t block drafts/scheduling.

### Business Objectives

- Primary: reduce preseason friction by streamlining draft and schedule publication.
- Secondary: provide a single source of truth for rosters and schedules for the league.

### Key Performance Indicators

- Draft disputes: minimized/none after board is used.
- Schedule coverage: full season published before start; clear league + team views available.
- Stats coverage: basic upload/display functioning (accuracy sufficient for league needs).

---

## MVP Scope

### Core Features

- In-person draft board: order/keepers, current pick, available players, recent picks; record picks; basic snake/linear formats.
- Schedule publishing: league-wide and team-level schedule views; publish/update schedules.
- Stats upload + display: simple entry tool and dashboard; secondary priority.
- Post-draft roster management: roster view/export; support for trades (basic tracking/approval).

### Out of Scope for MVP

- Notifications, in-app messaging, online/remote drafting, payments, advanced analytics.

### MVP Success Criteria

- Draft completes without disputes and produces published team rosters.
- Season schedule is published (league + team views) and remains consistent.
- Stats can be uploaded and viewed; accuracy is sufficient for league needs.

### Future Vision

- Optional notifications, richer stats/analytics, online draft flows, mobile-friendly enhancements, sponsorship/ads, richer permissions and audit.

---

## Market Context

- Current baseline is spreadsheets; no external tool is mandated.
- MVP is for this league only; future SaaS expansion is a potential later option.

## Financial Considerations

- No payments or monetization in MVP; self-funded league site.

## Technical Preferences

- Web app; prioritize clarity and speed for live draft board.
- Role-based permissions (admins full write; managers limited write; viewers read-only).
- Keep implementation straightforward; avoid unnecessary notification or messaging systems in MVP.

## Organizational Context

- Single-league deployment; no multi-league admin needs for MVP.
- Future consideration: could evolve to multi-league/SaaS, but not required now.

## Risks and Assumptions

- Assumption: In-person drafts remain the norm; no need for remote/online drafting initially.
- Risk: Draft data accuracy relies on manual entry during live events; mitigation is a clear draft board UI and simple controls.
- Risk: Schedule changes without notifications could be missed; mitigated by clear league/team schedule views and easy updates.
- Assumption: Basic stats entry/display is enough for now; advanced analytics can wait.

## Timeline

- No specific date given; focus is on reducing preseason workload before the upcoming season.

## Supporting Materials

- None provided yet.

---

_This Product Brief captures the vision and requirements for Schultz Hockey League._

_It was created through collaborative discovery and reflects the unique needs of this personal league project._

_Next: Use the PRD workflow to create detailed product requirements from this brief._
