import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { z } from "zod";

import { readServiceEnv } from "@sidewalk/config";
import type {
  ApiHealth,
  AuthStatus,
  RegisterResponse,
  LoginResponse,
  RefreshResponse,
  LogoutResponse,
  AuthErrorResponse,
  VerifyEmailResponse,
  PasswordResetRequestResponse,
  PasswordResetCompleteResponse
} from "@sidewalk/types";
import type { Account } from "./models/account.js";
import { toPublic } from "./models/account.js";
import { hashPassword, verifyPassword } from "./services/password.js";
import { MemorySessionStore } from "./services/sessionStore.js";
import { MemoryTokenStore } from "./services/tokenStore.js";
import { LockoutService } from "./services/lockout.js";
import { MemorySuspiciousLoginLogger } from "./services/suspiciousLogin.js";
import {
  loginRateLimit,
  registerRateLimit,
  resetRateLimit,
  verifyResendRateLimit
} from "./middleware/authRateLimit.js";
import { recordAuthEvent, getMetrics } from "./services/authMetrics.js";
import { authAuditLog } from "./services/authAuditLog.js";

const env = readServiceEnv(
  "api",
  z.object({
    PORT: z.coerce.number().default(4000),
    APP_ENV: z.enum(["development", "test", "production"]).default("development"),
    ENABLE_DEV_AUTH_SHORTCUTS: z.enum(["true", "false"]).default("false"),
    ENABLE_AUTH_SESSION_LIST: z.enum(["true", "false"]).default("false"),
    JWT_SECRET: z.string().min(8).default("replace-me"),
    ALLOWED_ORIGIN: z.string().url().default("http://localhost:3000")
  })
);

export const app: Express = express();

app.use(helmet());
app.use(cors({ origin: env.ALLOWED_ORIGIN, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

// ── Shared stores ─────────────────────────────────────────────────────────────
const accounts = new Map<string, Account>();
let nextId = 1;
export const sessionStore = new MemorySessionStore();
export const tokenStore = new MemoryTokenStore();
export const lockoutService = new LockoutService(
  env.APP_ENV === "test" ? { maxFailures: 3, durationMs: 1000 } : {}
);
export const suspiciousLoginLogger = new MemorySuspiciousLoginLogger();

// ── Helpers ───────────────────────────────────────────────────────────────────

function bearerToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

// ── Health / status ───────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  const payload: ApiHealth = { service: "api", status: "ok", timestamp: new Date().toISOString() };
  res.json(payload);
});

app.get("/auth/status", (_req, res) => {
  const payload: AuthStatus = {
    phase: "foundation",
    ready: false,
    nextStep: "Build signup, login, session, and recovery flows in Authentication batch 1."
  };
  res.json(payload);
});

// ── Schemas ───────────────────────────────────────────────────────────────────

const registerSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const refreshSchema = z.object({ refreshToken: z.string().min(1) });
const verifyEmailSchema = z.object({ token: z.string().min(1) });
const resetRequestSchema = z.object({ email: z.string().email() });
const resetCompleteSchema = z.object({ token: z.string().min(1), password: z.string().min(8) });

// ── Register ──────────────────────────────────────────────────────────────────

app.post("/auth/register", registerRateLimit, async (req, res) => {
  const t0 = Date.now();
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    authAuditLog(req, "register", "failure", { code: "VALIDATION_ERROR" });
    recordAuthEvent("register", "failure", Date.now() - t0);
    const err: AuthErrorResponse = { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message };
    res.status(400).json(err);
    return;
  }

  const { email, password } = parsed.data;
  if ([...accounts.values()].some((a) => a.email === email)) {
    authAuditLog(req, "register", "failure", { code: "EMAIL_TAKEN", email });
    recordAuthEvent("register", "failure", Date.now() - t0);
    const err: AuthErrorResponse = { code: "EMAIL_TAKEN", message: "Email already registered." };
    res.status(409).json(err);
    return;
  }

  const now = new Date();
  const account: Account = {
    id: String(nextId++),
    email,
    passwordHash: await hashPassword(password),
    verified: false,
    role: "citizen",
    createdAt: now,
    updatedAt: now
  };
  accounts.set(account.id, account);

  // Issue verification token (log for local dev; swap for email transport in production)
  const verifyToken = tokenStore.issue(account.id, "verify");
  if (env.APP_ENV !== "test") {
    console.log(`[dev] verify token for ${email}: ${verifyToken}`);
  }

  recordAuthEvent("register", "success", Date.now() - t0);
  authAuditLog(req, "register", "success", { accountId: account.id, email });
  const pub = toPublic(account);
  const body: RegisterResponse = { id: pub.id, email: pub.email, verified: pub.verified, createdAt: pub.createdAt.toISOString() };
  res.status(201).json(body);
});

// ── Email verification ────────────────────────────────────────────────────────

app.post("/auth/verify-email", verifyResendRateLimit, (req, res) => {
  const t0 = Date.now();
  const parsed = verifyEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    authAuditLog(req, "verify_email", "failure", { code: "VALIDATION_ERROR" });
    recordAuthEvent("verify_email", "failure", Date.now() - t0);
    const err: AuthErrorResponse = { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message };
    res.status(400).json(err);
    return;
  }

  const accountId = tokenStore.consume(parsed.data.token, "verify");
  if (!accountId) {
    authAuditLog(req, "verify_email", "failure", { code: "INVALID_TOKEN" });
    recordAuthEvent("verify_email", "failure", Date.now() - t0);
    const err: AuthErrorResponse = { code: "INVALID_TOKEN", message: "Verification token is invalid or expired." };
    res.status(400).json(err);
    return;
  }

  const account = accounts.get(accountId);
  if (!account) {
    authAuditLog(req, "verify_email", "failure", { code: "INVALID_TOKEN" });
    recordAuthEvent("verify_email", "failure", Date.now() - t0);
    const err: AuthErrorResponse = { code: "INVALID_TOKEN", message: "Verification token is invalid or expired." };
    res.status(400).json(err);
    return;
  }

  account.verified = true;
  account.updatedAt = new Date();
  recordAuthEvent("verify_email", "success", Date.now() - t0);
  authAuditLog(req, "verify_email", "success", { accountId: account.id });
  const body: VerifyEmailResponse = { message: "Email verified." };
  res.status(200).json(body);
});

// ── Login ─────────────────────────────────────────────────────────────────────

app.post("/auth/login", loginRateLimit, async (req, res) => {
  const t0 = Date.now();
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    authAuditLog(req, "login", "failure", { code: "VALIDATION_ERROR" });
    recordAuthEvent("login", "failure", Date.now() - t0);
    const err: AuthErrorResponse = { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message };
    res.status(400).json(err);
    return;
  }

  const { email, password } = parsed.data;
  const ip = req.ip ?? "unknown";
  const account = [...accounts.values()].find((a) => a.email === email);

  // Check lockout before verifying password to avoid timing leaks
  if (account && lockoutService.isLocked(account.id)) {
    authAuditLog(req, "login", "failure", { code: "ACCOUNT_LOCKED", email });
    suspiciousLoginLogger.record({ timestamp: new Date().toISOString(), email, ip, reason: "ACCOUNT_LOCKED" });
    recordAuthEvent("login", "failure", Date.now() - t0);
    const err: AuthErrorResponse = { code: "ACCOUNT_LOCKED", message: "Account temporarily locked. Please try again later." };
    res.status(403).json(err);
    return;
  }

  if (!account || !(await verifyPassword(password, account.passwordHash))) {
    if (account) {
      lockoutService.recordFailure(account.id);
    }
    suspiciousLoginLogger.record({ timestamp: new Date().toISOString(), email, ip, reason: "INVALID_CREDENTIALS" });
    recordAuthEvent("login", "failure", Date.now() - t0);
    const err: AuthErrorResponse = { code: "INVALID_CREDENTIALS", message: "Invalid email or password." };
    res.status(401).json(err);
    return;
  }

  lockoutService.recordSuccess(account.id);
  const session = sessionStore.create(account.id);
  recordAuthEvent("login", "success", Date.now() - t0);
  authAuditLog(req, "login", "success", { accountId: account.id, email });
  const body: LoginResponse = {
    accessToken: session.sessionId,
    refreshToken: session.refreshToken,
    account: { id: account.id, email: account.email, verified: account.verified, role: account.role }
  };
  res.status(200).json(body);
});

// ── Refresh ───────────────────────────────────────────────────────────────────

app.post("/auth/refresh", (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    const err: AuthErrorResponse = { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message };
    res.status(400).json(err);
    return;
  }

  const existing = sessionStore.getByRefreshToken(parsed.data.refreshToken);
  if (!existing) {
    const suspectedReuse = sessionStore.wasRefreshTokenSeen(parsed.data.refreshToken);
    if (suspectedReuse) {
      authAuditLog(req, "login", "failure", { code: "REFRESH_REUSE_DETECTED" });
    }
    const err: AuthErrorResponse = { code: "INVALID_TOKEN", message: "Refresh token is invalid or already used." };
    res.status(401).json(err);
    return;
  }

  const rotated = sessionStore.rotate(existing.sessionId);
  const body: RefreshResponse = { accessToken: rotated.sessionId, refreshToken: rotated.refreshToken };
  res.status(200).json(body);
});

// ── Password reset — request ──────────────────────────────────────────────────

// Always returns the same shape to prevent account enumeration.
app.post("/auth/password-reset/request", resetRateLimit, (req, res) => {
  const t0 = Date.now();
  const parsed = resetRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    authAuditLog(req, "password_reset_request", "failure", { code: "VALIDATION_ERROR" });
    recordAuthEvent("password_reset", "failure", Date.now() - t0);
    const err: AuthErrorResponse = { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message };
    res.status(400).json(err);
    return;
  }

  const account = [...accounts.values()].find((a) => a.email === parsed.data.email);
  if (account) {
    const resetToken = tokenStore.issue(account.id, "reset");
    if (env.APP_ENV !== "test") {
      console.log(`[dev] reset token for ${account.email}: ${resetToken}`);
    }
  }

  recordAuthEvent("password_reset", "success", Date.now() - t0);
  authAuditLog(req, "password_reset_request", "success", { email: parsed.data.email });
  const body: PasswordResetRequestResponse = {
    message: "If that email is registered you will receive a reset link shortly."
  };
  res.status(200).json(body);
});

// ── Password reset — completion ───────────────────────────────────────────────

app.post("/auth/password-reset/complete", resetRateLimit, async (req, res) => {
  const parsed = resetCompleteSchema.safeParse(req.body);
  if (!parsed.success) {
    authAuditLog(req, "password_reset_complete", "failure", { code: "VALIDATION_ERROR" });
    const err: AuthErrorResponse = { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message };
    res.status(400).json(err);
    return;
  }

  const accountId = tokenStore.consume(parsed.data.token, "reset");
  if (!accountId) {
    authAuditLog(req, "password_reset_complete", "failure", { code: "INVALID_TOKEN" });
    const err: AuthErrorResponse = { code: "INVALID_TOKEN", message: "Reset token is invalid or expired." };
    res.status(400).json(err);
    return;
  }

  const account = accounts.get(accountId);
  if (!account) {
    authAuditLog(req, "password_reset_complete", "failure", { code: "INVALID_TOKEN" });
    const err: AuthErrorResponse = { code: "INVALID_TOKEN", message: "Reset token is invalid or expired." };
    res.status(400).json(err);
    return;
  }

  account.passwordHash = await hashPassword(parsed.data.password);
  account.updatedAt = new Date();

  // Revoke all sessions so stale credentials cannot be replayed.
  sessionStore.revokeAll(accountId);

  const body: PasswordResetCompleteResponse = { message: "Password updated. Please log in again." };
  authAuditLog(req, "password_reset_complete", "success", { accountId: account.id });
  res.status(200).json(body);
});

// Development-only shortcut for local auth fixture seeding.
app.post("/auth/dev/seed-user", async (req, res) => {
  if (env.APP_ENV !== "development" || env.ENABLE_DEV_AUTH_SHORTCUTS !== "true") {
    res.status(404).json({ code: "NOT_FOUND", message: "Route not found." });
    return;
  }

  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    const err: AuthErrorResponse = { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message };
    res.status(400).json(err);
    return;
  }

  const { email, password } = parsed.data;
  const now = new Date();
  const account: Account = {
    id: String(nextId++),
    email,
    passwordHash: await hashPassword(password),
    verified: true,
    role: "citizen",
    createdAt: now,
    updatedAt: now
  };
  accounts.set(account.id, account);
  authAuditLog(req, "register", "success", { accountId: account.id, shortcut: true });
  res.status(201).json({ id: account.id, email: account.email, verified: true });
});

// ── Logout (single device) ────────────────────────────────────────────────────

app.post("/auth/logout", (req, res) => {
  const token = bearerToken(req.headers.authorization);
  if (!token) {
    const err: AuthErrorResponse = { code: "INVALID_TOKEN", message: "Missing or malformed Authorization header." };
    res.status(401).json(err);
    return;
  }

  const session = sessionStore.getBySessionId(token);
  if (!session) {
    const err: AuthErrorResponse = { code: "SESSION_NOT_FOUND", message: "Session not found or already revoked." };
    res.status(404).json(err);
    return;
  }

  sessionStore.revoke(session.sessionId);
  const body: LogoutResponse = { message: "Session revoked." };
  res.status(200).json(body);
});

// ── Logout all sessions ───────────────────────────────────────────────────────

app.post("/auth/logout/all", (req, res) => {
  const token = bearerToken(req.headers.authorization);
  if (!token) {
    const err: AuthErrorResponse = { code: "INVALID_TOKEN", message: "Missing or malformed Authorization header." };
    res.status(401).json(err);
    return;
  }

  const session = sessionStore.getBySessionId(token);
  if (!session) {
    const err: AuthErrorResponse = { code: "SESSION_NOT_FOUND", message: "Session not found or already revoked." };
    res.status(404).json(err);
    return;
  }

  sessionStore.revokeAll(session.accountId);
  const body: LogoutResponse = { message: "All sessions revoked." };
  res.status(200).json(body);
});

// ── Auth metrics ──────────────────────────────────────────────────────────────

app.get("/auth/metrics", (_req, res) => {
  res.json(getMetrics());
});

app.get("/auth/sessions", (req, res) => {
  if (env.ENABLE_AUTH_SESSION_LIST !== "true") {
    res.status(404).json({ code: "NOT_FOUND", message: "Route not found." });
    return;
  }
  const token = bearerToken(req.headers.authorization);
  if (!token) {
    const err: AuthErrorResponse = { code: "INVALID_TOKEN", message: "Missing or malformed Authorization header." };
    res.status(401).json(err);
    return;
  }
  const session = sessionStore.getBySessionId(token);
  if (!session) {
    const err: AuthErrorResponse = { code: "SESSION_NOT_FOUND", message: "Session not found or already revoked." };
    res.status(404).json(err);
    return;
  }
  res.status(200).json([{ sessionId: session.sessionId, createdAt: session.createdAt.toISOString() }]);
});

export { env };
export { resetMetrics } from "./services/authMetrics.js";
