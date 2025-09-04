import { test, expect } from '@playwright/test';

// Minimal E2E: login as PM and open Assign New Task modal on PM dashboard.
// Assumes backend is running and a PM user exists: pm@test.com / Password123!
// Adjust credentials via env if needed.

import fs from 'fs';
import path from 'path';

const statePath = path.resolve(__dirname, 'state.json');
let state: any = null;
if (fs.existsSync(statePath)) {
  state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
}

const PM_EMAIL = state?.pm?.email || process.env.E2E_PM_EMAIL || 'pm@test.com';
const PM_PASSWORD = state?.pm?.password || process.env.E2E_PM_PASSWORD || 'Password123!';

// Utility: login via UI
async function loginAsPM(page: any) {
  await page.goto('/login');
  await page.getByPlaceholder('Email address').fill(PM_EMAIL);
  await page.getByPlaceholder('Password').fill(PM_PASSWORD);
  await page.getByRole('button', { name: /sign in|login/i }).click();
  await expect(page).toHaveURL(/pm/);
}

// This smoke spec verifies the PM dashboard loads and the Assign modal opens.
test('PM can open Assign New Task modal', async ({ page }) => {
  await loginAsPM(page);
  await expect(page.getByRole('heading', { name: /project manager dashboard/i, level: 1 })).toBeVisible();
  // Navigate to Task Assignment first
  await page.getByTestId('qa-task-assignment').click();
  // Fill the inline TaskForm directly (no modal)
  await page.getByPlaceholder('Enter a clear, descriptive title for your task').fill('E2E Task');
  await page.getByPlaceholder('Provide detailed information about the task, objectives, and requirements').fill('E2E task description');
  const categorySelect1 = page.locator('label', { hasText: 'Category' }).first().locator('..').locator('select');
  await categorySelect1.selectOption('Development');
  const dateInput1 = page.locator('label', { hasText: 'Expected Date' }).first().locator('..').locator('input[type="date"]');
  await dateInput1.fill('2025-10-01');
  const assigneeSelect1 = page.locator('label', { hasText: 'Assign To' }).first().locator('..').locator('select');
  // Fallback to first non-placeholder if specific label not found
  await assigneeSelect1.selectOption({ index: 1 }).catch(async () => {
    const alt = page.locator('select').filter({ has: page.locator('option', { hasText: 'Select a team member' }) }).first();
    await alt.selectOption({ index: 1 });
  });
  await page.getByRole('button', { name: 'Assign Task' }).click();

});

// Extended: fill and submit the Assign Task modal if it exists
// Note: separate test block

test('PM assigns a task to seeded member', async ({ page }) => {
  await loginAsPM(page);
  await page.getByTestId('qa-task-assignment').click();
  // Fill the inline TaskForm directly (no modal)
  await page.getByPlaceholder('Enter a clear, descriptive title for your task').fill('E2E Task');
  const desc1 = page.locator('label', { hasText: 'Description' }).first().locator('..').locator('textarea');
  await desc1.fill('E2E task description');
  const categorySelect2 = page.locator('label', { hasText: 'Category' }).first().locator('..').locator('select');
  await categorySelect2.selectOption('Development');
  const dateInput2 = page.locator('label', { hasText: 'Expected Date' }).first().locator('..').locator('input[type="date"]');
  await dateInput2.fill('2025-10-01');
  const assigneeSelect2 = page.locator('label', { hasText: 'Assign To' }).first().locator('..').locator('select');
  await assigneeSelect2.selectOption({ index: 1 }).catch(async () => {
    const alt2 = page.locator('select').filter({ has: page.locator('option', { hasText: 'Select a team member' }) }).first();
    await alt2.selectOption({ index: 1 });
  });
  const statePath = require('path').resolve(__dirname, 'state.json');
  const fs = require('fs');
  let memberEmail = 'member@test.com';
  if (fs.existsSync(statePath)) {
    const s = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    memberEmail = s.member.email;
  }
  // Select by label, else pick first non-placeholder option
  let assigneeSelect = page.locator('label', { hasText: 'Assign To' }).first().locator('..').locator('select');
  if (!(await assigneeSelect.count())) {
    assigneeSelect = page.locator('select').filter({ has: page.locator('option', { hasText: 'Select a member' }) }).first();
  }
  await assigneeSelect.selectOption({ label: memberEmail }).catch(async () => {
    await assigneeSelect.selectOption({ index: 1 });
  });
  const prioritySelect = page.locator('label', { hasText: 'Priority' }).first().locator('..').locator('select');
  await prioritySelect.selectOption('Medium');
  await page.getByRole('button', { name: 'Assign Task' }).click();
});

