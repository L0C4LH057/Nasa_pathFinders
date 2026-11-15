import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';

const DIST_DIR = path.resolve('dist');
const PORT = 8089;

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

async function debugCesium() {
  await new Promise((resolve) => server.listen(PORT, resolve));
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

  const networkRequests = [];
  page.on('request', (req) => {
    if (req.url().includes('arcgis') || req.url().includes('mars') || req.url().includes('tile')) {
      networkRequests.push(req.url());
    }
  });

  page.on('response', (res) => {
    if (res.url().includes('arcgis') || res.url().includes('mars') || res.url().includes('tile')) {
      console.log('[Response]:', res.status(), res.url(), res.headers()['access-control-allow-origin']);
    }
  });

  page.on('requestfailed', (req) => {
    console.error('Request failed:', req.url(), req.failure()?.errorText);
  });

  page.on('console', (msg) => {
    console.log('[Browser Console]:', msg.type(), msg.text());
  });

  await page.goto('http://localhost:8089/#app', { waitUntil: 'domcontentloaded' });
  console.log('Waiting for tiles and globe render...');
  await page.waitForFunction(() => {
    const viewer = window.__godsEyeView?.viewer;
    return viewer && viewer.scene?.globe?.tilesLoaded;
  }, { timeout: 25000 }).catch(() => console.log('tilesLoaded timeout, continuing...'));

  await new Promise((r) => setTimeout(r, 4000));

  const screenshotPath = '/home/localhost/.gemini/antigravity-cli/brain/83a97819-5e3a-4ebc-b11b-6783ffaa1842/debug_globe_render.png';
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log('Saved debug screenshot to:', screenshotPath);

  const debugInfo = await page.evaluate(() => {
    const viewer = window.__godsEyeView?.viewer;
    if (!viewer) return { error: 'No viewer' };

    const camera = viewer.camera;
    const carto = viewer.scene.globe.ellipsoid.cartesianToCartographic(camera.position);

    const layers = [];
    for (let i = 0; i < viewer.imageryLayers.length; i++) {
      const l = viewer.imageryLayers.get(i);
      layers.push({
        show: l.show,
        alpha: l.alpha,
        ready: l.imageryProvider?.ready,
        url: l.imageryProvider?._url || l.imageryProvider?.url,
        tileWidth: l.imageryProvider?.tileWidth,
        tileHeight: l.imageryProvider?.tileHeight,
        tilingScheme: l.imageryProvider?.tilingScheme?.constructor?.name,
      });
    }

    return {
      globeShow: viewer.scene.globe.show,
      globeBaseColor: viewer.scene.globe.baseColor?.toCssColorString?.(),
      camera: {
        lon: carto ? (carto.longitude * 180) / Math.PI : null,
        lat: carto ? (carto.latitude * 180) / Math.PI : null,
        height: carto ? carto.height : null,
        pitch: (camera.pitch * 180) / Math.PI,
        heading: (camera.heading * 180) / Math.PI,
      },
      layers,
      tilesLoaded: viewer.scene.globe.tilesLoaded,
    };
  });

  console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
  console.log('ArcGIS/tile network requests count:', networkRequests.length);
  console.log('Sample tile URLs:', networkRequests.slice(0, 10));

  await browser.close();
  server.close();
}

debugCesium().catch(console.error);
