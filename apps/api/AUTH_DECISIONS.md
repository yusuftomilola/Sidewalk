# Auth Decision Record (MVP Starter)

## Role model (first pass)

The auth milestone establishes a minimal role baseline so later citizen, agency,
and admin work can branch cleanly from it.

**Decision:** All accounts created during the auth milestone receive the
`citizen` role. The `AccountRole` union (`citizen | agency | admin`) is defined
in `packages/types/src/auth.ts` and included in `AuthUser` and `LoginResponse`
so the field is present from day one without pretending later permissions exist.

Expansion points:
- `agency` role: introduced in the Identity milestone when agency-specific
  reporting routes are added.
- `admin` role: introduced in the Admin and Moderation milestone.
- Full RBAC (per-resource permissions): deferred until after Reporting milestone.

Shared types and the `Account` model already carry the `role` field. No
permission-gating logic is wired during the auth phase.

## Password policy

- Minimum length: 8 characters (matches API validation).
- No complexity regex in MVP to reduce signup friction during hackathons.
- Weak/common-password blocking is deferred to a follow-up once persistent user storage is introduced.
- Reset policy: password reset completion revokes all sessions.

Tradeoff:
- Faster contributor onboarding now, stronger password quality controls planned as a next hardening pass.

## Feature-flag rollout baseline

Lightweight environment flags in API:
- `ENABLE_DEV_AUTH_SHORTCUTS` for local-only seed helpers.
- `ENABLE_AUTH_SESSION_LIST` for gradual rollout of session-listing behavior.

Guidance:
- New auth capabilities should default OFF.
- Route handlers must return `404` when a flag is disabled.

## Brute-force defensive posture

Current multi-signal baseline:
- Account-level lockout via failed-login counters.
- Route-level rate limiting for auth endpoints.
- Suspicious login logging with origin/IP context.

False-positive minimization:
- Lockout is time-boxed and automatically expires.
- Unknown-account responses remain generic.

## Refresh reuse signal

- Reused/rotated refresh tokens are tracked as suspicious reuse signals.
- Reuse emits a safe structured log event (`REFRESH_REUSE_DETECTED`) for review.
