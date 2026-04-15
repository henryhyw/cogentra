import { expect, test } from "@playwright/test";

test("login and view seeded dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill("owner@northstar.ac");
  await page.getByPlaceholder("Password").fill("ChangeMe123!");
  await page.getByRole("button", { name: /continue to workspace/i }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByText("Assessment cases")).toBeVisible();
});

test("create a new case and land on case detail", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill("owner@northstar.ac");
  await page.getByPlaceholder("Password").fill("ChangeMe123!");
  await page.getByRole("button", { name: /continue to workspace/i }).click();
  await page.goto("/app/cases/new");
  await page.getByPlaceholder("Case title").fill("Playwright Case");
  await page.getByPlaceholder("Course or program").fill("Automation Lab");
  await page.getByRole("button", { name: /continue to artifacts/i }).click();
  await page.setInputFiles('input[type="file"]', [
    {
      name: "assignment.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Students must explain the reasoning behind their submitted work.")
    },
    {
      name: "rubric.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Reasoning\nEvidence\nTradeoffs")
    },
    {
      name: "student_submission.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("I designed the approach because evidence and tradeoffs both mattered.")
    }
  ]);
  await page.getByRole("button", { name: /create case and generate plans/i }).click();
  await expect(page).toHaveURL(/\/app\/cases\//);
});

test("open seeded plan and reviewer workspace", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill("owner@northstar.ac");
  await page.getByPlaceholder("Password").fill("ChangeMe123!");
  await page.getByRole("button", { name: /continue to workspace/i }).click();
  await page.getByRole("link", { name: /urban mobility policy essay/i }).click();
  await page.getByRole("link", { name: /open plan/i }).first().click();
  await expect(page).toHaveURL(/\/plan$/);
});
