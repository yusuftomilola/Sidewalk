# Auth Copy Tone Guide

This guide documents the preferred voice for authentication screens across web
and mobile. Follow it when adding or editing any auth-facing copy.

## Tone principles

**Clear over clever.** Auth screens are functional. Users are trying to get
somewhere — don't make them read twice.

**Trustworthy, not corporate.** Sidewalk is a civic product. Write like a
reliable public service, not a startup or a government form.

**Direct without being abrupt.** Short sentences are good. Terse or cold
sentences are not. "Enter your email." is fine. "Email." is not.

**Privacy-forward.** When data collection is mentioned, explain why briefly.
Never imply more data use than actually happens.

## Screen-by-screen guidance

### Signup

- Heading: action-oriented ("Join Sidewalk", "Create your account")
- Body: one sentence explaining what the account is for
- Labels: plain nouns ("Email address", "Password") — no asterisks or "required"
- Submit: verb phrase ("Create account") — not "Submit" or "Register"
- Consent notice: plain language, link to Terms and Privacy Policy
- Privacy note: one sentence, specific ("We use your email only for account
  verification and recovery.")

### Login

- Heading: "Sign in" — not "Login" (two words, verb form)
- No body copy needed unless the screen has context (e.g. session expired)
- Labels: "Email address", "Password"
- Submit: "Sign in"
- Forgot password link: "Forgot your password?" — not "Reset password"

### Email verification

- Eyebrow: "Almost there"
- Heading: "Verify your email"
- Body: tell the user what to do and where to look
- Resend: "Resend verification email" — not "Resend"
- Success: "Email verified. You can now sign in."

### Password reset — request

- Heading: "Reset your password"
- Body: mention the privacy-safe behaviour ("We won't confirm whether the
  address is registered.")
- Submit: "Send reset link"
- Post-submit: "Check your inbox" — include spam folder hint

### Password reset — complete

- Heading: "Choose a new password"
- Submit: "Set new password"
- Success: "Password updated. You can now sign in."
- Expired link: "This link is no longer valid" — explain why and offer a new one

### Session expired

- Heading: "Your session has expired"
- Body: one sentence, no blame ("Sessions expire automatically for your security.")
- CTA: "Sign in again"

### Sign out

- Confirmation (if shown): "You've been signed out."
- No heading needed for a simple redirect

## Error messages

- Be specific about what went wrong without revealing security-sensitive detail.
- "Invalid email or password." — not "Wrong password."
- "Account temporarily locked. Please try again later." — not "Too many attempts."
- "This link is no longer valid." — not "Token expired."
- Always offer a next step when one exists.

## What to avoid

- Exclamation marks in functional copy ("Welcome!" is fine on a landing page,
  not on a form label)
- Passive voice for errors ("An error occurred" → "Something went wrong")
- Jargon: "token", "session", "credentials" — use plain equivalents where possible
- Redundant words: "Please enter your email address" → "Email address"

## Source of truth

All web auth copy lives in `apps/web/lib/authCopy.ts`. Mobile copy lives in
`apps/mobile/src/lib/authMessaging.ts`. Keep both files in sync when updating
shared flows (signup, login, reset, verify).
