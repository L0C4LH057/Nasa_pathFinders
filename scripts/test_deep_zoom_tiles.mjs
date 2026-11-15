import puppeteer from 'puppeteer';

async function testZoom() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const networkRequests = [];
  page.on('request', req => {
    if (req.url().includes('tile') || req.url().includes('esri')) {
      networkRequests.push({ url: req.url(), method: req.method() });
    }
  });

  page.on('response', res => {
    if (res.url().includes('tile') || res.url().includes('esri')) {
      if (res.status() !== 200) {
        console.log(`[HTTP ${res.status()}] ${res.url()}`);
      }
    }
  });

  page.on('console', msg => {
    console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
  });

  console.log('Navigating to http://localhost:4173 ...');
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));

  // Zoom in multiple levels
  const altitudes = [20000, 10000, 5000, 2000, 1000, 500, 100];
  for (const alt of altitudes) {
    console.log(`Zooming camera to altitude ${alt}m...`);
    await page.evaluate((targetAlt) => {
      const viewer = window.__marsController?.viewer;
      if (!viewer) return;
      const carto = viewer.camera.positionCartographic;
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromRadians(
          carto.longitude,
          carto.latitude,
          targetAlt,
          viewer.scene.globe.ellipsoid
        ),
        duration: 0.5
      });
    }, alt);

    await new Promise(r => setTimeout(r, 2000));
    const ssPath = `/home/localhost/.gemini/antigravity-cli/brain/83a97819-5e3a-4ebc-b11b-6783ffaa1842/zoom_test_${alt}m.png`;
    await page.screenshot({ path: ssPath });
    console.log(`Captured screenshot at alt ${alt}m: ${ssPath}`);
  }

  await browser.close();
  console.log('Zoom test complete.');
}

testZoom().catch(console.error);
