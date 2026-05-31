import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../server.js";
import { INTERNAL_CLAIMS_HEADER, type InternalAuthClaims } from "@sidewalk/types";

function claimsHeader(claims: InternalAuthClaims): Record<string, string> {
  return { [INTERNAL_CLAIMS_HEADER]: JSON.stringify(claims) };
}

describe("GET /health", () => {
  it("returns 200 without auth", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.service).toBe("stellar-service");
  });
});

describe("POST /wallet-intent — requireTrustedCaller (#414, #413)", () => {
  it("rejects with 401 when claims header is missing", async () => {
    const res = await request(app).post("/wallet-intent");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("MISSING_INTERNAL_CLAIMS");
  });

  it("rejects with 401 when claims header is malformed JSON", async () => {
    const res = await request(app)
      .post("/wallet-intent")
      .set(INTERNAL_CLAIMS_HEADER, "not-json");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_INTERNAL_CLAIMS");
  });

  it("rejects with 401 when claims are missing required fields", async () => {
    const res = await request(app)
      .post("/wallet-intent")
      .set(INTERNAL_CLAIMS_HEADER, JSON.stringify({ sub: "usr_1" }));
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_INTERNAL_CLAIMS");
  });

  it("rejects with 403 when account is not verified (#413)", async () => {
    const res = await request(app)
      .post("/wallet-intent")
      .set(claimsHeader({ sub: "usr_1", verified: false }));
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("ACCOUNT_UNVERIFIED");
  });

  it("accepts verified account and returns 202", async () => {
    const res = await request(app)
      .post("/wallet-intent")
      .set(claimsHeader({ sub: "usr_verified_001", verified: true }));
    expect(res.status).toBe(202);
    expect(res.body).toEqual({ accountId: "usr_verified_001", status: "pending" });
  });
});
