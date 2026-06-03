import { test, expect } from "@playwright/test";

test.describe("Public password-reset pages (en)", () => {
  test("password-reset without token shows missing-token guidance", async ({ page }) => {
    await page.goto("/en/password-reset");
    await expect(page.getByRole("heading", { level: 1, name: /choose a new password/i })).toBeVisible();
    await expect(page.getByRole("alert")).toContainText(/invalid or incomplete/i);
    await expect(page.getByRole("link", { name: /back to sign in/i })).toBeVisible();

    const loginNav = page.getByRole("navigation").getByRole("link", { name: "Log in" });
    await expect(loginNav).toHaveClass(/bg-black/);
  });

  test("password-reset with token shows password fields", async ({ page }) => {
    await page.goto("/en/password-reset?token=" + "a".repeat(32));
    await expect(page.getByLabel(/^new password$/i)).toBeVisible();
    await expect(page.getByLabel(/confirm new password/i)).toBeVisible();
  });

  test("password-reset setup flow shows activation copy", async ({ page }) => {
    await page.goto("/en/password-reset?token=" + "a".repeat(32) + "&flow=setup");
    await expect(page.getByRole("heading", { level: 1, name: /set your password/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /activate my account/i })).toBeVisible();
  });
});
