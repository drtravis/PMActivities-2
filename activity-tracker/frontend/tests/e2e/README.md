# E2E Test Notes

- Set E2E_BASE_URL to your frontend URL (default 3000; dev is 3003)
- Set E2E_API_URL to your backend URL (default 3001; your dev is 3004)
- Playwright global-setup seeds a unique org, project, PM, and Member each run and writes tests/e2e/state.json
- If rate-limited (HTTP 429) during seeding, re-run the tests or wait briefly

Commands:
- E2E_BASE_URL=http://localhost:3003 E2E_API_URL=http://localhost:3004 npm run e2e
- npm run e2e:report

Artifacts on failure are in test-results/ with screenshots/videos/traces.

