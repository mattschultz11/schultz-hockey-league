# Schultz Hockey League - Project Memory

## Key Architecture

- Next.js 16 + GraphQL Yoga + Prisma 7 + Effect library
- 9 model service files in `src/service/models/`
- GraphQL resolvers in `src/graphql/resolvers.ts` use service functions
- `withPolicy()` HOF wraps mutations with RBAC (catches AuthError + ServiceError subclasses)
- Yoga `maskError` handles errors from queries/field resolvers
- Effect Schema used for input validation (not Zod - user preference)
- `effect` package provides Schema, Option, ParseResult etc.

## Error Handling

- `ServiceError` hierarchy in `src/service/errors.ts`: NotFoundError, ValidationError, ConflictError
- `invariant()` in `assertionUtils.ts` throws `ValidationError` (not `InvariantError`)
- `validate()` utility in `modelServiceUtils.ts` uses Effect Schema `decodeUnknownSync`
- Validation schemas in `src/service/validation/schemas.ts`

## Testing

- Jest 30 with `@ngneat/falso` for random data
- Test factories in `test/modelFactory.ts` with `make*()` and `insert*()` functions
- `createCtx()` helper in `test/utils.ts`
- Prisma mock in `src/service/prisma/__mocks__/`
- Run: `npm test -- --runInBand`

## Gotchas

- `return await` is required in async try/catch to catch rejected promises (rbacPolicy.ts)
- Effect Schema `Trim` is a schema combinator (not a pipe filter): `Schema.Trim.pipe(Schema.minLength(1))`
- Description/free-text fields should NOT have `maxLength(255)` — only name fields
- `findUnique().relation()` enables Prisma query batching (vs `findUniqueOrThrow` which doesn't)
- Team stats (wins/losses/ties/points) use WeakMap-based per-request caching to avoid 4x duplicate queries
