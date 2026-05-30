# Auth Cookie + CORS Test Matrix

## Web to API boundary checks

- Allowed origin with credentials: `200` and `Access-Control-Allow-Credentials: true`
- Disallowed origin: blocked by CORS policy
- Preflight `OPTIONS` request: returns `204`
- Auth cookies in production:
  - `Secure=true`
  - `HttpOnly=true`
  - `SameSite=Strict`

## Notes

- Sidewalk currently uses bearer token headers in starter flow; this matrix is baseline guidance for cookie rollout.
- Keep this file updated when adding cookie-based auth.
