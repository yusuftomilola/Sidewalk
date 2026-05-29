/**
 * Account lockout service.
 *
 * Policy (configurable via LockoutOptions):
 *   - After `maxFailures` consecutive failed logins the account is locked for
 *     `durationMs` milliseconds.
 *   - A successful login resets the failure counter.
 *   - Lockout state is held in memory; swap for a persistent store before
 *     production.
 *
 * Defaults are intentionally lenient for development/test environments.
 * Tighten via environment config before deploying to production.
 */

export type LockoutOptions = {
  /** Number of consecutive failures before lockout. Default: 5. */
  maxFailures?: number;
  /** Lockout duration in milliseconds. Default: 15 minutes. */
  durationMs?: number;
};

type LockoutRecord = {
  failures: number;
  lockedUntil: number | null;
};

export class LockoutService {
  private readonly maxFailures: number;
  private readonly durationMs: number;
  private readonly records = new Map<string, LockoutRecord>();

  constructor(opts: LockoutOptions = {}) {
    this.maxFailures = opts.maxFailures ?? 5;
    this.durationMs = opts.durationMs ?? 15 * 60 * 1000;
  }

  /** Returns true if the account is currently locked. */
  isLocked(accountId: string): boolean {
    const rec = this.records.get(accountId);
    if (!rec?.lockedUntil) return false;
    if (Date.now() < rec.lockedUntil) return true;
    // Lock expired — clear it
    rec.lockedUntil = null;
    rec.failures = 0;
    return false;
  }

  /** Record a failed login attempt; returns true if this triggers a lockout. */
  recordFailure(accountId: string): boolean {
    const rec = this.records.get(accountId) ?? { failures: 0, lockedUntil: null };
    rec.failures += 1;
    if (rec.failures >= this.maxFailures) {
      rec.lockedUntil = Date.now() + this.durationMs;
    }
    this.records.set(accountId, rec);
    return rec.lockedUntil !== null;
  }

  /** Reset failure counter on successful login. */
  recordSuccess(accountId: string): void {
    this.records.delete(accountId);
  }
}
