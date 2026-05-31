# Stellar-service route boundaries

This document records which `apps/stellar-service` endpoints are public and which require a trusted internal caller. It is the authoritative reference for contributors adding new routes.

## Public routes

These routes are intentionally open. They expose no user data and carry no side effects that require authentication.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness probe — returns service name and timestamp |
| GET | `/network` | Stellar network diagnostics — horizon URL, passphrase, base fee |

Public routes must stay minimal. Do not add user-specific logic here.

## Protected routes (trusted internal callers only)

These routes require the API to forward a verified account context via the `x-internal-auth-claims` header (see `InternalAuthClaims` in `packages/types/src/auth.ts`).

| Method | Path | Verified account required | Purpose |
|--------|------|--------------------------|---------|
| POST | `/wallet-intent` | Yes | Records intent to provision a Stellar wallet for the account |

### Trust contract

The API sets `x-internal-auth-claims` to a JSON-serialised `InternalAuthClaims` object before calling any protected route:

```ts
// packages/types/src/auth.ts
export type InternalAuthClaims = {
  sub: string;      // stable account ID
  verified: boolean; // email verification state
};
```

The `requireTrustedCaller` middleware in `apps/stellar-service/src/server.ts` enforces this contract:

- **Missing header** → `401 MISSING_INTERNAL_CLAIMS`
- **Malformed JSON or wrong shape** → `401 INVALID_INTERNAL_CLAIMS`
- **`verified: false`** → `403 ACCOUNT_UNVERIFIED`
- **`verified: true`** → request proceeds

### Why verified accounts only

Wallet provisioning creates on-chain state. Allowing unverified accounts to trigger it would let throwaway registrations consume Stellar resources and pollute trust signals. The verification gate is enforced in the service layer so the API cannot accidentally bypass it.

## Adding new routes

1. Decide: does the route need user identity? If yes, it is protected.
2. Apply `requireTrustedCaller` as the first middleware on the route.
3. Update the table above.
4. Add tests covering the rejection cases (missing header, unverified account) and the happy path.

Future wallet and receipt tasks should reference this document rather than re-deciding the boundary.
