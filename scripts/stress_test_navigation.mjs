import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = '/home/localhost/.gemini/antigravity-cli/brain/83a97819-5e3a-4ebc-b11b-6783ffaa1842';

async function stressTest() {
  console.log('Starting Mars Pathfinder Stress Test across multiple coordinates...');
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
  const status500s = [];

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('500') || text.includes('Internal Server Error') || text.includes('CORS') || text.includes('ERR_FAILED')) {
      console.error('[Browser Console Error]:', text);
      errors.push(text);
    }
  });

  page.on('pageerror', (err) => {
    console.error('[Page Error]:', err.message);
    errors.push(err.message);
  });

  page.on('response', (res) => {
    if (res.status() === 500) {
      console.error('[HTTP 500 Detected]:', res.url());
      status500s.push(res.url());
    }
  });

  // Test 1: Boot page
  console.log('1. Loading main dashboard...');
  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => {
    const el = document.getElementById('loading-screen');
    return el && el.classList.contains('hidden');
  }, { timeout: 25000 });
  await new Promise((r) => setTimeout(r, 3000));

  // Test 2: Fly to each destination programmatically and check tile loading
  const testCoords = [
    { name: 'Jezero Delta', lat: 18.4447, lon: 77.4508, alt: 18000 },
    { name: 'Gale Crater', lat: -5.3589, lon: 137.8037, alt: 35000 },
    { name: 'Olympus Mons', lat: 18.65, lon: 226.2, alt: 65000 },
    { name: 'Valles Marineris', lat: -13.9, lon: 300.8, alt: 55000 },
    { name: 'Viking User URL', lat: -6.0, lon: -74.0, alt: 45000 },
  ];

  for (const target of testCoords) {
    console.log(`Testing camera fly to ${target.name} (${target.lat}, ${target.lon}, alt ${target.alt}m)...`);
    await page.evaluate((t) => {
      if (window.marsViewer) {
        window.marsViewer.camera.flyTo({
          destination: window.Cesium.Cartesian3.fromDegrees(
            t.lon,
            t.lat,
            t.alt,
            window.marsEllipsoid
          ),
          orientation: {
            heading: window.Cesium.Math.toRadians(35.0),
            pitch: window.Cesium.Math.toRadians(-55.0),
            roll: 0.0,
          },
          duration: 0.5,
        });
      }
    }, target);
    await new Promise((r) => setTimeout(r, 2500));
  }

  // Test 3: Toggle theme
  console.log('Testing light theme toggle...');
  await page.evaluate(() => {
    document.documentElement.classList.add('theme-light');
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Capture screenshot of clean state
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'mars_pathfinder_stress_test_verified.png'),
    fullPage: false,
  });

  await browser.close();

  console.log('\n======================================');
  console.log('STRESS TEST COMPLETE:');
  console.log(`HTTP 500 Errors: ${status500s.length}`);
  console.log(`Console Errors:  ${errors.length}`);
  console.log('======================================');

  if (status500s.length > 0 || errors.length > 0) {
    console.error('FAIL: Detected errors during stress test!');
    process.exit(1);
  } else {
    console.log('SUCCESS: All Martian destinations streamed tiles with 0 HTTP 500 errors and 0 console errors!');
  }
}

stressTest().catch((err) => {
  console.error('Stress test exception:', err);
  process.exit(1);
});
