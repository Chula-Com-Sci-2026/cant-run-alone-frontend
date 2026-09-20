import { chromium } from 'playwright'

const baseURL = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173'
const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  geolocation: { latitude: 13.7317, longitude: 100.5415 },
  permissions: ['geolocation'],
})
const page = await context.newPage()
const views = [
  ['login', '/login'], ['register', '/register'], ['home', '/'],
  ['discover', '/discover'], ['runner', '/discover/runner-1'],
  ['nearby', '/nearby'], ['runs', '/runs'], ['create-run', '/runs/new'],
  ['run-detail', '/runs/run-1'], ['profile', '/profile'],
  ['design-system', '/design-system'],
]

async function shot(name) {
  await page.waitForTimeout(1200)
  await page.screenshot({ path: new URL(`${name}.png`, import.meta.url).pathname, fullPage: true })
  console.log(`Captured ${name}`)
}

for (const [name, path] of views) {
  await page.goto(`${baseURL}${path}`)
  await shot(name)
  if (name === 'register') {
    await page.getByRole('button', { name: 'Send verification code' }).click()
    await shot('register-phone-verification')
    await page.getByRole('button', { name: 'Verify phone' }).click()
    await shot('register-profile')
  }
  if (name === 'runs') {
    await page.getByRole('button', { name: /map/i }).first().click()
    await shot('runs-map')
  }
  if (name === 'create-run') {
    await page.getByRole('button', { name: 'Check weather & continue' }).click()
    await shot('create-run-conditions')
  }
}

await browser.close()
