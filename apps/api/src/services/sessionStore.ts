/**
 * Session store abstraction — issue, lookup, rotate, and revoke auth sessions.
 *
 * The in-memory implementation is suitable for local development and tests.
 * Swap it for a Redis or DB-backed implementation before production.
 */

export type Session = {
  sessionId: string;
  accountId: string;
  refreshToken: string;
  createdAt: Date;
};

export interface SessionStore {
  /** Persist a new session and return it. */
  create(accountId: string): Session;
  /** Look up a session by its sessionId (access token). Returns undefined if not found. */
  getBySessionId(sessionId: string): Session | undefined;
  /** Look up a session by its refreshToken. Returns undefined if not found or already rotated. */
  getByRefreshToken(refreshToken: string): Session | undefined;
  /** Rotate the refresh token for a session; invalidates the old refreshToken. */
  rotate(sessionId: string): Session;
  /** Revoke a single session. */
  revoke(sessionId: string): void;
  /** Revoke all sessions for an account. */
  revokeAll(accountId: string): void;
}

// ── In-memory implementation ──────────────────────────────────────────────────

import { randomBytes } from "node:crypto";

function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export class MemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, Session>();
  /** refreshToken → sessionId index for O(1) lookup */
  private readonly byRefresh = new Map<string, string>();

  create(accountId: string): Session {
    const session: Session = {
      sessionId: newToken(),
      accountId,
      refreshToken: newToken(),
      createdAt: new Date()
    };
    this.sessions.set(session.sessionId, session);
    this.byRefresh.set(session.refreshToken, session.sessionId);
    return session;
  }

  getBySessionId(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  getByRefreshToken(refreshToken: string): Session | undefined {
    const sessionId = this.byRefresh.get(refreshToken);
    return sessionId ? this.sessions.get(sessionId) : undefined;
  }

  rotate(sessionId: string): Session {
    const existing = this.sessions.get(sessionId);
    if (!existing) throw new Error("Session not found");

    // Invalidate old refresh token
    this.byRefresh.delete(existing.refreshToken);

    const updated: Session = { ...existing, refreshToken: newToken() };
    this.sessions.set(sessionId, updated);
    this.byRefresh.set(updated.refreshToken, sessionId);
    return updated;
  }

  revoke(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.byRefresh.delete(session.refreshToken);
      this.sessions.delete(sessionId);
    }
  }

  revokeAll(accountId: string): void {
    for (const [sessionId, session] of this.sessions) {
      if (session.accountId === accountId) {
        this.byRefresh.delete(session.refreshToken);
        this.sessions.delete(sessionId);
      }
    }
  }
}
