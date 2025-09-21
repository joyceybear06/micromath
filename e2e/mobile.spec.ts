import { test, expect, devices } from '@playwright/test'
test.use(devices['iPhone 13'])
const URL = process.env.E2E_URL || 'http://127.0.0.1:5173/'

test('idle shows timer; iOS shows minus helper', async ({ page }) => {
  await page.goto(URL)

  // Idle timer visible on landing
  const timer = page.getByText(/^⏱/)
  await expect(timer).toBeVisible()

  // Start the game (adjust text if your button says something else)
  await page.getByRole('button', { name: /start/i }).click()

  // Focus first answer input
  const inputs = page.locator('input.answer-input, .answer-input input')
  await expect(inputs.first()).toBeVisible()
  await inputs.first().click()

  // iOS-only ± helper exists
  const pm = page.getByRole('button', { name: /±/i })
  await expect(pm).toBeVisible()
})
