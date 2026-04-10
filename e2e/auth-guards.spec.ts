import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = "admin@gympower.demo";
const MEMBER_EMAIL = "member.demo@gympower.demo";
const PASSWORD = "Demo1234!";

async function login(page: Parameters<typeof test>[0]["page"], email: string) {
  await page.goto("/login");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("button", { name: /login/i })).toBeVisible();
  await page.getByPlaceholder("demo@gympowercdmx.mx").fill(email);
  await page.getByPlaceholder("••••••••").fill(PASSWORD);
  await Promise.all([
    page.waitForURL(/\/(admin|member)\/dashboard$/),
    page.getByRole("button", { name: /login/i }).click(),
  ]);
}

test.describe("route guards", () => {
  test("redirects unauthenticated users from protected routes", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/member/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("redirects member away from admin routes", async ({ page }) => {
    await login(page, MEMBER_EMAIL);
    await expect(page).toHaveURL(/\/member\/dashboard$/);

    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/member\/dashboard$/);
  });

  test("redirects admin away from member routes", async ({ page }) => {
    await login(page, ADMIN_EMAIL);
    await expect(page).toHaveURL(/\/admin\/dashboard$/);

    await page.goto("/member/dashboard");
    await expect(page).toHaveURL(/\/admin\/dashboard$/);
  });
});
