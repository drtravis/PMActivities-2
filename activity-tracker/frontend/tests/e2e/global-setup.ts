/* global fetch */
import type { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Seed minimal data for E2E: Organization, Admin, Project, PM and Member assigned
export default async function globalSetup(_: FullConfig) {
  // Skip E2E setup if using main database to prevent pollution
  if (process.env.SKIP_E2E_SETUP === 'true') {
    console.log('Skipping E2E setup - using existing database');
    return;
  }

  const apiBase = process.env.E2E_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const TS = Date.now();
  const organizationName = `E2E Org ${TS}`;
  const providedAdminEmail = process.env.E2E_ADMIN_EMAIL;
  const adminEmail = providedAdminEmail || `admin+e2e.${TS}@test.com`;
  const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'Password123!';
  const adminName = 'E2E Admin';

  const pmEmail = `pm+e2e.${TS}@test.com`;
  const pmName = 'E2E PM';
  const memberEmail = `member+e2e.${TS}@test.com`;
  const memberName = 'E2E Member';

  // 1) Create organization + admin (unique per run)
  // helper with backoff for rate-limited endpoints
  const postWithRetry = async (url: string, body: any, headers: any = {}, attempts = 5) => {
    let delay = 500;
    for (let i = 0; i < attempts; i++) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
      });
      if (res.status !== 429) return res;
      await new Promise(r => setTimeout(r, delay));
      delay = Math.min(delay * 2, 4000);
    }
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
  };

  try {
    const res = await postWithRetry(`${apiBase}/auth/create-organization`, {
      organizationName,
      adminEmail,
      adminName,
      adminPassword,
    });
    if (!res.ok) {
      console.log('create-organization response', res.status);
    }
  } catch (e) {
    console.warn('Failed to create organization (continuing):', e);
  }

  // 2) Login as admin
  let token = '';
  try {
    const res = await postWithRetry(`${apiBase}/auth/login`, { email: adminEmail, password: adminPassword });
    if (res.ok) {
      const data = await res.json();
      token = data.access_token;
    } else {
      console.warn('Admin login failed with status', res.status);
    }
  } catch (e) {
    console.warn('Failed to login admin:', e);
  }
  if (!token) return; // Cannot continue without admin token

  // 3) Create a unique project
  const projectName = `E2E Project ${TS}`;
  let projectId = '';
  try {
    const createRes = await postWithRetry(`${apiBase}/projects`, { name: projectName, description: 'E2E seeded project' }, { Authorization: `Bearer ${token}` });
    if (createRes.ok) {
      const proj = await createRes.json();
      projectId = proj.id;
    }
  } catch (e) {
    console.warn('Project seed failed:', e);
  }

  // 4) Invite a PM and a Member, assign to project
  const defaultPassword = 'Password123!';
  if (projectId) {
    for (const user of [
      { email: pmEmail, name: pmName, role: 'project_manager' },
      { email: memberEmail, name: memberName, role: 'member' },
    ]) {
      try {
        const res = await postWithRetry(`${apiBase}/auth/invite`, {
          email: user.email,
          name: user.name,
          role: user.role,
          projectIds: [projectId],
        }, { Authorization: `Bearer ${token}` });
        if (!res.ok) {
          console.log('invite response', user.role, res.status);
        }
      } catch (e) {
        console.warn('Invite failed (may already exist):', e);
      }
    }
  }

  // 5) Persist state for tests
  const state = {
    organizationName,
    admin: { email: adminEmail, password: adminPassword },
    project: { id: projectId, name: projectName },
    pm: { email: pmEmail, password: defaultPassword, name: pmName },
    member: { email: memberEmail, password: defaultPassword, name: memberName },
    apiBase,
  };
  const outPath = path.resolve(__dirname, 'state.json');
  fs.writeFileSync(outPath, JSON.stringify(state, null, 2), 'utf-8');
}

