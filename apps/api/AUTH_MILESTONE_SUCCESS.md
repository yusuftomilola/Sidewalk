# Authentication Milestone — Success Criteria

This document defines what "done enough" means for the Authentication milestone
so contributors can prioritise work and the team can decide when to move on.

## Product criteria

- [ ] A user can create an account with email and password.
- [ ] A user receives a verification email and can confirm their address.
- [ ] A verified user can sign in and receive a session.
- [ ] A signed-in user can sign out (single device and all devices).
- [ ] A user can request a password reset and complete it via email link.
- [ ] A user with an expired or invalid reset link sees a clear recovery path.
- [ ] Session expiry is handled gracefully on web and mobile (redirect, not crash).

## Engineering criteria

- [ ] All auth endpoints are covered by integration tests (`apps/api/src/__tests__/auth.test.ts`).
- [ ] TypeScript typechecks pass across all workspaces (`pnpm typecheck`).
- [ ] Lint passes across all workspaces (`pnpm lint`).
- [ ] Build succeeds across all workspaces (`pnpm build`).
- [ ] Shared auth contracts live in `packages/types/src/auth.ts` and are consumed
      by API, web, and mobile — no duplicated inline types.
- [ ] Auth error codes are runtime constants (`AUTH_ERROR_CODES`) used consistently
      across API handlers, UI mappers, and tests.
- [ ] Rate limiting is active on login, register, reset, and verify-resend routes.
- [ ] Account lockout triggers after repeated failed logins and expires automatically.
- [ ] Suspicious login events are logged with origin context.
- [ ] Password reset completion revokes all existing sessions.
- [ ] The dev seed shortcut (`/auth/dev/seed-user`) is gated behind env flags and
      returns 404 in non-development environments.

## Contributor-experience criteria

- [ ] A new contributor can run `pnpm install && pnpm dev:api` and hit `/health`
      within five minutes.
- [ ] Auth API surface is documented in `apps/api/AUTH_API.md`.
- [ ] Auth decisions (password policy, rate limiting, role model, signup fields)
      are documented in `apps/api/AUTH_DECISIONS.md`.
- [ ] Auth copy conventions are documented in `apps/web/AUTH_COPY_GUIDE.md`.
- [ ] Web auth contributor notes are in `apps/web/AUTH_CONTRIBUTING.md`.
- [ ] CI runs typecheck, lint, and build on every pull request.

## What this milestone does not need to deliver

The following are explicitly deferred to later milestones:

- Full RBAC or permission-gated routes (Identity milestone)
- Agency or admin role assignment (Identity / Admin milestone)
- Profile fields beyond email (Identity milestone)
- Stellar wallet linking (Stellar milestone)
- Push or SMS notifications (Notifications milestone)
- Offline session handling (Mobile resilience milestone)
- Production email transport (can use console logging in dev/CI)

## Using these criteria

Use this list to decide whether a new auth issue belongs in the current
milestone or should be deferred. If an issue does not move any of the unchecked
boxes above, it is a candidate for deferral.
