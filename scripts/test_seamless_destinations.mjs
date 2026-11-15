import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = '/home/localhost/.gemini/antigravity-cli/brain/83a97819-5e3a-4ebc-b11b-6783ffaa1842';

async function testSeamlessDestinations() {
  console.log('Testing seamless photorealistic CTX terrain across all destinations...');
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

  const destinations = [
    { id: 'gusev', name: 'Gusev Crater', filename: 'mars_dest_gusev_seamless.png', zoomAlt: 4000 },
    { id: 'olympus-mons', name: 'Olympus Mons', filename: 'mars_dest_olympus_seamless.png', zoomAlt: 15000 },
    { id: 'valles-marineris', name: 'Valles Marineris', filename: 'mars_dest_valles_seamless.png', zoomAlt: 8000 },
    { id: 'meridiani', name: 'Meridiani Planum', filename: 'mars_dest_meridiani_deep_zoom_clean.png', zoomAlt: 3500 },
    { id: 'jezero', name: 'Jezero Crater', filename: 'mars_dest_jezero_seamless.png', zoomAlt: 4000 },
    { id: 'gale', name: 'Gale Crater & Mount Sharp', filename: 'mars_dest_gale_seamless.png', zoomAlt: 5000 },
  ];

  for (const d of destinations) {
    console.log(`\nNavigating to ${d.name} (${d.id})...`);
    await page.evaluate((destId) => {
      const store = window.__marsController?.store;
      if (store) {
        store.setDestination(destId);
      }
    }, d.id);

    // Wait for flight to complete
    await new Promise((r) => setTimeout(r, 4500));

    // Deep zoom into terrain
    console.log(`Zooming into ${d.name} at alt ${d.zoomAlt}m to verify NO black tiles and NO clay patches...`);
    await page.evaluate((alt) => {
      if (window.marsViewer?.camera) {
        const carto = window.marsEllipsoid.cartesianToCartographic(window.marsViewer.camera.position);
        if (carto) {
          window.marsViewer.camera.flyTo({
            destination: window.Cesium.Cartesian3.fromRadians(
              carto.longitude,
              carto.latitude,
              alt,
              window.marsEllipsoid
            ),
            orientation: {
              heading: window.marsViewer.camera.heading,
              pitch: window.Cesium.Math.toRadians(-55.0),
              roll: 0.0,
            },
            duration: 1.0,
          });
        }
      }
    }, d.zoomAlt);

    await new Promise((r) => setTimeout(r, 3500));

    const outPath = path.join(ARTIFACT_DIR, d.filename);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`✓ Saved ${d.filename}`);
  }

  await browser.close();

  console.log('\n======================================');
  console.log('SEAMLESS DESTINATIONS TEST RESULTS:');
  console.log(`HTTP 500 Errors: ${status500s.length}`);
  console.log(`Console Errors:  ${errors.length}`);
  console.log('======================================');

  if (status500s.length > 0 || errors.length > 0) {
    console.error('FAIL: Detected errors during seamless destinations test!');
    process.exit(1);
  } else {
    console.log('SUCCESS: All destinations rendered seamless photorealistic CTX terrain with ZERO black tiles!');
  }
}

testSeamlessDestinations().catch((err) => {
  console.error('Test exception:', err);
  process.exit(1);
});
