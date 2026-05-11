import { describe, expect, it } from "@jest/globals";
import {
  isAuthHeaderLoginHighlightPath,
  isAuthLoginPath,
  isForgotPasswordPath,
  isPasswordResetPath,
  localePrefixFromPathname,
} from "./locale-path";

describe("localePrefixFromPathname", () => {
  it("returns matched prefix or /en", () => {
    expect(localePrefixFromPathname("/fr/login")).toBe("/fr");
    expect(localePrefixFromPathname("/en")).toBe("/en");
    expect(localePrefixFromPathname("/unknown/foo")).toBe("/en");
  });
});

describe("isAuthLoginPath", () => {
  it("matches only login", () => {
    expect(isAuthLoginPath("/en/login")).toBe(true);
    expect(isAuthLoginPath("/fr/login")).toBe(true);
    expect(isAuthLoginPath("/en/forgot-password")).toBe(false);
    expect(isAuthLoginPath("/en/login/extra")).toBe(false);
  });
});

describe("isAuthHeaderLoginHighlightPath", () => {
  it("matches login and password-reset flows", () => {
    expect(isAuthHeaderLoginHighlightPath("/en/login")).toBe(true);
    expect(isAuthHeaderLoginHighlightPath("/fr/forgot-password")).toBe(true);
    expect(isAuthHeaderLoginHighlightPath("/en/password-reset")).toBe(true);
    expect(isAuthHeaderLoginHighlightPath("/en/parameters")).toBe(false);
    expect(isAuthHeaderLoginHighlightPath("/en")).toBe(false);
  });
});

describe("isForgotPasswordPath", () => {
  it("matches forgot-password only", () => {
    expect(isForgotPasswordPath("/en/forgot-password")).toBe(true);
    expect(isForgotPasswordPath("/fr/forgot-password")).toBe(true);
    expect(isForgotPasswordPath("/en/login")).toBe(false);
  });
});

describe("isPasswordResetPath", () => {
  it("matches password-reset only", () => {
    expect(isPasswordResetPath("/en/password-reset")).toBe(true);
    expect(isPasswordResetPath("/fr/password-reset")).toBe(true);
    expect(isPasswordResetPath("/en/forgot-password")).toBe(false);
  });
});
