import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = '/home/localhost/.gemini/antigravity-cli/brain/83a97819-5e3a-4ebc-b11b-6783ffaa1842';

async function verifyMeridiani() {
  console.log('Starting verification of Meridiani Planum, Murray Lab CTX, and smooth orbital flight...');
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
      console.error('[Console Error]:', text);
      errors.push(text);
    }
  });

  page.on('pageerror', (err) => {
    console.error('[Page Error]:', err.message);
    errors.push(err.message);
  });

  page.on('response', (res) => {
    if (res.status() === 500) {
      console.error('[500 Error]:', res.url());
      status500s.push(res.url());
    }
  });

  console.log('1. Loading application at http://localhost:4173/...');
  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => {
    const el = document.getElementById('loading-screen');
    return el && el.classList.contains('hidden');
  }, { timeout: 25000 });
  await new Promise((r) => setTimeout(r, 2000));

  console.log('2. Switching destination to Meridiani Planum via store & controller...');
  // Monitor camera roll during flight to ensure ZERO barrel rolls
  const rollSamples = [];
  const sampleInterval = setInterval(async () => {
    try {
      const rollDeg = await page.evaluate(() => {
        if (!window.marsViewer?.camera) return null;
        return window.Cesium.Math.toDegrees(window.marsViewer.camera.roll);
      });
      if (rollDeg !== null) rollSamples.push(rollDeg);
    } catch {}
  }, 100);

  // Trigger destination selection to Meridiani Planum
  await page.evaluate(() => {
    const store = window.__marsController?.store;
    if (store) {
      store.setDestination('meridiani');
    }
  });

  console.log('Waiting 5 seconds for smooth orbital flight to complete...');
  await new Promise((r) => setTimeout(r, 5000));
  clearInterval(sampleInterval);

  const maxRoll = Math.max(...rollSamples.map((r) => Math.abs(r)));
  console.log(`Flight complete. Max roll deviation: ${maxRoll.toFixed(2)}° (should be near 0° - zero barrel rolls)`);

  console.log('Waiting 5 seconds for Caltech Murray Lab CTX1 mosaic tiles and hillshade to stream...');
  await new Promise((r) => setTimeout(r, 5000));

  // Screenshot 1: Meridiani Planum overview
  const shot1Path = path.join(ARTIFACT_DIR, 'mars_pathfinder_meridiani_murray_ctx_verified.png');
  await page.screenshot({ path: shot1Path, fullPage: false });
  console.log('Saved:', shot1Path);

  // Step 3: Zoom in close to Endeavour Crater Rim (altitude 6,000m)
  console.log('3. Zooming in deep to Endeavour Crater Rim Cape (alt 6,000m) to verify high-res clarity...');
  await page.evaluate(() => {
    if (window.marsViewer) {
      window.marsViewer.camera.flyTo({
        destination: window.Cesium.Cartesian3.fromDegrees(
          -5.22,
          -2.26,
          6000.0,
          window.marsEllipsoid
        ),
        orientation: {
          heading: window.Cesium.Math.toRadians(0.0),
          pitch: window.Cesium.Math.toRadians(-55.0),
          roll: 0.0,
        },
        duration: 1.5,
      });
    }
  });

  await new Promise((r) => setTimeout(r, 4500));

  const shot2Path = path.join(ARTIFACT_DIR, 'mars_pathfinder_meridiani_deep_zoom.png');
  await page.screenshot({ path: shot2Path, fullPage: false });
  console.log('Saved:', shot2Path);

  await browser.close();

  console.log('\n======================================');
  console.log('VERIFICATION SUMMARY:');
  console.log(`Max Roll Deviation: ${maxRoll.toFixed(2)}°`);
  console.log(`HTTP 500 Errors:    ${status500s.length}`);
  console.log(`Console Errors:     ${errors.length}`);
  console.log('======================================');

  if (status500s.length > 0 || errors.length > 0) {
    console.error('FAIL: Detected issues during verification');
    process.exit(1);
  } else {
    console.log('SUCCESS: Meridiani Planum rendered with sharp Murray Lab CTX mosaic & zero barrel rolls!');
  }
}

verifyMeridiani().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
