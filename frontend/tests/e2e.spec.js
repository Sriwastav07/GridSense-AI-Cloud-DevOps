import { test, expect } from '@playwright/test';

test('GridSense AI E2E Dashboard UI Flow Verification', async ({ page }) => {
  // Go to Login page
  await page.goto('http://localhost:5000/login');
  await expect(page).toHaveTitle(/GridSense AI/);
  await expect(page.locator('h1')).toContainText('GridSense AI');

  // Trigger Demo Login Bypass
  await page.click('button:has-text("Demo Operator")');
  await page.click('button:has-text("Sign In")');

  // Verify redirects to Main Dashboard Page
  await page.waitForTimeout(4000);
  await expect(page.locator('aside')).toBeVisible();
  
  // Substations is text, not a h3 heading! Let's assert based on text
  await expect(page.locator('text=Substations')).toBeVisible();

  // Capture screenshot of the frontend layout
  await page.screenshot({ path: 'gridsense_dashboard_verification.png', fullPage: true });
});
