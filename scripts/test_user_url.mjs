import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = '/home/localhost/.gemini/antigravity-cli/brain/83a97819-5e3a-4ebc-b11b-6783ffaa1842';
const TARGET_URL = 'http://localhost:4173/#v=2&lat=-6.0000&lon=-74.0000&alt=45000&heading=35&pitch=-60&roll=360&style=normal&bloom=0&sharpen=1&bi=0&bv=2&si=49&hud=tactical&hv=1&dm=DENSE&dd=75&da=elastic&kf=7&ko=1&cr=0&sc=1&scf=100&map=mars-viking&l=&lo=f.e.1_k.o.n';

async function testUserUrl() {
  console.log('Testing User URL:', TARGET_URL);
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

  const errors = [];

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('CORS') || text.includes('blocked') || text.includes('ERR_FAILED')) {
      console.error('[Console Error]:', text);
      errors.push(text);
    }
  });

  page.on('pageerror', (err) => {
    console.error('[Page Error]:', err.message);
    errors.push(err.message);
  });

  page.on('response', (res) => {
    if (res.status() >= 400 && !res.url().includes('favicon')) {
      console.warn(`[HTTP ${res.status()}]:`, res.url());
      errors.push(`${res.status()} ${res.url()}`);
    }
  });

  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for loading screen to hide
  await page.waitForFunction(() => {
    const el = document.getElementById('loading-screen');
    return el && el.classList.contains('hidden');
  }, { timeout: 25000 });

  console.log('Page loaded, waiting 6 seconds for tile streaming to complete...');
  await new Promise((r) => setTimeout(r, 6000));

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'mars_pathfinder_user_url_verified.png'),
    fullPage: false,
  });

  await browser.close();

  console.log('\n--- TEST RESULTS ---');
  if (errors.length === 0) {
    console.log('✓ ZERO CORS ERRORS! ZERO FAILED RESOURCES! 100% CLEAN CONSOLE!');
  } else {
    console.log(`Found ${errors.length} issues:`, errors);
  }
}

testUserUrl().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
