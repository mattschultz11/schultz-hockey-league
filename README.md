## Schultz Hockey League Scaffold

A Next.js 16 App Router workspace that already has the requested tooling and libraries wired up (HeroUI, Tailwind CSS, Effect, GraphQL, Apollo Client, Prisma, PostgreSQL, ESLint, Prettier, Jest, lint-staged, Husky). No bespoke UI or domain logic has been generated so you can start from a clean slate.

## Included Setup

- ⚛️ **Next.js + TypeScript** with strict compiler options and `@/*` aliases
- 🎨 **HeroUI + Tailwind CSS v4** ready to use through `tailwind.config.ts`
- 🧠 **Effect + @effect/schema** for typed utilities
- 🧵 **GraphQL + Apollo Client** packages installed (no schema/resolvers defined yet)
- 🗄️ **Prisma + PostgreSQL** with `prisma/schema.prisma`, `prisma.config.ts`, and helper scripts
- ✅ **ESLint (Flat config)** with Testing Library rules, **Prettier + Tailwind plugin**, **Jest** (Next-aware), **lint-staged**, **Husky**

## Getting Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Duplicate `.env.example` to `.env` and provide your PostgreSQL connection string:

   ```bash
   cp .env.example .env
   ```

3. Generate the Prisma client (rerun whenever the schema changes):

   ```bash
   npm run prisma:generate
   ```

4. (Optional) Start PostgreSQL via Docker Compose:

   ```bash
   docker compose up -d postgres
   ```

   This spins up a Postgres 16 container with credentials matching `.env.example`. Tear it down with `docker compose down` (data persists in the named volume).

5. Launch the dev server:

   ```bash
   npm run dev
   ```

The dashboard lives at [http://localhost:3000](http://localhost:3000). Live widgets hit `/api/graphql`, so no extra services are required for the mock data set.

## Quality-of-life Scripts

| Command                           | Description                                                       |
| --------------------------------- | ----------------------------------------------------------------- |
| `npm run lint`                    | ESLint (Next + Testing Library profiles) with zero-warning budget |
| `npm run format` / `format:check` | Prettier + Tailwind class sorter                                  |
| `npm run test`                    | Jest + Testing Library w/ jsdom                                   |
| `npm run typecheck`               | Strict `tsc --noEmit`                                             |
| `npm run prisma:migrate`          | Run/create Prisma migrations                                      |
| `npm run prisma:studio`           | Launch Prisma Studio                                              |

### Docker workflow

- `docker compose up -d postgres` – start the local PostgreSQL instance defined in `docker-compose.yml`.
- `docker compose logs -f postgres` – tail database logs.
- `docker compose down` – stop/remove the container (data stays in the named volume).

## GraphQL API

- Endpoint: `http://localhost:3000/api/graphql`
- Powered by GraphQL Yoga + Prisma; every Prisma model (`User`, `League`, `Season`, `Team`, `Player`, `Game`, `Goal`, `Penalty`, `DraftPick`) includes `Query` + `Mutation` CRUD operations.
- GraphiQL is available during development. Example query:

  ```graphql
  query Example {
    leagues {
      id
      name
      seasons {
        id
        name
      }
    }
  }
  ```

Husky + lint-staged automatically format and lint staged files on commit (`npm install` wires the Git hooks via the `prepare` script). Build your own pages, API routes, prisma models, and GraphQL schema when you are ready—the workspace contains only the baseline configuration.
