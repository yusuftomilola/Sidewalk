# Minimum Signup Fields — MVP Decision

## Decision

The MVP signup form collects **email and password only**.

```
POST /auth/register
{ "email": "...", "password": "..." }
```

No display name, phone number, or profile fields are collected at registration.

## Rationale

- Civic products require user trust. Asking for more than necessary at signup
  increases drop-off and raises privacy concerns.
- Email is required for verification and account recovery.
- Password is required for credential-based auth (the only auth method in the
  auth milestone).
- All other profile data belongs to the Identity milestone, not auth.

## Explicitly ruled out for MVP signup

| Field | Reason deferred |
|---|---|
| Display name | Identity milestone — not needed to authenticate |
| Phone number | Not required for any auth flow in scope |
| Date of birth | No age-gating in MVP |
| Location / jurisdiction | Reporting milestone concern |
| Profile photo | Identity milestone |
| Role selection | All accounts start as `citizen`; role assignment is admin-only |

## Future expansion

The Identity milestone will introduce a profile-completion step after first
login. That step is separate from registration and does not block account
creation or email verification.

## Alignment

- API: `RegisterRequest` in `packages/types/src/auth.ts` — `{ email, password }`
- Web: `apps/web/app/` signup form — email + password fields only
- Mobile: `apps/mobile/App.tsx` signup screen — email + password fields only
- Validation: `apps/web/lib/authValidation.ts` — `validateEmail`, `validatePassword`
