/**
 * Account model — MVP fields only.
 *
 * Future expansion: add `stellarPublicKey` once Stellar layer is introduced.
 * Role expansion (agency, admin) is deferred to the Identity milestone.
 */
export type Account = {
  /** Stable surrogate key. */
  id: string;
  email: string;
  /** bcrypt hash — never serialised to clients. */
  passwordHash: string;
  /** Whether the email address has been confirmed. */
  verified: boolean;
  /** Account role. Defaults to `citizen` during the auth milestone. */
  role: "citizen" | "agency" | "admin";
  createdAt: Date;
  updatedAt: Date;
};

/** Safe projection returned to callers — no credential fields. */
export type AccountPublic = Omit<Account, "passwordHash">;

export function toPublic(account: Account): AccountPublic {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _pw, ...pub } = account;
  return pub;
}
