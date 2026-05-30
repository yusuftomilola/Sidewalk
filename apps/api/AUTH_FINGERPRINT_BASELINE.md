# Device + Session Fingerprint Baseline

Minimal fingerprint model for future hardening:

- `ip`: request source IP
- `ua`: user agent string
- `accountId`: auth subject
- `sessionId`: current session identifier
- `event`: login / refresh / logout / reset / verify

Use cases:
- Detect suspicious refresh-token reuse on changed fingerprint.
- Correlate abuse events across account and network dimensions.
- Keep storage/audit payloads safe (no raw credentials/tokens).
