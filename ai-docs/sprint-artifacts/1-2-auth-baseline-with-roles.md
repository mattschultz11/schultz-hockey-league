# Story 1.2: Auth baseline with roles

Status: drafted

## Story

As an admin, I want login with session cookies and roles (admin/manager/viewer), so that access is enforced per role across the app.

## Requirements Context Summary

- Epic intent: establish login with session cookies and role-aware enforcement (admin/manager/viewer) so protected routes honor permissions. (Source: ai-docs/epics.md#Epic-1-Foundation--Access)
- PRD roles/access: admins full write, managers limited write, viewers read-only; no payments/notifications in MVP. (Source: ai-docs/prd.md#Roles--Access)
- Architecture guardrails: NextAuth session cookies, RBAC checks at handler/resolver entry, deny-by-default, audit writes, and HTTPS/secure cookies. (Source: ai-docs/architecture.md#Executive-Summary)
- Performance/ops: health endpoint target ≤500ms, structured logging with requestId, and Postgres/Prisma as the data source. (Source: ai-docs/prd.md#Non-Functional-Requirements)

## Acceptance Criteria

1. Given a configured NextAuth provider, when a known user signs in, then a session cookie is set and user has a role. (Source: ai-docs/epics.md#Story-1.2:-Auth-baseline-with-roles-(MVP))
2. When a manager accesses admin-only endpoints, then access is denied with 403. (Source: ai-docs/epics.md#Story-1.2:-Auth-baseline-with-roles-(MVP))
3. When a viewer accesses read-only pages, then access succeeds without write affordances. (Source: ai-docs/epics.md#Story-1.2:-Auth-baseline-with-roles-(MVP))
4. Session cookies are httpOnly/secure and role is enforced in API guards. (Source: ai-docs/epics.md#Story-1.2:-Auth-baseline-with-roles-(MVP))
5. Metrics: 100% protected routes enforce role; 0 unauthorized writes observed in audit. (Source: ai-docs/epics.md#Story-1.2:-Auth-baseline-with-roles-(MVP))

## Tasks / Subtasks

- [ ] Configure NextAuth provider and session settings (AC: #1, #4)
  - [ ] Add provider config, session cookie flags (secure, httpOnly, sameSite), and callback to attach role claim.
  - [ ] Add startup guard to fail if required auth env vars missing.
- [ ] Define role model and persistence (AC: #1, #4)
  - [ ] Add role field/mapping in Prisma schema and seed minimal users/roles for dev.
  - [ ] Document role mapping table for admin/manager/viewer.
- [ ] Enforce RBAC in API/GraphQL handlers (AC: #2, #3, #4, #5)
  - [ ] Add middleware/policy helper to enforce roles on protected routes; default deny.
  - [ ] Guard admin-only endpoints and ensure viewer routes stay read-only.
- [ ] Auditing and logging for auth actions (AC: #5)
  - [ ] Record auth-related access violations and successful role checks with requestId/context.
- [ ] Testing (AC: #1–#5)
  - [ ] Add integration tests for sign-in session creation and role claims.
  - [ ] Add tests for 403 on admin endpoints for manager/viewer and allow for admin.
  - [ ] Add tests ensuring viewer paths are read-only and no write affordances.

## Dev Notes

- Use NextAuth session strategy with secure/httpOnly cookies and role claim attached during sign-in callback; deny-by-default at handler/resolver entry. (Source: ai-docs/architecture.md#Executive-Summary)
- RBAC enforcement should wrap both REST route handlers and GraphQL resolvers; reuse shared policy helper to avoid drift. (Source: ai-docs/prd.md#Roles--Access)
- Audit any write attempts (including denied ones) and log with requestId for traceability. (Source: ai-docs/architecture.md#Security-Architecture)
- Previous story status: drafted (1-1-project-setup-and-environments) → no implementation learnings yet; keep structure consistent with health check story paths.

### Structure Alignment Summary

- Keep story artifacts in `ai-docs/sprint-artifacts` aligned with sprint-status ordering. (Source: ai-docs/sprint-status.yaml)
- Reuse shared Prisma client and NextAuth route location already planned in architecture doc to avoid duplication.
- No prior implemented stories to align; ensure outputs match health check and RBAC paths for future reuse.

### Project Structure Notes

- Place auth config under `app/api/auth` (NextAuth route) and shared RBAC helper under `src/auth/policies`.
- Ensure Prisma client is reused via shared singleton to avoid connection sprawl.
- Keep story artifacts in `ai-docs/sprint-artifacts`; this story file lives at `ai-docs/sprint-artifacts/1-2-auth-baseline-with-roles.md`.

### References

- [Source: ai-docs/epics.md#Story-1.2:-Auth-baseline-with-roles-(MVP)]
- [Source: ai-docs/prd.md#Roles--Access]
- [Source: ai-docs/architecture.md#Executive-Summary]
- [Source: ai-docs/architecture.md#Security-Architecture]

## Dev Agent Record

### Context Reference

### Agent Model Used

gpt-5 (draft)

### Debug Log References

### Completion Notes List

### File List

## Change Log

- Draft created for Story 1-2-auth-baseline-with-roles.
