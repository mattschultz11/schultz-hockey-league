# Engineering Backlog

This backlog collects cross-cutting or future action items that emerge from reviews and planning.

Routing guidance:

- Use this file for non-urgent optimizations, refactors, or follow-ups that span multiple stories/epics.
- Must-fix items to ship a story belong in that story’s `Tasks / Subtasks`.
- Same-epic improvements may also be captured under the epic Tech Spec `Post-Review Follow-ups` section.

| Date       | Story | Epic | Type     | Severity | Owner | Status | Notes                                                                                                                                                                        |
| ---------- | ----- | ---- | -------- | -------- | ----- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2025-12-09 | 1.2   | 1    | Bug      | High     | TBD   | Open   | Implement RBAC middleware for REST/GraphQL covering admin/manager/viewer and add enforcement tests (files: src/graphql/resolvers.ts; src/service/auth/authService.ts; tests) |
| 2025-12-09 | 1.2   | 1    | TechDebt | Med      | TBD   | Open   | Add structured audit logging/metrics for auth allow/deny and protected route access (files: src/service/auth/authService.ts; src/service/auth/authOptions.ts)                |
| 2025-12-09 | 1.2   | 1    | TechDebt | Med      | TBD   | Open   | Seed and document role mapping with dev fixtures for admin/manager/viewer (files: prisma/\*; docs)                                                                           |
| 2025-12-09 | 1.2   | 1    | Test     | Low      | TBD   | Open   | Add auth/RBAC test suite for cookie flags, role assignment, manager 403, viewer read-only coverage (files: test/service/auth/\*)                                             |
