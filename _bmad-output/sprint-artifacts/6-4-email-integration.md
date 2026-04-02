# Story 6.4: Email Integration (Mailgun + ImprovMX)

Status: done

## Story

As a **league admin**,
I want to send bulk, formatted emails to players from the app using my custom domain,
so that I can communicate league announcements, draft updates, and scheduling info professionally.

## Acceptance Criteria

### AC1: Mailgun Service Integration

**Given** the app has Mailgun credentials configured
**When** the email service is initialized
**Then** it connects to the Mailgun API using `mailgun.js`
**And** it is configured to send from `noreply@<MAILGUN_DOMAIN>`

### AC2: Send Single Email

**Given** a valid recipient email and HTML content
**When** the admin triggers a single email send
**Then** the email is delivered via Mailgun API
**And** the sender shows as `noreply@<MAILGUN_DOMAIN>`
**And** the send is audit-logged with recipient, subject, and status

### AC3: Send Bulk Email to Player List

**Given** an admin selects recipients (all players, a team, or custom selection)
**When** the admin composes and sends a bulk email
**Then** the app uses Mailgun batch sending with recipient variables
**And** each recipient only sees their own address in the `To:` field
**And** batches of up to 1,000 recipients are chunked automatically
**And** the total send count and any failures are reported back

### AC4: HTML Email Composition

**Given** an admin is composing an email
**When** they enter a subject and body content
**Then** the body supports basic rich text (bold, italic, links, lists)
**And** a plain-text fallback is auto-generated from the HTML
**And** emails render correctly in Gmail, Outlook, and Apple Mail

### AC5: Recipient Selection

**Given** an admin is on the email compose page
**When** they choose recipients
**Then** they can select: all registered players for current season, all players on a specific team, or manually enter addresses
**And** duplicate addresses are deduplicated before sending

### AC6: Email Send History

**Given** bulk emails have been sent
**When** an admin views the email history
**Then** they see a list of sent emails with: date, subject, recipient count, and status
**And** the history is stored in the database

### AC7: DNS & Domain Configuration (Manual/Docs)

**Given** the domain is purchased through Vercel
**When** following the setup documentation
**Then** ImprovMX MX records are configured for inbound forwarding (`support@domain` -> Gmail)
**And** Mailgun DNS records (SPF, DKIM, CNAME) are configured for outbound sending
**And** SPF record combines both: `v=spf1 include:mailgun.org include:spf.improvmx.com ~all`

## Tasks / Subtasks

- [x] **Task 1: Mailgun service module** (AC: #1, #2)
  - [x] 1.1 Install `mailgun.js` and `form-data` packages
  - [x] 1.2 Add `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` to `.env.example` and environment
  - [x] 1.3 Create `src/service/email/emailService.ts` with `sendEmail()` and `sendBulkEmail()` functions
  - [x] 1.4 Create `src/service/email/emailClient.ts` for Mailgun client singleton initialization
  - [x] 1.5 Write unit tests for emailService (mock Mailgun client)

- [x] **Task 2: Database schema for email history** (AC: #6)
  - [x] 2.1 Create Prisma `EmailSend` model (id, subject, htmlBody, recipientCount, status, sentAt, sentById)
  - [x] 2.2 Create Prisma `EmailRecipient` model (id, emailSendId, address, status)
  - [x] 2.3 Run migration
  - [x] 2.4 Create `src/service/models/emailSendService.ts` following existing service patterns

- [x] **Task 3: GraphQL mutations and queries** (AC: #2, #3, #5, #6)
  - [x] 3.1 Add `sendEmail` mutation (single recipient) to schema + resolvers
  - [x] 3.2 Add `sendBulkEmail` mutation (recipient list or team/season filter) to schema + resolvers
  - [x] 3.3 Add `emailHistory` query with pagination to schema + resolvers
  - [x] 3.4 Wrap mutations with `withPolicy(PolicyName.ADMIN, ...)` — admin-only
  - [x] 3.5 Add audit log entries for all email sends
  - [x] 3.6 Add Effect Schema validation for email input (`emailSendSchema`)

- [x] **Task 4: Email compose UI** (AC: #4, #5)
  - [x] 4.1 Create `/admin/email` route with compose form
  - [x] 4.2 Subject input + rich text editor for body (use a lightweight RTE — e.g., TipTap or react-email for templates)
  - [x] 4.3 Recipient selector: radio group (all players / by team / manual entry)
  - [x] 4.4 Team selector dropdown (when "by team" selected) — fetch from existing `teams` query
  - [x] 4.5 Preview pane showing rendered HTML
  - [x] 4.6 Send button with confirmation modal and loading state

- [x] **Task 5: Email history UI** (AC: #6)
  - [x] 5.1 Create `/admin/email/history` route
  - [x] 5.2 Table listing sent emails: date, subject, recipient count, status
  - [x] 5.3 Click-through to detail view showing individual recipient statuses

- [x] **Task 6: DNS setup documentation** (AC: #7)
  - [x] 6.1 Document ImprovMX MX record setup for inbound forwarding
  - [x] 6.2 Document Mailgun DNS record setup (SPF, DKIM, DMARC)
  - [x] 6.3 Document combined SPF record for both services
  - [x] 6.4 Add DNS config steps to project README or ops doc

## Dev Notes

### Architecture Compliance

- **Service layer:** Create `src/service/email/` directory for email-specific service code. Follow the same `ServerContext` injection pattern used in all `src/service/models/` files.
- **Email client isolation:** Mailgun client initialization in a separate `emailClient.ts` file (similar pattern to `src/service/prisma/` for Prisma client). This prevents importing Mailgun in client components.
- **GraphQL mutations:** Use `withPolicy(PolicyName.ADMIN, ...)` wrapper — email sending is admin-only. Follow the exact pattern in `resolvers.ts` (see `createDraft`, `recordPick` for reference).
- **Audit logging:** Call `logAuditEntry()` after successful sends with `action: AuditAction.CREATE`, `entityType: "EmailSend"`. See `register` mutation for pattern with metadata.
- **Input validation:** Use Effect Schema (`validate()` from `modelServiceUtils.ts`). Remember: `Schema.Trim` is a combinator (`Schema.Trim.pipe(Schema.minLength(1))`), and `Schema.NullishOr` for GraphQL nullable fields, NOT `Schema.optional`.

### Mailgun Integration Details

- **Package:** `mailgun.js` (NOT the deprecated `mailgun-js`). Also install `form-data`.
- **Client init:**
  ```typescript
  import Mailgun from "mailgun.js";
  import FormData from "form-data";
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({ username: "api", key: process.env.MAILGUN_API_KEY! });
  ```
- **Batch sending:** Use `recipient-variables` for bulk — one API call per 1,000 recipients. Each recipient sees only their address in `To:`. Use `%recipient.name%` syntax for personalization.
- **Rate limits:** 100 requests/minute on free tier. For a hockey league (dozens of players), this is a non-issue.
- **Error handling:** Mailgun API errors should be caught and stored in the `EmailRecipient.status` field. Do NOT let Mailgun errors bubble up as unhandled — wrap in try/catch and return a result object.

### Environment Variables

```env
# Add to .env.example
MAILGUN_API_KEY=       # Mailgun private API key (starts with "key-..." or just the key)
MAILGUN_DOMAIN=        # Your verified sending domain (e.g., yourdomain.com)
```

These are server-only (no `NEXT_PUBLIC_` prefix). They must NEVER be exposed to client bundles.

### Database Schema

```prisma
model EmailSend {
  id             String           @id @default(cuid())
  subject        String
  htmlBody       String
  textBody       String?
  recipientCount Int
  status         String           @default("sent")  // sent, partial_failure, failed
  sentAt         DateTime         @default(now())
  sentBy         User             @relation(fields: [sentById], references: [id])
  sentById       String
  recipients     EmailRecipient[]
  createdAt      DateTime         @default(now())
}

model EmailRecipient {
  id          String    @id @default(cuid())
  emailSend   EmailSend @relation(fields: [emailSendId], references: [id])
  emailSendId String
  address     String
  name        String?
  status      String    @default("queued")  // queued, delivered, failed
}
```

### UI Patterns

- Use HeroUI components consistent with existing pages (see draft board UI for reference).
- Forms: `react-hook-form` with `@hookform/resolvers/effect-ts` for validation — same pattern as all other forms in the app.
- Client components CANNOT import from `@/service/prisma` — use local const enums if needed.
- Admin-only pages: guard with session check, redirect unauthorized users.

### Testing

- **Unit tests** for `emailService.ts`: mock the Mailgun client, test `sendEmail()` and `sendBulkEmail()` with various inputs (single, batch, failures).
- **Unit tests** for `emailSendService.ts`: standard CRUD tests using Prisma mock (SQLite in-memory). Follow patterns in existing service tests.
- **Integration test** for GraphQL mutations: test `sendEmail` and `sendBulkEmail` mutations through resolver with mocked Mailgun.
- Use `@ngneat/falso` for random test data. Use `createCtx()` from `test/utils.ts`.
- Add `make*()` and `insert*()` factory functions to `test/modelFactory.ts` for `EmailSend` and `EmailRecipient`.
- **Note:** SQLite test DB does NOT support `String[]` arrays — use Json type if array storage needed.

### DNS Configuration Reference

**Mailgun (outbound sending):**
| Type | Name | Value |
|------|------|-------|
| TXT | `yourdomain.com` | `v=spf1 include:mailgun.org include:spf.improvmx.com ~all` |
| TXT (DKIM) | `smtp._domainkey.yourdomain.com` | (provided by Mailgun dashboard) |
| CNAME | `email.yourdomain.com` | `mailgun.org` |
| TXT (DMARC) | `_dmarc.yourdomain.com` | `v=DMARC1; p=quarantine;` |

**ImprovMX (inbound forwarding):**
| Type | Name | Value | Priority |
|------|------|-------|----------|
| MX | `yourdomain.com` | `mx1.improvmx.com` | 10 |
| MX | `yourdomain.com` | `mx2.improvmx.com` | 20 |

Both coexist on the same domain — MX records (ImprovMX) and TXT/CNAME records (Mailgun) serve different purposes.

### Project Structure Notes

New files to create:

```
src/
  service/
    email/
      emailClient.ts          # Mailgun client singleton
      emailService.ts          # sendEmail(), sendBulkEmail()
  service/
    models/
      emailSendService.ts      # CRUD for EmailSend/EmailRecipient
    validation/
      schemas.ts               # Add emailSendSchema, bulkEmailSchema
  graphql/
    resolvers.ts               # Add email mutations + queries
    schema.ts                  # Add email types, inputs, mutations, queries
  app/
    admin/
      email/
        page.tsx               # Email compose page
        history/
          page.tsx             # Email history page
test/
  service/
    email/
      emailService.test.ts
    models/
      emailSendService.test.ts
```

### References

- [Source: _bmad-output/architecture.md#API-contract] — Hybrid GraphQL/REST pattern
- [Source: _bmad-output/architecture.md#Authentication-Authorization] — RBAC with withPolicy()
- [Source: _bmad-output/architecture.md#Testing-QA] — Jest + Testing Library standards
- [Source: _bmad-output/epics.md#Epic-6] — Exports & League Views epic context
- [Source: src/graphql/resolvers.ts] — Mutation patterns with withPolicy and audit logging
- [Source: src/service/models/userService.ts] — Service layer patterns (ServerContext, validate, errors)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Mailgun client lazy-init required to prevent test crashes when MAILGUN_API_KEY env var absent
- Codegen mappers added for EmailSend/EmailRecipient to resolve Prisma ↔ GraphQL parent type mismatch
- Code review: Fixed 7 issues (3 HIGH, 3 MEDIUM, 1 LOW) — broken manual recipients field, missing validation calls, missing integration tests, no pagination, no plain-text fallback, generic error type, missing env guard
- InputMaybe<string> (null | string | undefined) → converted to string | undefined at resolver boundary

### Completion Notes List

- Task 1: Mailgun service module — emailClient.ts (lazy singleton), emailService.ts (sendEmail + sendBulkEmail with 1000-recipient batching), 6 unit tests
- Task 2: Prisma EmailSend + EmailRecipient models, emailSendService.ts (CRUD), factory functions, 6 unit tests
- Task 3: GraphQL type-defs (EmailSend, EmailRecipient, SendEmailResult, SendBulkEmailResult types + inputs + mutations + queries), resolvers with withPolicy ADMIN, audit logging, recipient deduplication, team/season lookup, Effect Schema validation schemas
- Task 4: /admin/email compose page — subject input, HTML textarea with preview toggle, recipient radio selector (all players/team/manual), cascading league→season→team dropdowns, confirmation modal, send mutation
- Task 5: /admin/email/history list page with status chips, /admin/email/history/[id] detail page with rendered HTML body and recipient status table
- Task 6: docs/email-dns-setup.md — ImprovMX inbound + Mailgun outbound DNS config, combined SPF, Vercel DNS instructions

### File List

- src/service/email/emailClient.ts (new)
- src/service/email/emailService.ts (new)
- src/service/models/emailSendService.ts (new)
- src/service/validation/schemas.ts (modified — added sendEmailSchema, sendBulkEmailSchema)
- src/graphql/type-defs.mjs (modified — added email types, inputs, queries, mutations)
- src/graphql/resolvers.ts (modified — added email resolvers)
- src/graphql/generated.ts (regenerated)
- src/app/admin/email/page.tsx (new)
- src/app/admin/email/history/page.tsx (new)
- src/app/admin/email/history/[id]/page.tsx (new)
- prisma/schema.prisma (modified — added EmailSend, EmailRecipient models + User relation)
- tmp/schema.prisma (modified — synced test schema)
- codegen.mjs (modified — added EmailSend/EmailRecipient mappers)
- .env.example (modified — added MAILGUN_API_KEY, MAILGUN_DOMAIN)
- package.json (modified — added mailgun.js, form-data)
- package-lock.json (modified)
- test/jest.setup.ts (modified — added email table cleanup)
- test/modelFactory.ts (modified — added email factory functions)
- test/service/email/emailService.test.ts (new — 6 tests)
- test/service/models/emailSendService.test.ts (new — 6 tests)
- test/graphql/email.integration.test.ts (new — 8 tests)
- docs/email-dns-setup.md (new)
- tmp/schema.prisma (modified — synced test schema)
- \_bmad-output/epics.md (modified — replaced story 6.3 with email integration)
