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

test("employee cannot submit when weightage is invalid", async ({ page }) => {
  await page.goto("/employee");
  await expect(page.getByRole("heading", { name: "Goal Workspace" })).toBeVisible();

  const weightageInputs = page.locator('input[type="number"]');
  await weightageInputs.nth(2).fill("5");

  await expect(page.getByText("Total weightage must equal 100%.").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit for approval" })).toBeDisabled();
});

test("admin unlock requires non-empty reason", async ({ page }) => {
  await page.goto("/manager");
  await page.getByRole("button", { name: "Approve and lock" }).first().click();
  await expect(page.getByText("Locked").first()).toBeVisible();

  await page.goto("/admin");
  await page.getByRole("button", { name: "Unlock" }).first().click();

  const unlockButton = page.getByRole("button", { name: "Unlock with audit log" });
  await expect(unlockButton).toBeDisabled();
});

test("dispatch endpoint rejects unauthenticated requests", async ({ request }) => {
  const response = await request.post("/api/integrations/dispatch-escalations", {
    data: { quarter: "Q1", origin: "http://localhost:3200" },
    headers: { "content-type": "application/json" }
  });

  expect([401, 406]).toContain(response.status());
  const body = (await response.json()) as { ok: boolean; error: { code: string } };
  expect(body.ok).toBeFalsy();
  expect(["unauthorized", "bad_request"]).toContain(body.error.code);
});
