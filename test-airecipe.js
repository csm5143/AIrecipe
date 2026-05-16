const { chromium } = require('playwright');

(async () => {
  const errors = [];

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[ERROR] ${msg.text()}`);
  });

  // Test home page
  console.log('Testing home page: http://localhost:5175/');
  await page.goto('http://localhost:5175/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const title = await page.title();
  console.log(`  Title: ${title}`);

  const heroTitle = await page.locator('.hero-title').count();
  console.log(`  Hero title elements: ${heroTitle}`);

  const header = await page.locator('.site-header').count();
  console.log(`  Header: ${header}`);

  const features = await page.locator('.feature-card').count();
  console.log(`  Feature cards: ${features}`);

  const toggle = await page.locator('.theme-toggle').count();
  console.log(`  Theme toggle: ${toggle}`);

  if (toggle > 0) {
    await page.locator('.theme-toggle').click();
    await page.waitForTimeout(500);
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    console.log(`  After toggle, theme: ${theme}`);
    await page.locator('.theme-toggle').click();
  }

  // Screenshot home
  await page.screenshot({ path: 'C:/Users/Admin/Desktop/AIrecipe/preview-home.png', fullPage: true });
  console.log('\nScreenshot saved: preview-home.png');

  // Test download page
  console.log('\nTesting download page: http://localhost:5175/#/download');
  await page.goto('http://localhost:5175/#/download');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const dlTitle = await page.locator('.download-title').count();
  console.log(`  Download title elements: ${dlTitle}`);

  const faqItems = await page.locator('.faq-item').count();
  console.log(`  FAQ items: ${faqItems}`);

  await page.screenshot({ path: 'C:/Users/Admin/Desktop/AIrecipe/preview-download.png', fullPage: true });
  console.log('Screenshot saved: preview-download.png');

  await browser.close();

  if (errors.length > 0) {
    console.log(`\nConsole errors found (${errors.length}):`);
    errors.forEach(e => console.log(`  ${e}`));
  } else {
    console.log('\nNo console errors found.');
  }

  process.exit(0);
})();
