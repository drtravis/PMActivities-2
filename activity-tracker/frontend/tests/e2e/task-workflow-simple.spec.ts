import { test, expect } from '@playwright/test';

import fs from 'fs';
import path from 'path';

// Use seeded users from global-setup state.json when available
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

async function login(page: any, email: string, password: string) {
  await page.goto('/login');
  await page.getByPlaceholder('Email address').fill(email);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  // Wait for redirect away from login
  await page.waitForURL(url => !url.pathname.endsWith('/login'), { timeout: 10000 });
}

test('PM can assign task and member can start it', async ({ browser }) => {
  // Step 1: PM assigns a task
  const pmContext = await browser.newContext();
  const pmPage = await pmContext.newPage();
  
  try {
    await login(pmPage, PM_EMAIL, PM_PASSWORD);
    await pmPage.goto('/pm');
    
    // Wait for PM dashboard to load
    await expect(pmPage.getByRole('heading', { name: 'Project Manager Dashboard', level: 1 })).toBeVisible();
    
    // Navigate to Task Assignment (inline form)
    await pmPage.getByTestId('qa-task-assignment').click();

    // Fill inline TaskForm (no modal)
    await pmPage.getByPlaceholder('Enter a clear, descriptive title for your task').fill('Test Task from E2E');
    const desc = pmPage.locator('label', { hasText: 'Description' }).first().locator('..').locator('textarea');
    await desc.fill('This is a test task created by E2E test');
    const categorySelect = pmPage.locator('label', { hasText: 'Category' }).first().locator('..').locator('select');
    await categorySelect.selectOption('Development');
    const dateInput = pmPage.locator('label', { hasText: 'Expected Date' }).first().locator('..').locator('input[type="date"]');
    await dateInput.fill('2025-10-01');

    // Select member
    let assigneeSelect = pmPage.locator('label', { hasText: 'Assign To' }).first().locator('..').locator('select');
    if (!(await assigneeSelect.count())) {
      assigneeSelect = pmPage.locator('select').filter({ has: pmPage.locator('option', { hasText: 'Select a member' }) }).first();
    }
    await assigneeSelect.selectOption({ index: 1 });

    // Set priority
    const prioritySelect = pmPage.locator('label', { hasText: 'Priority' }).first().locator('..').locator('select');
    await prioritySelect.selectOption('Medium');

    // Submit the task
    await pmPage.getByRole('button', { name: 'Assign Task' }).click();
    
    // Wait for success message or task to appear in list
    await pmPage.waitForTimeout(2000);
    
  } finally {
    await pmContext.close();
  }
  
  // Step 2: Member sees and starts the task
  const memberContext = await browser.newContext();
  const memberPage = await memberContext.newPage();
  
  try {
    await login(memberPage, MEMBER_EMAIL, MEMBER_PASSWORD);
    await memberPage.goto('/member');
    
    // Wait for member dashboard to load
    await expect(memberPage.getByRole('heading', { name: 'Member Dashboard', level: 1 })).toBeVisible();
    
    // Go to My Activities
    await memberPage.getByTestId('qa-member-my-activities').click();

    // Verify task appears
    await expect(memberPage.getByText('Test Task from E2E')).toBeVisible({ timeout: 20000 });
    
  } finally {
    await memberContext.close();
  }
});

test('Member can create self-assigned activity', async ({ page }) => {
  await login(page, MEMBER_EMAIL, MEMBER_PASSWORD);
  await page.goto('/member');
  
  // Wait for member dashboard to load
  await expect(page.getByRole('heading', { name: 'Member Dashboard', level: 1 })).toBeVisible();
  
  // Go to Create Activity
  await page.getByTestId('qa-member-create-activity').click();

  // Fill out activity form (member mode TaskForm)
  await page.getByPlaceholder('Enter a clear, descriptive title for your task').fill('Self-Created Activity Test');
  await page.getByPlaceholder('Provide detailed information about the task, objectives, and requirements').fill('This is a self-created activity for testing');
  const categorySelectM = page.locator('label', { hasText: 'Category' }).first().locator('..').locator('select');
  await categorySelectM.selectOption('Development');
  const dateInputM = page.locator('label', { hasText: 'Expected Date' }).first().locator('..').locator('input[type="date"]');
  await dateInputM.fill('2025-10-02');

  // Submit the activity (Save Task in member mode)
  await page.getByRole('button', { name: 'Save Task' }).click();

  // Go to My Activities and verify
  await page.getByTestId('qa-member-my-activities').click();
  await expect(page.getByText('Self-Created Activity Test')).toBeVisible({ timeout: 20000 });
});
