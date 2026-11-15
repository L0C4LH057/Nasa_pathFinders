import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = '/home/localhost/.gemini/antigravity-cli/brain/83a97819-5e3a-4ebc-b11b-6783ffaa1842';

async function verify() {
  console.log('--- MARS PATHFINDER FEATURE VERIFICATION ---');
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

  page.on('response', (res) => {
    if (res.status() >= 400) {
      console.log(`[HTTP ${res.status()}]:`, res.url());
    }
  });

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('Error') || text.includes('mars') || text.includes('route') || text.includes('Navigation') || text.includes('Destination')) {
      console.log(`[Browser ${msg.type()}]:`, text);
    }
  });

  page.on('pageerror', (err) => {
    console.error('[Browser PageError]:', err.message);
  });

  console.log('Navigating to http://localhost:4173/ ...');
  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // 1. Wait for loading screen to disappear
  await page.waitForFunction(() => {
    const el = document.getElementById('loading-screen');
    return el && el.classList.contains('hidden');
  }, { timeout: 25000 });
  console.log('✓ Application loaded successfully');

  // Let initial scene settle and route compute
  await page.evaluate(async () => {
    if (window.__marsController) {
      window.__marsController.resetCamera();
      await window.__marsController.computeRoute();
      window.__marsController.viewer?.scene?.render();
    }
  });
  await new Promise((r) => setTimeout(r, 4000));

  // --- STEP 1: TEST LIVE DRIVING NAVIGATION SIMULATION ---
  console.log('\n[Step 1] Testing Live Driving Navigation Simulation...');
  await page.evaluate(async () => {
    const ctrl = window.__marsController;
    if (ctrl) {
      // Ensure route exists
      await ctrl.computeRoute();
      // Start Google Maps navigation
      ctrl.startTraverseNavigation();
      ctrl.viewer?.scene?.render();
    }
  });

  // Let navigation run for 3 seconds so rover moves along the traverse
  await new Promise((r) => setTimeout(r, 3500));

  console.log('Capturing mars_pathfinder_live_driving_navigation.png...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'mars_pathfinder_live_driving_navigation.png'),
    fullPage: false,
  });

  // Pause navigation
  await page.evaluate(() => {
    window.__marsController?.store?.pauseNavigation();
  });

  // --- STEP 2: TEST MULTI-DESTINATION EXPLORATION (GALE CRATER) ---
  console.log('\n[Step 2] Testing Destination Switch to Gale Crater (Mount Sharp)...');
  await page.evaluate(async () => {
    const ctrl = window.__marsController;
    if (ctrl) {
      ctrl.store.setDestination('gale');
      await ctrl.computeRoute();
      ctrl.viewer?.scene?.render();
    }
  });
  await new Promise((r) => setTimeout(r, 4000));

  console.log('Capturing mars_pathfinder_gale_crater.png...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'mars_pathfinder_gale_crater.png'),
    fullPage: false,
  });

  // --- STEP 3: TEST DESTINATION SWITCH TO OLYMPUS MONS ---
  console.log('\n[Step 3] Testing Destination Switch to Olympus Mons...');
  await page.evaluate(async () => {
    const ctrl = window.__marsController;
    if (ctrl) {
      ctrl.store.setDestination('olympus-mons');
      await ctrl.computeRoute();
      ctrl.viewer?.scene?.render();
    }
  });
  await new Promise((r) => setTimeout(r, 4000));

  console.log('Capturing mars_pathfinder_olympus_mons.png...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'mars_pathfinder_olympus_mons.png'),
    fullPage: false,
  });

  // --- STEP 4: RETURN TO JEZERO & TEST CLEANROOM LABORATORY LIGHT THEME ---
  console.log('\n[Step 4] Returning to Jezero & Testing White/Light Theme...');
  await page.evaluate(async () => {
    const ctrl = window.__marsController;
    if (ctrl) {
      ctrl.store.setDestination('jezero');
      await ctrl.computeRoute();
      // Switch theme to light
      if (ctrl.store.currentTheme !== 'light') {
        ctrl.store.toggleTheme();
      }
      ctrl.viewer?.scene?.render();
    }
  });
  await new Promise((r) => setTimeout(r, 4000));

  console.log('Capturing mars_pathfinder_light_theme_mission_control.png...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'mars_pathfinder_light_theme_mission_control.png'),
    fullPage: false,
  });

  // Test Light Theme on Pharmaceutical tab
  console.log('Capturing mars_pathfinder_light_theme_pharma.png...');
  await page.evaluate(() => {
    window.__marsController?.store?.setActiveTab('pharma');
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'mars_pathfinder_light_theme_pharma.png'),
    fullPage: false,
  });

  // Reset back to Mission Control tab
  await page.evaluate(() => {
    window.__marsController?.store?.setActiveTab('mission-control');
  });

  // --- STEP 5: TEST HIGH-RESOLUTION CLOSE ZOOM CLARITY ---
  console.log('\n[Step 5] Testing Ultra-Clear Zoom with LOD 17 CTX Tiles...');
  await page.evaluate(async () => {
    const ctrl = window.__marsController;
    if (ctrl && ctrl.viewer) {
      const viewer = ctrl.viewer;
      // Close-in oblique camera over Jezero delta deposits (~4,500m altitude)
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(77.445, 18.420, 5200, window.__marsController.MARS_ELLIPSOID || viewer.scene.globe.ellipsoid),
        orientation: {
          heading: Cesium.Math.toRadians(35),
          pitch: Cesium.Math.toRadians(-35),
          roll: 0,
        },
        duration: 0.1,
      });
      viewer.scene.render();
    }
  });
  // Allow high-res tiles to stream and settle
  await new Promise((r) => setTimeout(r, 5000));

  console.log('Capturing mars_pathfinder_high_res_zoom.png...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'mars_pathfinder_high_res_zoom.png'),
    fullPage: false,
  });

  await browser.close();
  console.log('\n✓ ALL VERIFICATION SCREENSHOTS CAPTURED SUCCESSFULLY!');
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
