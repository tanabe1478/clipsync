import { test, expect } from "@playwright/test";
import { injectTauriMocks } from "./tauri-mock";

test.describe("Auth Screen", () => {
  test.beforeEach(async ({ page }) => {
    await injectTauriMocks(page);
  });

  test("shows sign-in screen when not authenticated", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("ClipSync")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /sign in with google/i }),
    ).toBeVisible();
  });

  test("sign-in button is clickable", async ({ page }) => {
    await page.goto("/");
    const button = page.getByRole("button", { name: /sign in with google/i });
    await expect(button).toBeEnabled();
  });
});
