import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = '/home/localhost/.gemini/antigravity-cli/brain/83a97819-5e3a-4ebc-b11b-6783ffaa1842';

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('Error') || text.includes('mars') || text.includes('route')) {
      console.log(`[Browser Console ${msg.type()}]:`, text);
    }
  });

  page.on('pageerror', (err) => {
    console.error('[Browser PageError]:', err.message);
  });

  console.log('Navigating to http://localhost:4173/ ...');
  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for loading screen to hide
  await page.waitForFunction(() => {
    const el = document.getElementById('loading-screen');
    return el && el.classList.contains('hidden');
  }, { timeout: 25000 });

  console.log('Loading screen dismissed, ensuring route is computed and rendered...');
  await page.evaluate(async () => {
    if (window.__marsController) {
      window.__marsController.resetCamera();
      await window.__marsController.computeRoute();
      window.__marsController.viewer.scene.render();
    }
  });

  await new Promise((r) => setTimeout(r, 6000));

  // 1. Capture Mission Control Dashboard
  console.log('Capturing mars_pathfinder_neomorphic_dashboard.png...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'mars_pathfinder_neomorphic_dashboard.png'),
    fullPage: false,
  });

  // 2. Click Focus/Expand Canvas button
  console.log('Clicking Expand Canvas button...');
  const expandBtn = await page.$('.expand-btn');
  if (expandBtn) {
    await expandBtn.click();
    await new Promise((r) => setTimeout(r, 2000));
    console.log('Capturing mars_pathfinder_expanded_canvas.png...');
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'mars_pathfinder_expanded_canvas.png'),
      fullPage: false,
    });
    // Click again to exit expand mode
    await expandBtn.click();
    await new Promise((r) => setTimeout(r, 1000));
  }

  // 3. Navigate to Pharmaceutical & Medical Tab
  console.log('Switching to Pharmaceutical & Medical tab...');
  await page.evaluate(() => {
    window.__marsController?.store?.setActiveTab('pharma');
  });
  await new Promise((r) => setTimeout(r, 1500));
  console.log('Capturing mars_pathfinder_pharma_tab.png...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'mars_pathfinder_pharma_tab.png'),
    fullPage: false,
  });

  // 4. Navigate to Life-Support Tab
  console.log('Switching to Life-Support tab...');
  await page.evaluate(() => {
    window.__marsController?.store?.setActiveTab('life-support');
  });
  await new Promise((r) => setTimeout(r, 1500));
  console.log('Capturing mars_pathfinder_lifesupport_tab.png...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'mars_pathfinder_lifesupport_tab.png'),
    fullPage: false,
  });

  await browser.close();
  console.log('Screenshots captured successfully!');
}

run().catch((err) => {
  console.error('Puppeteer script failed:', err);
  process.exit(1);
});
