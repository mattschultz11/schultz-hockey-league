---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/prd.md
  - _bmad-output/architecture.md
  - _bmad-output/ux-design-specification.md
---

# Schultz Hockey League - Epic Breakdown

**Author:** Schultz
**Date:** 2025-11-27 (Updated: 2025-12-20)
**Project Level:** 2
**Target Scale:** 20-40 stories

---

## Overview

This document provides the complete epic and story breakdown for Schultz Hockey League, decomposing the requirements from the [PRD](./prd.md), [Architecture](./architecture.md), and [UX Design](./ux-design-specification.md) into implementable stories.

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

---

## Requirements Inventory

### Functional Requirements

**Draft Board & Roster**

- FR-001 (MVP): Admins can configure draft order, keeper rules, and tiebreakers for each season.
- FR-002 (MVP): Admins can view a live draft board showing current pick, available players, draft order, and recent picks.
- FR-003 (MVP): Admins can record picks during an in-person draft, updating team rosters in real time.
- FR-004 (MVP): Admins can allow Team Managers to record their team's picks (with admin override).
- FR-005 (MVP): Admins can publish finalized team rosters after the draft.
- FR-006 (MVP): Admins can manage roster updates post-draft, including adding/dropping players.
- FR-007 (Growth): Admins can execute trades between teams; trades update rosters immediately.
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
- FR-017 (MVP): Team Managers have limited write access (their team's picks, roster updates as allowed, their game stats submission).
- FR-018 (MVP): Viewers have read-only access to schedules, scores, standings, and stats.

**General**

- FR-019 (MVP): Admins can manage player profiles, including ratings and positions, for draft preparation.
- FR-020 (MVP): System supports multiple leagues and seasons; the web UI scopes to a selected league with season history available.
- FR-021 (Growth): Users can export rosters and schedules for offline/reference use.

### Non-Functional Requirements

**Performance**

- NFR-001: Draft board updates should reflect picks near-instantly for in-person use (target <500ms UI update after commit).
- NFR-002: Schedule and stats pages should load quickly for typical league sizes (target P75 <2s).

**Security**

- NFR-003: Authentication required for admin/manager actions; role-based access enforced for all writes.
- NFR-004: Protect draft/state data from unauthorized changes; audit overrides/edits on picks, rosters, and stats.
- NFR-005: Use HTTPS and secure session handling.

**Scalability**

- NFR-006: Support multiple leagues and seasons in the data model; UI scopes to selected league with season history.
- NFR-007: Handle typical league concurrency (draft-day admin/manager actions + viewer traffic) without degradation.

**Accessibility**

- NFR-008: High-contrast, readable layouts; keyboard navigation for core flows (draft actions, schedules, stats).
- NFR-009: Responsive design usable on desktop and acceptable on mobile for viewing.

**Integration**

- NFR-010: Exports for rosters/schedules; no external integrations required in MVP.

### Additional Requirements

**From Architecture:**

- Starter template already initialized: Next.js 16 + React 19 + Tailwind CSS 4 + Prisma (Postgres) + GraphQL Yoga/Apollo
- Database: PostgreSQL + Prisma with strict naming conventions, migrations, and daily backups (Neon)
- Authentication: NextAuth.js 4.24.13 with RBAC (admin/manager/viewer) enforced at API layer
- Real-time draft updates: Server-Sent Events (SSE) via Next.js route handler with polling fallback
- API: Hybrid GraphQL (Yoga) for reads; REST endpoints for uploads/webhooks/health
- Caching: ISR/page cache for public schedules/standings; GraphQL response caching; SWR for client
- File uploads: REST upload endpoint with size/MIME validation; CSV/JSON parsing; audit submissions
- Deployment: Vercel hosting + Neon managed Postgres with daily snapshots
- Logging: Structured JSON logging with requestId correlation; AuditLog table for writes
- Error handling: Zod/Effect schemas at API boundary; typed GraphQL errors

**From UX Design:**

- Mobile-first web with strong desktop support
- Dark mode theme: deep slate background (#090a15), teal primary (#16A394), periwinkle secondary (#7F9CF5)
- Design system: HeroUI + Tailwind with custom tokens
- Typography: Space Grotesk for headings, Inter for body
- Responsive breakpoints: Mobile (<640px), Tablet (640-1024px), Desktop (1024px+)
- WCAG 2.1 AA accessibility target
- Touch targets minimum 44px on mobile
- Focus-visible outlines using #7F9CF5 for keyboard navigation
- Draft board: two-pane layout on desktop, stacked cards on mobile
- Schedule/standings: dense tables on desktop, collapsible cards on mobile
- Loading states: skeletons for tables/cards; spinners for actions
- Toast notifications: top-right desktop, top-stacked mobile

---

## FR Coverage Map

| FR     | Epic      | Description                            |
| ------ | --------- | -------------------------------------- |
| FR-001 | Epic 2    | Draft order, keeper rules, tiebreakers |
| FR-002 | Epic 2    | Live draft board view                  |
| FR-003 | Epic 2    | Record picks in real-time              |
| FR-004 | Epic 2    | Manager pick entry with admin override |
| FR-005 | Epic 2    | Publish finalized rosters              |
| FR-006 | Epic 2, 4 | Post-draft roster changes              |
| FR-007 | Epic 4    | Trade execution                        |
| FR-008 | Epic 2    | Manager draft view                     |
| FR-009 | Epic 3    | Create league schedule                 |
| FR-010 | Epic 3    | Update/republish schedules             |
| FR-011 | Epic 3, 6 | League schedule view                   |
| FR-012 | Epic 3, 6 | Team schedule view                     |
| FR-013 | Epic 5    | Admin stats entry/publish              |
| FR-014 | Epic 5    | Manager stats submission               |
| FR-015 | Epic 5    | View scores/standings/stats            |
| FR-016 | Epic 1    | Admin full write access                |
| FR-017 | Epic 1    | Manager limited write access           |
| FR-018 | Epic 1    | Viewer read-only access                |
| FR-019 | Epic 2    | Player profile management              |
| FR-020 | Epic 3, 6 | Multi-league/season support            |
| FR-021 | Epic 6    | Export rosters/schedules               |

---

## Epic List

### Epic 1: Foundation & Access

Stand up the app, auth, RBAC, and environments so league users can sign in and the system is deployable.
**FRs covered:** FR-016, FR-017, FR-018 (enabling all others)

### Epic 2: Draft Board & Rosters

Run in-person drafts with live board, keepers, and roster publication.
**FRs covered:** FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-008, FR-019

### Epic 3: Schedules

Create and publish league and team schedules with clear views and updates.
**FRs covered:** FR-009, FR-010, FR-011, FR-012, FR-020

### Epic 4: Trades & Post-Draft Rosters _(Growth - Deferable)_

Execute trades and manage roster changes post-draft.
**FRs covered:** FR-006, FR-007, FR-019

### Epic 5: Stats & Results

Capture and display game results and stats with approvals.
**FRs covered:** FR-013, FR-014, FR-015

### Epic 6: Exports & League Views _(Growth - Deferable)_

Provide exports and league-wide views as a single source of truth.
**FRs covered:** FR-011, FR-012, FR-020, FR-021

---

## Epic 1: Foundation & Access

**Goal:** Stand up the app, auth, RBAC, and environments so league users can sign in and the system is deployable.

### Story 1.1a: Local Project Setup

As an **admin**,
I want the project bootstrapped locally with env configs,
So that the app can run in dev.

**Acceptance Criteria:**

**Given** the repository is cloned and dependencies are installed
**When** I run `npm run dev`
**Then** the app starts with no blocking errors
**And** the Next.js dev server is accessible at localhost:3000

**Given** the project root contains `.env.example`
**When** I review the file
**Then** all required environment variable keys are listed
**And** no secrets or credentials are committed to the repository

**Given** the app is running locally with a valid database connection
**When** I call the health endpoint (`/api/health`)
**Then** the response returns OK status within 500ms
**And** the Prisma database connection is verified

---

### Story 1.1b: Production Deployment Baseline

As an **admin**,
I want a deployable baseline with Vercel + Neon environments,
So that production runs healthily.

**Acceptance Criteria:**

**Given** Vercel and Neon environment variables are configured
**When** the app is deployed to Vercel
**Then** the health endpoint responds OK within 500ms
**And** the Neon database connection is established

**Given** required environment variables are missing
**When** the app attempts to start
**Then** it fails fast with a clear error message indicating which variables are missing

**Given** the build pipeline is triggered
**When** the build completes
**Then** deployment succeeds without manual intervention
**And** all environment-specific configs are applied correctly

---

### Story 1.2: Auth Baseline with Roles

As an **admin**,
I want login with session cookies and roles (admin/manager/viewer),
So that access is enforced per role.

**Acceptance Criteria:**

**Given** NextAuth is configured with a provider
**When** a known user signs in with valid credentials
**Then** a session cookie is set (httpOnly, secure)
**And** the user's role (admin/manager/viewer) is stored in the session

**Given** a user with "manager" role is authenticated
**When** they attempt to access an admin-only endpoint
**Then** the request is denied with HTTP 403 Forbidden
**And** an appropriate error message is returned

**Given** a user with "viewer" role is authenticated
**When** they access read-only pages (schedules, standings)
**Then** the page loads successfully
**And** no write/edit affordances are displayed

**Given** any protected route is accessed
**When** the request is processed
**Then** role enforcement is applied via API guards
**And** 100% of protected routes enforce role checks

---

### Story 1.3: RBAC Enforcement Helpers

As a **developer**,
I want reusable policy helpers,
So that APIs consistently enforce roles.

**Acceptance Criteria:**

**Given** an API handler or GraphQL resolver
**When** a policy helper is applied with required role
**Then** unauthorized roles receive HTTP 403 Forbidden
**And** authorized roles proceed to the handler logic

**Given** RBAC policies are updated centrally
**When** a guarded endpoint is called
**Then** the updated policy is reflected immediately
**And** no code duplication exists across endpoints

**Given** a policy helper with league/season scoping
**When** a user attempts to access resources outside their scope
**Then** access is denied with 403
**And** the denial is logged with user context

**Given** the policy helper module
**When** unit tests are run
**Then** all RBAC scenarios pass (admin access, manager scoped, viewer read-only, unauthorized denial)

---

### Story 1.4: Audit and Logging Baseline

As an **admin**,
I want write actions audited and logs correlated,
So that changes are traceable.

**Acceptance Criteria:**

**Given** a write action occurs (draft pick, roster change, schedule update, stats submission)
**When** the action completes successfully
**Then** an audit entry is created with actor, target, action, timestamp, and metadata
**And** the entry is stored in the AuditLog table

**Given** any API request is processed
**When** logging occurs
**Then** logs include requestId and user context (userId, role, leagueId)
**And** logs are structured JSON format

**Given** audit records exist for a league/season
**When** an admin queries the audit log
**Then** records are filterable by league, season, actor, and action type
**And** results are returned with pagination

**Given** 100 write actions occur
**When** the audit table is queried
**Then** 100 corresponding audit entries exist
**And** no write action is missing an audit trail

---

### Story 1.5: Season Registration

As a **player**,
I want to register for a season via a public form,
So that I can sign up without needing an admin to create my account.

**Acceptance Criteria:**

**Given** a valid season exists
**When** I navigate to `/register/[seasonId]`
**Then** the registration form loads without requiring authentication
**And** the form displays the season name and fields for personal info, player preferences, and self evaluation

**Given** I fill out the registration form with a new email address
**When** I submit the form
**Then** a new User is created with role PLAYER
**And** a new Player record is created for that season
**And** I see a success confirmation message

**Given** I fill out the registration form with an existing email address
**When** I submit the form
**Then** the existing User is updated with the submitted fields
**And** the existing User's role is preserved (not overwritten)
**And** if a Player record already exists for that season, it is updated
**And** if no Player record exists for that season, a new one is created

**Given** I submit the form with invalid data (missing email, invalid jersey number, etc.)
**When** validation runs
**Then** the form displays field-level error messages
**And** no User or Player records are created or modified

**Given** I am an admin
**When** I navigate to `/admin/registrations/[seasonId]`
**Then** I see a table of all players registered for that season
**And** I can inline-edit player fields (position, number, ratings, registration number)

---

## Epic 2: Draft Board & Rosters

**Goal:** Run in-person drafts with live board, keepers, and roster publication.

### Story 2.1: Configure Season Draft Settings

As an **admin**,
I want to set draft order, keeper rules, and tiebreakers,
So that the draft is configured before it starts.

**Acceptance Criteria:**

**Given** a league and season exist
**When** I configure draft order with team positions
**Then** the order is saved to the season record
**And** the draft board reflects the configured order

**Given** a season draft configuration form
**When** I set keeper slots (e.g., 2 keepers per team)
**Then** keeper rules are stored with the season
**And** teams can designate up to the allowed keeper count

**Given** tiebreaker rules need to be defined
**When** I configure tiebreaker logic (e.g., coin flip, previous season record)
**Then** the rules are saved with the season
**And** they are applied when draft order ties occur

**Given** I attempt to save draft settings with duplicate pick positions
**When** validation runs
**Then** the save is rejected with a clear error message
**And** no invalid configuration is persisted

---

### Story 2.2: Player Catalog for Draft Prep

As an **admin**,
I want to manage player profiles (ratings, positions),
So that the draft board has an available player pool.

**Acceptance Criteria:**

**Given** I am on the player management page
**When** I create a new player with name, position, and rating
**Then** the player is saved to the database
**And** appears in the available player list for the draft

**Given** players exist in the system
**When** I update a player's rating or position
**Then** the changes are saved immediately
**And** the draft board reflects the updated information

**Given** the player catalog has 100+ players
**When** I search by name or filter by position
**Then** matching players are displayed within 500ms
**And** results are scoped to the current league/season

**Given** a player is deleted from the catalog
**When** the draft board loads
**Then** the deleted player does not appear in the available pool
**And** historical draft picks referencing that player remain intact

---

### Story 2.3: Live Draft Board View

As an **admin**,
I want a live draft board showing current pick, available players, order, and recent picks,
So that the draft runs smoothly.

**Acceptance Criteria:**

**Given** a draft is in progress for a season
**When** I load the draft board page
**Then** I see the current pick number and picking team
**And** the draft order queue is visible
**And** available players are listed with search/filter options
**And** recent picks are displayed in reverse chronological order

**Given** another admin records a pick
**When** the pick is committed
**Then** my draft board updates via SSE within 500ms
**And** the picked player moves from available to the team roster
**And** the current pick advances to the next team

**Given** I am a team manager viewing the draft board
**When** the page loads
**Then** I see the same board state as admins
**And** admin-only controls (override, undo) are hidden
**And** I can only interact with my team's picks if allowed

**Given** I am a viewer (read-only role)
**When** I access the draft board
**Then** I see the live board state
**And** no pick recording controls are visible

---

### Story 2.4: Record Picks with Manager Override

As an **admin or manager**,
I want to record picks with admin override capability,
So that teams can be selected live during the draft.

**Acceptance Criteria:**

**Given** it is my team's turn to pick (as manager)
**When** I select an available player and confirm
**Then** the pick is recorded for my team
**And** the player is added to my roster
**And** the draft advances to the next pick
**And** an audit entry captures the pick action

**Given** a manager made an incorrect pick
**When** an admin uses the override/undo function
**Then** the pick is reversed
**And** the player returns to the available pool
**And** an audit entry captures the override with admin actor

**Given** I attempt to pick a player already drafted
**When** the pick is submitted
**Then** the pick is rejected with "Player unavailable" error
**And** no duplicate pick is recorded

**Given** 50 picks are recorded during a draft
**When** I query the audit log
**Then** 50 pick audit entries exist with timestamps
**And** P75 pick commit-to-UI update is ≤500ms

---

### Story 2.5: Publish Rosters After Draft

As an **admin**,
I want to publish finalized rosters,
So that teams are visible post-draft.

**Acceptance Criteria:**

**Given** the draft is complete (all picks recorded)
**When** I click "Publish Rosters"
**Then** a publish flag is set on the season
**And** public roster views are updated and visible
**And** an audit entry records the publish action

**Given** rosters are published
**When** any user views the team roster page
**Then** the finalized roster is displayed
**And** the page loads within 2s (cached)

**Given** rosters are published
**When** I request a roster export
**Then** a CSV/JSON file is generated with all team rosters
**And** the export completes without errors

**Given** 8 teams participated in the draft
**When** rosters are published
**Then** all 8 teams have complete rosters visible
**And** no picks are missing from any roster

---

### Story 2.6: Post-Draft Roster Edits

As an **admin**,
I want to add/drop players post-draft,
So that rosters stay accurate throughout the season.

**Acceptance Criteria:**

**Given** rosters are published and the season is active
**When** I add a player to a team roster
**Then** the player is added to the team
**And** an audit entry captures the add action with reason

**Given** a player needs to be dropped from a roster
**When** I remove them from the team
**Then** the player returns to the available pool (or is marked inactive)
**And** an audit entry captures the drop action

**Given** the season is locked (archived)
**When** I attempt to edit a roster
**Then** the edit is rejected with "Season locked" error
**And** no changes are persisted

**Given** I attempt to add a player already on another team
**When** validation runs
**Then** the add is rejected with "Player already rostered" error
**And** roster integrity is maintained

---

## Epic 3: Schedules

**Goal:** Create and publish league and team schedules with clear views and updates.

### Story 3.1: Create Season Schedule

As an **admin**,
I want to create league-wide schedules with games, dates, times, and locations,
So that the season plan exists.

**Acceptance Criteria:**

**Given** a league and season exist
**When** I create a new game with home team, away team, date/time, and location
**Then** the game is saved to the database
**And** it appears in the schedule list for that season

**Given** I am creating multiple games
**When** I schedule two games for the same team at the same time
**Then** validation rejects the conflicting game
**And** a clear error message indicates the overlap

**Given** a schedule with 50 games
**When** I view the schedule management page
**Then** all games are listed with pagination
**And** I can filter by date range, team, or location

**Given** I edit an existing game's date or location
**When** I save the changes
**Then** the game is updated in the database
**And** an audit entry captures the modification

---

### Story 3.2: Publish and Republish Schedules

As an **admin**,
I want to publish and republish schedule changes,
So that teams see the latest plan.

**Acceptance Criteria:**

**Given** a season schedule exists with unpublished games
**When** I click "Publish Schedule"
**Then** all games are marked as published
**And** public schedule views display the games
**And** an audit entry records the publish action

**Given** a published schedule needs updates
**When** I modify games and click "Republish"
**Then** the changes are applied to published views
**And** cached pages are invalidated within 2s
**And** users see updated schedule on next page load

**Given** a schedule is published
**When** I view the public schedule page
**Then** the page renders within 2s (P75)
**And** ISR caching is active for performance

**Given** I republish a schedule 5 times
**When** I check the audit log
**Then** 5 publish/republish entries exist with timestamps

---

### Story 3.3: League Schedule View

As a **viewer**,
I want a league-wide schedule view,
So that I can see all games.

**Acceptance Criteria:**

**Given** a published schedule exists for the season
**When** I navigate to the league schedule page
**Then** all games are displayed in chronological order
**And** each game shows home/away teams, date/time, location, and status

**Given** the schedule page is loaded
**When** I apply filters (date range, location)
**Then** the displayed games are filtered accordingly
**And** filter changes respond within 500ms

**Given** a season has 100 scheduled games
**When** I load the league schedule page
**Then** the page renders within 2s (P75)
**And** pagination or infinite scroll handles large lists

**Given** I am a viewer with read-only access
**When** I view the schedule
**Then** no edit or publish controls are visible
**And** I can only view, not modify

---

### Story 3.4: Team Schedule View

As a **viewer or manager**,
I want a team-specific schedule,
So that I can focus on my team's games.

**Acceptance Criteria:**

**Given** I select a specific team
**When** I view the team schedule page
**Then** only games involving that team are displayed
**And** games are sorted by date

**Given** a team has 20 games scheduled
**When** I load the team schedule page
**Then** the page renders within 2s (P75)
**And** upcoming games are highlighted or sorted first

**Given** the team schedule is displayed
**When** I click on a game
**Then** game details are shown (location, time, opponent)
**And** if results are published, scores are visible

**Given** the schedule is republished with changes to my team's games
**When** I reload the team schedule page
**Then** the updated games are reflected
**And** stale cached data is not shown

---

### Story 3.5: Multi-Season Context

As a **viewer**,
I want to select league and season context,
So that I see the right schedule history.

**Acceptance Criteria:**

**Given** multiple seasons exist for a league
**When** I use the season selector control
**Then** available seasons are listed (current and historical)
**And** I can switch between them

**Given** I select a previous season
**When** the page reloads
**Then** all data (schedule, rosters, standings) is scoped to that season
**And** the URL reflects the selected season for deep linking

**Given** I am browsing a historical season
**When** I navigate between pages (schedule, standings, rosters)
**Then** the season context persists
**And** I don't need to reselect the season

**Given** a new user visits the site
**When** no season is selected
**Then** the current/active season is selected by default
**And** the user can change it via the selector

---

## Epic 4: Trades & Post-Draft Rosters _(Growth - Deferable)_

**Goal:** Execute trades and manage roster changes post-draft.

### Story 4.1: Execute Trade

As an **admin**,
I want to execute a trade between teams,
So that assets are transferred immediately.

**Acceptance Criteria:**

**Given** I am an admin with two teams in the current season
**When** I create a trade specifying from-team, to-team, and assets (players/picks)
**Then** the trade is executed immediately
**And** assets are transferred between team rosters
**And** an audit entry records the trade with admin actor, teams, and assets

**Given** I attempt to trade a player not on the from-team's roster
**When** validation runs
**Then** the trade is rejected with "Invalid asset" error
**And** no roster changes occur

**Given** I attempt to trade a draft pick not owned by the from-team
**When** validation runs
**Then** the trade is rejected with "Invalid pick ownership" error
**And** trade integrity is maintained

**Given** a trade is executed successfully
**When** I view both teams' rosters
**Then** the traded assets reflect their new team assignments immediately

---

### Story 4.2: Trade History View

As a **viewer**,
I want to see trade history,
So that league actions are transparent.

**Acceptance Criteria:**

**Given** trades have occurred during the season
**When** I navigate to the trade history page
**Then** all trades are listed chronologically
**And** each trade shows teams involved, assets exchanged, and timestamp

**Given** the trade history has 50+ trades
**When** I load the page
**Then** trades are paginated
**And** the page renders within 2s

**Given** I am a viewer with read-only access
**When** I view trade history
**Then** no execute trade controls are visible
**And** I can only view, not modify

**Given** I click on a specific trade
**When** the detail view loads
**Then** I see full trade details including admin who executed it and exact assets moved

---

## Epic 5: Stats & Results

**Goal:** Capture and display game results and stats with approvals.

### Story 5.1: Submit Game Results (Manager)

As a **manager**,
I want to submit game scores, penalties, and stats,
So that results are recorded for my team's games.

**Acceptance Criteria:**

**Given** a scheduled game exists for my team
**When** I submit results with scores, penalties, and key stats
**Then** the submission is saved with status "pending"
**And** an audit entry captures the submission with my user ID

**Given** I attempt to submit results for a game not involving my team
**When** validation runs
**Then** the submission is rejected with "Unauthorized" error
**And** no submission is created

**Given** I submit results with invalid data (e.g., negative scores)
**When** validation runs
**Then** the submission is rejected with specific field errors
**And** I can correct and resubmit

**Given** I have already submitted results for a game
**When** I attempt to submit again
**Then** the new submission replaces the pending one
**And** the previous submission is archived

---

### Story 5.2: Admin Review and Approve Stats

As an **admin**,
I want to approve or reject submitted stats,
So that published stats are accurate.

**Acceptance Criteria:**

**Given** pending stat submissions exist
**When** I navigate to the approval queue
**Then** all pending submissions are listed with game details and submitter info
**And** I can review the submitted data

**Given** a pending submission is accurate
**When** I click "Approve"
**Then** the submission status changes to "approved"
**And** the game results are published to standings/stats
**And** an audit entry records the approval

**Given** a pending submission has errors
**When** I click "Reject" and provide a reason
**Then** the submission status changes to "rejected"
**And** the rejection reason is stored and visible to the submitter
**And** the submitter can correct and resubmit

**Given** an admin directly enters stats (without manager submission)
**When** the stats are saved
**Then** they are automatically approved and published
**And** an audit entry records the admin entry

---

### Story 5.3: Publish Scores and Standings

As a **viewer**,
I want to see published scores and standings,
So that the league has transparency.

**Acceptance Criteria:**

**Given** approved game results exist
**When** I navigate to the scores page
**Then** all published game results are displayed
**And** each game shows teams, final score, and date

**Given** multiple games have approved results
**When** I view the standings page
**Then** team standings are calculated from approved results
**And** standings show wins, losses, ties, points, and rank

**Given** I navigate to the stat leaders page
**When** the page loads
**Then** top players are displayed by stat category (goals, assists, etc.)
**And** stats are calculated from approved game data

**Given** the standings page is loaded
**When** I check performance
**Then** the page renders within 2s (P75)
**And** data reflects the latest approved results

---

### Story 5.4: Upload Stats via CSV/JSON _(Growth - Deferable)_

As an **admin**,
I want to upload stats files,
So that bulk results can be ingested efficiently.

**Acceptance Criteria:**

**Given** I have a CSV or JSON file with game results
**When** I upload it via the stats upload endpoint
**Then** the file is validated for MIME type and size limits
**And** valid rows are parsed and imported

**Given** the upload file contains invalid rows
**When** parsing completes
**Then** a report shows which rows failed with specific errors
**And** valid rows are still processed

**Given** bulk stats are uploaded
**When** processing completes
**Then** imported entries follow the same approval flow as manual entries
**And** an audit entry captures the upload (who, when, file size, row count)

**Given** I attempt to upload a file exceeding size limits
**When** validation runs
**Then** the upload is rejected with "File too large" error
**And** no partial processing occurs

---

### Story 5.5: Upload Error Reporting and Quotas _(Growth - Deferable)_

As an **admin**,
I want clear upload error reporting and basic quotas,
So that bulk uploads are reliable and don't overwhelm the system.

**Acceptance Criteria:**

**Given** an upload contains 100 rows with 10 errors
**When** I view the upload report
**Then** I see 90 successful imports and 10 failures
**And** each failure includes row number, field, and error reason

**Given** rate limits are configured
**When** I exceed the upload rate limit
**Then** the request is rejected with HTTP 429
**And** a clear message indicates when I can retry

**Given** an upload completes (success or partial failure)
**When** I check logs
**Then** the upload is logged with requestId, user, success/failure counts
**And** metrics are available for monitoring

**Given** a per-league upload quota exists
**When** I exceed it
**Then** further uploads are blocked with "Quota exceeded" error
**And** I can contact admin to increase quota

---

## Epic 6: Exports & League Views _(Growth - Deferable)_

**Goal:** Provide exports and league-wide views as a single source of truth.

### Story 6.1: Export Rosters and Schedules

As a **user**,
I want to export rosters and schedules,
So that I can reference them offline.

**Acceptance Criteria:**

**Given** I am viewing a team roster
**When** I click "Export Roster"
**Then** a CSV or JSON file is downloaded
**And** it contains all players with positions, ratings, and status

**Given** I am viewing a league or team schedule
**When** I click "Export Schedule"
**Then** a CSV or JSON file is downloaded
**And** it contains all games with dates, times, locations, and teams

**Given** I am a viewer with read-only access
**When** I export rosters or schedules
**Then** the export succeeds for published data
**And** unpublished or draft data is excluded

**Given** a season has 100 games and 200 players
**When** I request an export
**Then** the export completes within 2s
**And** the file is properly formatted and complete

---

### Story 6.2: League Overview Dashboard

As a **viewer**,
I want a league overview page,
So that I can see key information at a glance.

**Acceptance Criteria:**

**Given** I navigate to the league home page
**When** the page loads
**Then** I see schedule highlights (upcoming games, recent results)
**And** standings summary (top teams)
**And** quick links to full schedule, standings, and rosters

**Given** the league has active games today
**When** I view the dashboard
**Then** today's games are prominently displayed
**And** live or recent scores are shown if available

**Given** the dashboard is loaded
**When** I check performance
**Then** the page renders within 2s (P75)
**And** data reflects the latest published state

**Given** new results are published
**When** I reload the dashboard
**Then** updated standings and scores are visible
**And** stale cached data is not shown

---

### Story 6.3: Team Overview Dashboard

As a **viewer or manager**,
I want a team overview page,
So that I can see my team's key information at a glance.

**Acceptance Criteria:**

**Given** I navigate to a team's home page
**When** the page loads
**Then** I see the team roster summary
**And** upcoming games for the team
**And** recent results and current standing

**Given** I am a manager viewing my team's dashboard
**When** the page loads
**Then** I see the same information as viewers
**And** quick action links (submit stats, view full roster) are visible

**Given** the team has a game today
**When** I view the dashboard
**Then** today's game is prominently highlighted
**And** opponent and time/location are clearly visible

**Given** the dashboard is loaded
**When** I check performance
**Then** the page renders within 2s (P75)
**And** all data is scoped to the selected team and season

---

## Summary

Epic breakdown complete with 6 epics and 26 stories:

| Epic | Title                       | Stories | Status               |
| ---- | --------------------------- | ------- | -------------------- |
| 1    | Foundation & Access         | 5       | MVP                  |
| 2    | Draft Board & Rosters       | 6       | MVP                  |
| 3    | Schedules                   | 5       | MVP                  |
| 4    | Trades & Post-Draft Rosters | 2       | Growth               |
| 5    | Stats & Results             | 5       | MVP (3) + Growth (2) |
| 6    | Exports & League Views      | 3       | Growth               |

**Total: 26 stories**

- **MVP Stories:** 19
- **Growth Stories:** 7

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._

_This document was updated with Given/When/Then acceptance criteria on 2025-12-20._
