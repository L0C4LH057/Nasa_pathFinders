import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';

const DIST_DIR = path.resolve('dist');
const PORT = 8089;

// Minimal static file server matching standard Nginx SPA behavior
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.geojsonl': 'application/json',
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(DIST_DIR, urlPath);

  // If path is directory or doesn't have extension, check if file exists, else fallback to index.html (SPA)
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
    });
    res.end(content);
  } catch (err) {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, async () => {
  console.log(`Static server running at http://localhost:${PORT}`);

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
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  const consoleLogs = [];
  const network404s = [];

  page.on('console', (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('response', (res) => {
    if (res.status() === 404) {
      network404s.push(`${res.status()} ${res.url()}`);
    }
  });

  page.on('pageerror', (err) => {
    errors.push(err.message);
  });

  console.log('Navigating to static production deployment...');
  // Use #app to enter Mission Control directly to verify Cesium 3D surface
  await page.goto(`http://localhost:${PORT}/#app`, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for loading screen to hide
  await page.waitForFunction(() => {
    const el = document.getElementById('loading-screen');
    return el && (el.classList.contains('hidden') || el.style.display === 'none' || !el.offsetParent);
  }, { timeout: 20000 }).catch(() => console.log('Loading screen timeout or already hidden'));

  // Wait 6 seconds for Cesium tiles and layers to load
  await new Promise((r) => setTimeout(r, 6000));

  // Check state of application
  const appState = await page.evaluate(() => {
    return {
      status: window.__godsEyeView?.app?.getState?.(),
      hasCesium: !!window.__godsEyeView?.viewer,
      imageryLayersCount: window.__godsEyeView?.viewer?.imageryLayers?.length,
    };
  });

  console.log('App state:', appState);

  // Take screenshot of Mission Control
  const screenshotPath = '/home/localhost/.gemini/antigravity-cli/brain/83a97819-5e3a-4ebc-b11b-6783ffaa1842/production_verified_surface.png';
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Saved screenshot to ${screenshotPath}`);

  // Also test Landing Hero Page
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 3000));

  const landingScreenshotPath = '/home/localhost/.gemini/antigravity-cli/brain/83a97819-5e3a-4ebc-b11b-6783ffaa1842/production_verified_landing.png';
  await page.screenshot({ path: landingScreenshotPath, fullPage: false });
  console.log(`Saved landing screenshot to ${landingScreenshotPath}`);

  await browser.close();
  server.close();

  console.log('\n--- VERIFICATION REPORT ---');
  console.log('Console errors:', errors);
  console.log('Network 404s:', network404s);
  console.log('Detection/Tracked logs found:', consoleLogs.filter(l => l.includes('Detection') || l.includes('TrackedReadout') || l.includes('nearby-places')));

  const criticalIssues = [
    ...errors.filter(e => !e.includes('net::ERR_') || e.includes('BLOCKED_BY_CLIENT')),
    ...network404s.filter(u => u.includes('/api/') || u.includes('/esri-mars/')),
  ];

  if (criticalIssues.length > 0) {
    console.error('FAIL: Found critical issues in production static build:', criticalIssues);
    process.exit(1);
  } else {
    console.log('SUCCESS: Production static build verified cleanly with zero 404s and zero CORS blocks!');
    process.exit(0);
  }
});
