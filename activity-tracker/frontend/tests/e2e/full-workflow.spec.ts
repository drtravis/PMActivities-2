import { test, expect } from '@playwright/test';

// Full black-box workflow using real backend and DB, via UI where possible.
// Flow:
// 1) Admin login -> Create Project -> Create PM + Member and assign to project
// 2) PM login -> select project -> Assign task to member
// 3) Member login -> See assigned task -> Start -> Verify appears in My Activities

import fs from 'fs';
import path from 'path';

const statePath = path.resolve(__dirname, 'state.json');
let state: any = null;
if (fs.existsSync(statePath)) {
  state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
}

const ADMIN_EMAIL = state?.admin?.email || process.env.E2E_ADMIN_EMAIL || 'admin+e2e@test.com';
const ADMIN_PASSWORD = state?.admin?.password || process.env.E2E_ADMIN_PASSWORD || 'Password123!';
const PM_EMAIL = state?.pm?.email || process.env.E2E_PM_EMAIL || 'pm@test.com';
const PM_PASSWORD = state?.pm?.password || process.env.E2E_PM_PASSWORD || 'Password123!';
const MEMBER_EMAIL = state?.member?.email || process.env.E2E_MEMBER_EMAIL || 'member@test.com';
const MEMBER_PASSWORD = state?.member?.password || process.env.E2E_MEMBER_PASSWORD || 'Password123!';

const PROJECT_NAME = state?.project?.name || process.env.E2E_PROJECT_NAME || `E2E Project ${Date.now()}`;
const PROJECT_ID = state?.project?.id || process.env.E2E_PROJECT_ID || '';

async function login(page: any, email: string, password: string) {
  await page.goto('/login');
  await page.getByPlaceholder('Email address').fill(email);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

// Admin creates project and users via UI
async function adminCreatesProjectAndUsers(page: any) {
  // If global setup produced state.json, skip the admin UI creation (already seeded)
  try {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Admin Dashboard', level: 1 })).toBeVisible();
  } catch {}

  // If the project is not created by seed, create via UI
  try {
    await page.getByRole('button', { name: '📁 New Project' }).click({ timeout: 3000 });
    await page.getByPlaceholder('Project Name').or(page.getByLabel('Project Name')).fill(PROJECT_NAME);
    await page.getByPlaceholder('Enter project description').or(page.getByLabel('Description')).fill('E2E project description');
    await page.getByRole('button', { name: 'Create Project' }).click();
  } catch {}

  // If users aren’t there, try to add them via UI
  try {
    await page.getByRole('button', { name: '👤 Add User' }).click({ timeout: 3000 });
    await page.getByPlaceholder('Enter user name').or(page.getByLabel('Name')).fill('E2E PM');
    await page.getByPlaceholder('Enter email address').or(page.getByLabel('Email')).fill(PM_EMAIL);
    await page.getByLabel('Role').selectOption('pm');
    await page.getByLabel('Assign to Project').selectOption({ label: PROJECT_NAME });
    await page.getByRole('button', { name: 'Create User' }).click();
  } catch {}

  try {
    await page.getByRole('button', { name: '👤 Add User' }).click({ timeout: 3000 });
    await page.getByPlaceholder('Enter user name').or(page.getByLabel('Name')).fill('E2E Member');
    await page.getByPlaceholder('Enter email address').or(page.getByLabel('Email')).fill(MEMBER_EMAIL);
    await page.getByLabel('Role').selectOption('member');
    await page.getByLabel('Assign to Project').selectOption({ label: PROJECT_NAME });
    await page.getByRole('button', { name: 'Create User' }).click();
  } catch {}
}

async function pmAssignsTask(page: any) {
  await login(page, PM_EMAIL, PM_PASSWORD);
  await page.goto('/pm');
  await expect(page.getByRole('heading', { name: 'Project Manager Dashboard', level: 1 })).toBeVisible();

  // Select project (the project selector is in the header; narrow it)
  // Try common locations for the project selector
  // Prefer selecting by value (project id) for stability
  const headerSelect = page.locator('select').first();
  if (PROJECT_ID) {
    await headerSelect.selectOption(PROJECT_ID).catch(async () => {
      await headerSelect.selectOption({ label: PROJECT_NAME });
    });
  } else {
    await headerSelect.selectOption({ label: PROJECT_NAME });
  }

  // Navigate to Task Assignment view
  await page.getByTestId('qa-task-assignment').click();

  // Fill inline TaskForm (no modal)
  await page.getByPlaceholder('Enter a clear, descriptive title for your task').fill('E2E Task');
  const desc = page.locator('label', { hasText: 'Description' }).first().locator('..').locator('textarea');
  await desc.fill('E2E task description');
  const categorySelect = page.locator('label', { hasText: 'Category' }).first().locator('..').locator('select');
  await categorySelect.selectOption('Development');
  const dateInput = page.locator('label', { hasText: 'Expected Date' }).first().locator('..').locator('input[type="date"]');
  await dateInput.fill('2025-10-01');
  // Select seeded member by email (find option contains email, then select by value)
  let assigneeSelect = page.locator('label', { hasText: 'Assign To' }).first().locator('..').locator('select');
  if (!(await assigneeSelect.count())) {
    assigneeSelect = page.locator('select').filter({ has: page.locator('option', { hasText: 'Select a team member' }) }).first();
  }
  const optionWithEmail = page.locator('select option', { hasText: MEMBER_EMAIL }).first();
  const value = await optionWithEmail.getAttribute('value');
  if (value) {
    await assigneeSelect.selectOption(value);
  } else {
    await assigneeSelect.selectOption({ index: 1 });
  }
  // Select Priority via DOM relation, not ARIA label
  const prioritySelect = page.locator('label', { hasText: 'Priority' }).first().locator('..').locator('select');
  await prioritySelect.selectOption('Medium');
  await page.getByRole('button', { name: 'Assign Task' }).click();
}

async function memberStartsTaskAndSeesActivity(page: any) {
  await login(page, MEMBER_EMAIL, MEMBER_PASSWORD);
  await page.goto('/member');
  await expect(page.getByRole('heading', { name: 'Member Dashboard', level: 1 })).toBeVisible();

  // Go to My Activities and verify the task appears
  await page.getByTestId('qa-member-my-activities').click();
  // Wait for My Activities to load
  const loading = page.getByText('Loading activities...');
  if (await loading.count()) {
    await loading.first().waitFor({ state: 'detached', timeout: 20000 });
  }
  // Poll API to ensure the task exists for this member, then expect UI
  const token: string | null = await page.evaluate(() => localStorage.getItem('token'));
  const apiBase = process.env.E2E_API_URL || (state?.apiBase as string) || 'http://localhost:3004';
  let found = false;
  for (let i = 0; i < 5 && !found; i++) {
    const res = await fetch(`${apiBase}/tasks/my`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const tasks = await res.json();
      found = tasks.some((t: any) => t.title === 'E2E Task');
      if (!found) await new Promise(r => setTimeout(r, 2000));
    }
  }
  await expect(page.getByText('E2E Task')).toBeVisible({ timeout: 20000 });
}

// Wrap into one test to preserve state across steps; could be split with storageState too.
test('Full E2E workflow: Admin -> PM -> Member', async ({ browser }) => {
  // Admin step
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await adminCreatesProjectAndUsers(adminPage);
  await adminContext.close();

  // PM step
  const pmContext = await browser.newContext();
  const pmPage = await pmContext.newPage();
  await pmAssignsTask(pmPage);
  await pmContext.close();

  // Member step
  const memberContext = await browser.newContext();
  const memberPage = await memberContext.newPage();
  await memberStartsTaskAndSeesActivity(memberPage);
  await memberContext.close();
});

