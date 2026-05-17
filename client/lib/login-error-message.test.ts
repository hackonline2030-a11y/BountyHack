import {
  isLoginTotpRequired,
  loginErrorMessageFromNest,
} from "@/lib/login-error-message";

const t = (key: string) => key;

describe("loginErrorMessageFromNest", () => {
  it("maps invalid credentials to localized key", () => {
    expect(
      loginErrorMessageFromNest({ message: "Invalid credentials" }, t),
    ).toBe("loginForm.errors.invalidCredentials");
  });

  it("maps validation password errors", () => {
    expect(
      loginErrorMessageFromNest(
        { message: ["password should not be empty"] },
        t,
      ),
    ).toBe("loginForm.errors.passwordRequired");
  });

  it("detects TOTP required", () => {
    expect(
      isLoginTotpRequired({ message: "TOTP code required" }),
    ).toBe(true);
  });
});
