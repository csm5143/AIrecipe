import { chromium } from 'playwright';

const errors = [];

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
});
const page = await browser.newPage();

page.on('console', msg => {
  if (msg.type() === 'error') errors.push(`[ERROR] ${msg.text()}`);
});

// === HOME PAGE ===
console.log('=== HOME PAGE ===');
await page.goto('http://localhost:5175/');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);

console.log(`Title: ${await page.title()}`);
console.log(`Hero: ${await page.locator('.hero').count()}`);
console.log(`Header: ${await page.locator('.site-header').count()}`);
console.log(`Theme toggle: ${await page.locator('.theme-toggle').count()}`);

await page.evaluate(() => window.scrollTo(0, 600));
await page.waitForTimeout(800);
console.log(`Feature cards: ${await page.locator('.feature-card').count()}`);

// Test dark mode
await page.locator('.theme-toggle').click();
await page.waitForTimeout(400);
const darkTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
console.log(`Dark mode toggle: ${darkTheme === 'dark'}`);
await page.locator('.theme-toggle').click();

await page.evaluate(() => window.scrollTo(0, 1400));
await page.waitForTimeout(800);
console.log(`Stats counters: ${await page.locator('.stat-count').count()}`);
const glassCount = await page.locator('[class*="glass"]').count();
console.log(`Glass elements: ${glassCount}`);

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(600);
console.log(`CTA section: ${await page.locator('.cta-section').count()}`);

await page.screenshot({ path: 'C:/Users/Admin/Desktop/AIrecipe/preview-home.png', fullPage: true });
console.log('Screenshot: preview-home.png');

// === DOWNLOAD PAGE (correct URL) ===
console.log('\n=== DOWNLOAD PAGE ===');
await page.goto('http://localhost:5175/download');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(3000);

const dlUrl = page.url();
console.log(`URL: ${dlUrl}`);
const bodyText = await page.locator('body').innerText();
console.log(`Body has "选择你的": ${bodyText.includes('选择你的')}`);
console.log(`Body has "微信小程序": ${bodyText.includes('微信小程序')}`);
console.log(`Body text length: ${bodyText.length}`);

// Scroll
await page.evaluate(() => window.scrollTo(0, 300));
await page.waitForTimeout(1000);

console.log(`Download title: ${await page.locator('.download-title').count()}`);
console.log(`Download hero: ${await page.locator('.download-hero').count()}`);
console.log(`Main cards: ${await page.locator('.main-card').count()}`);

await page.evaluate(() => window.scrollTo(0, 1400));
await page.waitForTimeout(1000);
console.log(`Comparison table: ${await page.locator('.comp-table').count()}`);

await page.evaluate(() => window.scrollTo(0, 2400));
await page.waitForTimeout(1000);
console.log(`FAQ items: ${await page.locator('.faq-item').count()}`);

const dlGlassCount = await page.locator('[class*="glass"]').count();
console.log(`Glass elements: ${dlGlassCount}`);

await page.screenshot({ path: 'C:/Users/Admin/Desktop/AIrecipe/preview-download.png', fullPage: true });
console.log('Screenshot: preview-download.png');

await browser.close();

if (errors.length > 0) {
  console.log(`\n${errors.length} console errors:`);
  errors.forEach(e => console.log(`  ${e}`));
} else {
  console.log('\nAll tests passed — no console errors!');
}

process.exit(0);
