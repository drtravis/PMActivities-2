import { test, expect } from '@playwright/test';

// Basic smoke test: verify login page loads and allows typing.
// This does not depend on backend being up, just UI elements present.

test('login page renders and accepts input', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('heading', { name: /sign in to activity tracker/i })).toBeVisible();

  const email = page.getByPlaceholder('Email address');
  const password = page.getByPlaceholder('Password');

  await email.fill('pm@test.com');
  await password.fill('password');

  await expect(page.getByRole('button', { name: /sign in/i })).toBeEnabled();
});

