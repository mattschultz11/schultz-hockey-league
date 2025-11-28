# Test Design: System-Level (Solutioning Gate)

**Date:** 2025-11-27  
**Author:** Schultz  
**Mode:** System-Level (Phase 3)  
**Scope:** Full testability and risk assessment for schultz-hockey-league

---

## Executive Summary

- Goal: Validate testability and risks before implementation. Architecture: Next.js 16 + React 19, GraphQL (Yoga) + REST, SSE draft board, PostgreSQL/Prisma, NextAuth RBAC, Vercel + Neon.
- High-risk focus: RBAC/tenancy enforcement, draft/roster consistency (picks/trades), SSE reliability, upload validation/approvals, backup/restore for critical events.
- Coverage strategy: Evidence-based risk scoring; P0 critical paths cover authz, draft board/write flows, schedule publish, stats approval, data integrity, and backups; P1 covers caching/invalidations and schedule/roster views; P2/P3 cover secondary flows.

---

## Context Loaded

- PRD: docs/prd.md (FR1–FR21)
- Architecture: docs/bmm-architecture-2025-11-27.md
- Epics/Stories: docs/epics.md (6 epics, 22 stories)
- Knowledge base: risk-governance, probability-impact, test-levels-framework, test-quality, nfr-criteria

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description                                                                | Probability | Impact | Score | Mitigation                                                                                   | Owner   | Status |
| ------- | -------- | -------------------------------------------------------------------------- | ----------- | ------ | ----- | -------------------------------------------------------------------------------------------- | ------- | ------ |
| R-001   | SEC      | RBAC + league/season scoping in GraphQL/REST (admin/manager/viewer)        | 2           | 3      | 6     | Authz integration tests per resolver/route; policy helpers; negative tests                   | QA/Dev  | Open   |
| R-002   | DATA     | Draft/roster consistency (picks, overrides, trades) including keeper rules | 2           | 3      | 6     | API tests for pick/trade flows, transaction checks, audit replay; SSE state replay           | QA/Dev  | Open   |
| R-003   | PERF/OPS | SSE reliability for draft board (reconnect, backoff, cache invalidation)   | 2           | 3      | 6     | SSE contract tests with reconnect/backoff; fallback to polling; last-state replay validation | QA      | Open   |
| R-004   | SEC/DATA | Upload validation and approvals for stats (CSV/JSON)                       | 2           | 3      | 6     | REST upload tests for MIME/size/schema; injection/sanitization; approval workflow tests      | QA      | Open   |
| R-005   | OPS/DATA | Backup/restore before draft/schedule changes (Neon snapshots)              | 2           | 3      | 6     | Document and validate backup trigger + restore drill; health checks; migration dry-run       | Ops/Dev | Open   |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description                                            | Probability | Impact | Score | Mitigation                                                           | Owner  | Status |
| ------- | -------- | ------------------------------------------------------ | ----------- | ------ | ----- | -------------------------------------------------------------------- | ------ | ------ |
| R-006   | PERF     | Cache/ISR invalidation for schedules/rosters/standings | 2           | 2      | 4     | Cache-bust tests on publish/update; ISR revalidate checks            | QA/Dev | Open   |
| R-007   | DATA     | Stats submission duplication/approval gaps             | 2           | 2      | 4     | Approval state machine tests; idempotency checks; audit verification | QA     | Open   |
| R-008   | TECH     | Prisma migrations and schema drift                     | 1           | 3      | 3     | Migration dry-run in CI; naming conventions; rollback test           | Dev    | Open   |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description                                    | Probability | Impact | Score | Action  |
| ------- | -------- | ---------------------------------------------- | ----------- | ------ | ----- | ------- |
| R-009   | OPS      | Observability/logging gaps (trace IDs, health) | 1           | 2      | 2     | Monitor |
| R-010   | BUS      | Export correctness for rosters/schedules       | 1           | 2      | 2     | Monitor |

### Risk Category Legend

- TECH: Technical/Architecture
- SEC: Security
- PERF: Performance
- DATA: Data Integrity
- BUS: Business Impact
- OPS: Operations

---

## Test Coverage Plan

### P0 (Critical) — run on every main-branch change

Criteria: Blocks core journey + risk ≥6 + no workaround.

| Requirement/Flow                                      | Test Level              | Risk Link   | Test Count | Owner | Notes                                            |
| ----------------------------------------------------- | ----------------------- | ----------- | ---------- | ----- | ------------------------------------------------ |
| Auth/RBAC (admin/manager/viewer, league/season scope) | API + Integration       | R-001       | 6          | QA    | Negative authz, role matrix, tenant scoping      |
| Draft picks/keepers/undo + SSE broadcast/replay       | API + E2E (draft board) | R-002/R-003 | 6          | QA    | SSE reconnect/backoff; duplicate pick prevention |
| Trades approval updates rosters atomically            | API                     | R-002       | 3          | QA    | Transactional checks, audit                      |
| Stats upload + approval (CSV/JSON)                    | API                     | R-004       | 4          | QA    | MIME/size/schema validation, injection, approval |
| Schedule publish/republish cache bust                 | API + Integration       | R-006       | 3          | Dev   | Publish flag + ISR revalidate                    |
| Backup/restore drill (pre-draft/publish)              | Ops Check               | R-005       | 2          | Ops   | Snapshot + restore validation                    |

### P1 (High) — run on PR to main

Criteria: Important features + medium risk (3-4).

| Requirement/Flow             | Test Level      | Risk Link | Test Count | Owner  | Notes                     |
| ---------------------------- | --------------- | --------- | ---------- | ------ | ------------------------- |
| League schedule view filters | API + Component | R-006     | 3          | QA/Dev | Filters, permissions      |
| Team schedule view           | API + Component | R-006     | 2          | QA/Dev | Team scoping              |
| Roster exports               | API             | R-010     | 2          | QA     | CSV/JSON format           |
| Stats approval edge cases    | API             | R-007     | 3          | QA     | Reject reasons, re-submit |

### P2 (Medium) — nightly/weekly

Criteria: Secondary features + low risk (1-2) + edge cases.

| Requirement/Flow     | Test Level      | Risk Link | Test Count | Owner | Notes                      |
| -------------------- | --------------- | --------- | ---------- | ----- | -------------------------- |
| Player catalog CRUD  | API + Component | R-002     | 3          | Dev   | Search/filter              |
| Health/observability | API             | R-009     | 2          | Dev   | /api/health, trace headers |
| Exports edge cases   | API             | R-010     | 2          | QA    | Empty data sets            |

### P3 (Low) — on-demand

Criteria: Nice-to-have, exploratory.

- Visual polish/regression for dashboards
- Optional analytics/leaderboards formatting

---

## Execution Order

1. Smoke (fast):
   - Health endpoint returns OK
   - App boots with env vars (no Prisma/connect errors)
2. P0 suite:
   - Auth/RBAC matrix
   - Draft pick + SSE replay
   - Trades approval atomicity
   - Stats upload + approval
   - Schedule publish invalidation
   - Backup/restore check
3. P1 suite:
   - League/team schedule views
   - Roster exports
   - Stats approval edges
4. P2/P3 regression:
   - Player catalog CRUD
   - Observability/health contracts
   - Export edge cases

---

## Resource and Environment Requirements

- Test data: factories for user (role: admin/manager/viewer), league, season, team, player, roster, draft pick, trade, game, stats entry; fixtures auto-cleanup.
- Environments: Dev + Vercel preview with Neon database; ability to trigger Neon snapshot/restore in non-prod.
- Tooling: Playwright for E2E/API, k6 optional for perf baselines, Prisma migrate dry-run in CI, coverage/duplication/audit checks in CI, structured logging with trace IDs.

---

## Quality Gate Criteria

- P0 tests: 100% pass.
- No open risks with score ≥6 without active mitigation/owner.
- Auth/RBAC scoping verified for all roles and league/season contexts.
- SSE draft board reconnect/replay validated; fallback to polling documented.
- Upload validation enforced (MIME/size/schema) with approvals.
- Backup/restore procedure documented and exercised.
- Coverage present for all high-priority acceptance criteria (FR1–FR15); waivers documented for any gaps.

---

## Mitigation Plans (High Risks)

- R-001 (RBAC/tenancy): Add policy helpers; API/GraphQL authz tests per role; deny-by-default middleware; negative tests for cross-league access.
- R-002 (Draft/roster consistency): Transactional mutations; duplicate pick guards; audit trail; E2E SSE replay validation; trade approval updates rosters atomically.
- R-003 (SSE reliability): Reconnect with capped backoff; last-state replay endpoint; polling fallback path; contract tests for SSE payloads.
- R-004 (Uploads): Strict MIME/size; schema validation; sanitize fields; approval state machine; audit uploader/approver.
- R-005 (Backup/restore): Neon snapshot before draft start and schedule publish; restore drill script; document RPO/RTO expectations.

---

## Assumptions and Dependencies

- No external integrations beyond DB/auth; notifications/payments out of scope.
- Vercel + Neon provide stable connections; pooling configured.
- Architecture decisions (hybrid API, SSE, Prisma) remain as documented; changes require re-review.
- UX design not provided; test design focused on functional flows and API/UI contracts already defined.

---

## Appendix

### Knowledge Base References

- risk-governance.md
- probability-impact.md
- test-levels-framework.md
- test-quality.md
- nfr-criteria.md

### Related Documents

- PRD: docs/prd.md
- Epics: docs/epics.md
- Architecture: docs/bmm-architecture-2025-11-27.md

---

**Generated by**: BMad Test Architect workflow (System-Level Mode)
