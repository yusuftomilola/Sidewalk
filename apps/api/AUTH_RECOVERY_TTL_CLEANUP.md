# Password Recovery Expiration + Cleanup Strategy

- Token TTL: 1 hour (current `MemoryTokenStore` policy).
- Token mode: single-use consume semantics.
- Cleanup trigger:
  - immediate deletion on consume
  - expiry check on consume
  - optional future background sweep for long-running processes

Operational note:
- Keep responses enumeration-safe for unknown accounts.
- Emit safe audit events for request and completion checkpoints.
