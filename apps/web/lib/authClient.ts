/**
 * Thin auth client for the web app.
 * Stores tokens in sessionStorage and handles refresh + expiry.
 */

import type { SessionTokens } from "@sidewalk/types";
import type {
  AuthErrorResponse,
  PasswordResetCompleteRequest,
  PasswordResetCompleteResponse,
  PasswordResetRequestRequest,
  PasswordResetRequestResponse,
} from "@sidewalk/types";

const ACCESS_KEY = "sw_access";
const REFRESH_KEY = "sw_refresh";

export type AuthChallengeContext = {
  flow: "login" | "signup";
  email?: string;
};

export type AuthChallengeResult = {
  token?: string;
};

export type AuthChallengeHandler = (
  context: AuthChallengeContext
) => Promise<AuthChallengeResult>;

let authChallengeHandler: AuthChallengeHandler | null = null;

/**
 * Register a future anti-bot challenge handler (e.g. CAPTCHA, device check).
 * Current behavior is unchanged until a handler is provided by the UI layer.
 */
export function setAuthChallengeHandler(
  handler: AuthChallengeHandler | null
): void {
  authChallengeHandler = handler;
}

async function getChallengeToken(
  context: AuthChallengeContext
): Promise<string | undefined> {
  if (!authChallengeHandler) return undefined;
  const result = await authChallengeHandler(context);
  return result.token;
}

function endpoint(path: string): string {
  return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
}

type AuthResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

async function postAuth<TResponse, TBody>(
  path: string,
  body: TBody
): Promise<AuthResult<TResponse>> {
  try {
    const res = await fetch(endpoint(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let message = "Request failed.";
      try {
        const data = (await res.json()) as { message?: string };
        if (typeof data.message === "string") message = data.message;
      } catch {
        // Keep fallback message when response body is not parseable JSON.
      }
      return { ok: false, message };
    }

    const data = (await res.json()) as TResponse;
    return { ok: true, data };
  } catch {
    return { ok: false, message: "Network error. Please try again." };
  }
}

export async function register(
  body: RegisterRequest
): Promise<AuthResult<RegisterResponse>> {
  const challengeToken = await getChallengeToken({
    flow: "signup",
    email: body.email,
  });
  return postAuth<RegisterResponse, RegisterRequest & { challengeToken?: string }>(
    "/auth/register",
    { ...body, challengeToken }
  );
}

export async function login(
  body: LoginRequest
): Promise<AuthResult<LoginResponse>> {
  const challengeToken = await getChallengeToken({
    flow: "login",
    email: body.email,
  });
  return postAuth<LoginResponse, LoginRequest & { challengeToken?: string }>(
    "/auth/login",
    { ...body, challengeToken }
  );
}

export function saveTokens(tokens: SessionTokens): void {
  sessionStorage.setItem(ACCESS_KEY, tokens.accessToken);
  sessionStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_KEY);
}

const UNKNOWN_ERROR: AuthErrorResponse = {
  code: "VALIDATION_ERROR",
  message: "Something went wrong. Please try again.",
};

type AuthSuccess<T> = {
  ok: true;
  data: T;
};

type AuthFailure = {
  ok: false;
  error: AuthErrorResponse;
};

export type AuthResult<T> = AuthSuccess<T> | AuthFailure;

function endpoint(path: string): string {
  return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
}

async function parseAuthError(res: Response): Promise<AuthErrorResponse> {
  try {
    const err = (await res.json()) as Partial<AuthErrorResponse>;
    if (typeof err.message === "string" && typeof err.code === "string") {
      return err as AuthErrorResponse;
    }
    return UNKNOWN_ERROR;
  } catch {
    return UNKNOWN_ERROR;
  }
}

async function authRequest<TResponse, TBody>(
  path: string,
  body: TBody
): Promise<AuthResult<TResponse>> {
  try {
    const res = await fetch(endpoint(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    });

    if (!res.ok) {
      return { ok: false, error: await parseAuthError(res) };
    }

    const data = (await res.json()) as TResponse;
    return { ok: true, data };
  } catch {
    return { ok: false, error: UNKNOWN_ERROR };
  }
}

export function requestPasswordReset(
  body: PasswordResetRequestRequest
): Promise<AuthResult<PasswordResetRequestResponse>> {
  return authRequest<PasswordResetRequestResponse, PasswordResetRequestRequest>(
    "/auth/password-reset/request",
    body
  );
}

export function completePasswordReset(
  body: PasswordResetCompleteRequest
): Promise<AuthResult<PasswordResetCompleteResponse>> {
  return authRequest<PasswordResetCompleteResponse, PasswordResetCompleteRequest>(
    "/auth/password-reset/complete",
    body
  );
}

/**
 * Attempt a silent token refresh.
 * Returns true on success, false if the session is fully expired.
 */
export async function refreshSession(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(
      endpoint("/auth/refresh"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        credentials: "include",
      }
    );

    if (!res.ok) {
      clearTokens();
      return false;
    }

    const tokens: SessionTokens = await res.json();
    saveTokens(tokens);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

/**
 * Build an Authorization header, refreshing the session if needed.
 * Returns null when the session is fully expired.
 */
export async function getAuthHeader(): Promise<Record<string, string> | null> {
  let token = getAccessToken();
  if (!token) {
    const ok = await refreshSession();
    if (!ok) return null;
    token = getAccessToken();
  }
  return token ? { Authorization: `Bearer ${token}` } : null;
}

export async function logout(): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const authHeader = await getAuthHeader();
    if (!authHeader) {
      clearTokens();
      return { ok: true };
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
    });

    if (!res.ok) {
      let message = "Unable to sign out right now.";
      try {
        const data = (await res.json()) as { message?: string };
        if (typeof data.message === "string") message = data.message;
      } catch {
        // Keep fallback message.
      }
      return { ok: false, message };
    }

    clearTokens();
    return { ok: true };
  } catch {
    return { ok: false, message: "Network error. Please try again." };
  }
}
