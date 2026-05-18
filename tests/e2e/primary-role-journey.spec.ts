import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("alignhq-force-local-demo", "true");
  });
  await page.goto("/login");
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem("alignhq-force-local-demo", "true");
  });
});

test("employee submits goals, manager approves, admin can govern the locked sheet", async ({ page }) => {
  await expect(page.getByRole("link", { name: /Asha Menon/ })).toBeVisible();
  await page.goto("/employee");
  await expect(page.getByRole("heading", { name: "Goal Workspace" })).toBeVisible();
  await expect(page.getByText("Local demo mode")).toBeVisible();

  const weightageInputs = page.locator('input[type="number"]');
  await weightageInputs.nth(2).fill("30");
  await expect(page.getByText("100%").first()).toBeVisible();
  await page.getByRole("button", { name: "Submit for approval" }).click();
  await expect(page.getByText("Submitted").first()).toBeVisible();

  await page.goto("/manager");
  await expect(page.getByRole("heading", { name: "Approval Desk" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Asha Menon" })).toBeVisible();
  await page.getByRole("button", { name: "Approve and lock" }).first().click();
  await expect(page.getByText("Locked").first()).toBeVisible();

  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Governance Center" })).toBeVisible();
  await expect(page.getByText("Completion dashboard")).toBeVisible();
  await expect(page.getByRole("button", { name: "Unlock" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Escalations" }).click();
  await expect(page.getByRole("heading", { name: "Escalation queue" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Dispatch" })).toBeVisible();

  await page.getByRole("button", { name: "Integrations" }).click();
  await expect(page.getByRole("heading", { name: "Microsoft identity and collaboration" })).toBeVisible();

  await page.getByRole("button", { name: "Analytics" }).click();
  await expect(page.getByRole("heading", { name: "QoQ achievement trend" })).toBeVisible();
});
