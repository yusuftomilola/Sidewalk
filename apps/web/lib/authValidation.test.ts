import { describe, it, expect } from "vitest";
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
  firstError,
} from "../lib/authValidation";

describe("validateEmail", () => {
  it("returns null for a valid email", () => {
    expect(validateEmail("user@example.com")).toBeNull();
  });
  it("errors on empty input", () => {
    expect(validateEmail("")).not.toBeNull();
  });
  it("errors on missing domain", () => {
    expect(validateEmail("user@")).not.toBeNull();
  });
});

describe("validatePassword", () => {
  it("returns null for a valid password", () => {
    expect(validatePassword("securepass")).toBeNull();
  });
  it("errors on empty input", () => {
    expect(validatePassword("")).not.toBeNull();
  });
  it("errors when shorter than 8 characters", () => {
    expect(validatePassword("short")).not.toBeNull();
  });
});

describe("validatePasswordConfirm", () => {
  it("returns null when passwords match", () => {
    expect(validatePasswordConfirm("pass1234", "pass1234")).toBeNull();
  });
  it("errors when passwords do not match", () => {
    expect(validatePasswordConfirm("pass1234", "different")).not.toBeNull();
  });
  it("errors on empty confirm", () => {
    expect(validatePasswordConfirm("pass1234", "")).not.toBeNull();
  });
});

describe("firstError", () => {
  it("returns null when all pass", () => {
    expect(firstError(null, null)).toBeNull();
  });
  it("returns the first non-null error", () => {
    expect(firstError(null, "bad email", "bad password")).toBe("bad email");
  });
});
