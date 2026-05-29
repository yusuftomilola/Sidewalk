/**
 * Suspicious login event logger.
 *
 * Supported heuristics (first milestone):
 *   - INVALID_CREDENTIALS  — wrong password or unknown email
 *   - ACCOUNT_LOCKED       — account temporarily locked after repeated failures
 *
 * Intentionally excluded from events: passwords, tokens, raw credentials.
 * Extend `SuspiciousLoginReason` as new heuristics are added.
 */

export type SuspiciousLoginReason = "INVALID_CREDENTIALS" | "ACCOUNT_LOCKED";

export type SuspiciousLoginEvent = {
  /** ISO-8601 timestamp of the attempt. */
  timestamp: string;
  /** Email address supplied in the request (not verified to exist). */
  email: string;
  /** Client IP address, or "unknown" when unavailable. */
  ip: string;
  /** Heuristic that triggered the event. */
  reason: SuspiciousLoginReason;
};

export interface SuspiciousLoginLogger {
  record(event: SuspiciousLoginEvent): void;
  getAll(): readonly SuspiciousLoginEvent[];
}

export class MemorySuspiciousLoginLogger implements SuspiciousLoginLogger {
  private readonly events: SuspiciousLoginEvent[] = [];

  record(event: SuspiciousLoginEvent): void {
    this.events.push(event);
  }

  getAll(): readonly SuspiciousLoginEvent[] {
    return this.events;
  }
}
