import path from "node:path";

import { expect, test } from "@playwright/test";

test("reviewer can create an assignment and import a student bundle", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /try demo workspace/i }).click();
  await page.waitForURL(/\/assignments/);

  await page.getByRole("button", { name: /new assignment/i }).click();
  await page.getByPlaceholder("Sustainability impact report").fill("Playwright Assignment");
  await page.getByRole("button", { name: /^create assignment$/i }).click();
  await page.waitForURL(/\/assignments\//);

  const inputs = page.locator('input[type="file"]');
  await inputs.nth(0).setInputFiles(path.join(process.cwd(), "../../demo-data/e2e/brief.md"));
  await inputs.nth(1).setInputFiles([
    path.join(process.cwd(), "../../demo-data/e2e/S9901_policy_memo.md"),
    path.join(process.cwd(), "../../demo-data/e2e/S9901_support_note.md"),
  ]);

  await page.getByRole("button", { name: /create student cases/i }).click();
  await expect(page.getByText(/policy memo/i)).toBeVisible();
});
