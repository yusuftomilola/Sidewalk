/**
 * Reusable auth form validation primitives.
 * All validators return null on success or a human-readable error string.
 */

export function validateEmail(value: string): string | null {
  if (!value.trim()) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address.";
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return "Password is required.";
  if (value.length < 8) return "Password must be at least 8 characters.";
  return null;
}

export function validatePasswordConfirm(password: string, confirm: string): string | null {
  if (!confirm) return "Please confirm your password.";
  if (password !== confirm) return "Passwords do not match.";
  return null;
}

/** Run multiple validators and return the first error, or null if all pass. */
export function firstError(...results: (string | null)[]): string | null {
  return results.find((r) => r !== null) ?? null;
}
