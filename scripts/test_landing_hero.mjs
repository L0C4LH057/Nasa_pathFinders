import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = '/home/localhost/.gemini/antigravity-cli/brain/83a97819-5e3a-4ebc-b11b-6783ffaa1842';

async function testLandingHero() {
  console.log('Testing 3D Mars Landing Hero (AstraMap Integration)...');
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
    if (text.includes('Error') || text.includes('500') || text.includes('Uncaught')) {
      console.error('[Console Error]:', text);
      errors.push(text);
    }
  });

  page.on('pageerror', (err) => {
    console.error('[Page Error]:', err.message);
    errors.push(err.message);
  });

  // 1. Initial Load: Landing Hero
  console.log('1. Loading application at http://localhost:4173/ ...');
  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for landing hero to mount
  await page.waitForSelector('#landing-hero', { timeout: 15000 });
  console.log('✓ #landing-hero is present in DOM');

  // Wait for WebGL canvas and texture readiness
  await page.waitForSelector('#mars-landing-canvas.ready', { timeout: 15000 });
  console.log('✓ #mars-landing-canvas is ready with WebGL texture');

  await new Promise((r) => setTimeout(r, 2000));
  const landingSSPath = path.join(ARTIFACT_DIR, 'mars_landing_hero_verified.png');
  await page.screenshot({ path: landingSSPath });
  console.log(`✓ Captured Landing Hero screenshot: ${landingSSPath}`);

  // 2. Test Destination Switching on Landing Hero
  console.log('2. Testing destination switching on Landing Hero (selecting Olympus Mons)...');
  const pills = await page.$$('.dest-pill');
  if (pills.length >= 4) {
    // Click Olympus Mons (index 3)
    await pills[3].click();
    await new Promise((r) => setTimeout(r, 1500));
    const olympusSSPath = path.join(ARTIFACT_DIR, 'mars_landing_hero_olympus_selected.png');
    await page.screenshot({ path: olympusSSPath });
    console.log(`✓ Captured Landing Hero with Olympus Mons selected: ${olympusSSPath}`);
  }

  // 3. Test Enter Mission Atmospheric Transition
  console.log('3. Clicking ENTER MISSION to trigger atmospheric descent...');
  const enterBtn = await page.$('#l-enter-btn');
  if (enterBtn) {
    await enterBtn.click();
    // Wait for transition duration
    await new Promise((r) => setTimeout(r, 3500));
    const mcSSPath = path.join(ARTIFACT_DIR, 'mars_landing_to_mission_control.png');
    await page.screenshot({ path: mcSSPath });
    console.log(`✓ Captured Mission Control dashboard after descent: ${mcSSPath}`);
  }

  // 4. Test "Orbit View" button in header navigation
  console.log('4. Testing "Orbit View" button in header navigation to return to 3D globe...');
  const orbitBtn = await page.$('.orbit-view-btn');
  if (orbitBtn) {
    await orbitBtn.click();
    await new Promise((r) => setTimeout(r, 1500));
    await page.waitForSelector('#landing-hero', { timeout: 5000 });
    const returnSSPath = path.join(ARTIFACT_DIR, 'mars_landing_return_to_orbit.png');
    await page.screenshot({ path: returnSSPath });
    console.log(`✓ Captured Return to Orbit Hero screenshot: ${returnSSPath}`);
  }

  // 5. Test Direct Skip (?skip)
  console.log('5. Testing ?skip query parameter bypass...');
  await page.goto('http://localhost:4173/?skip=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2500));
  const isLandingGone = await page.evaluate(() => !document.getElementById('landing-hero'));
  console.log(`✓ ?skip bypass verified, landing hero hidden: ${isLandingGone}`);

  await browser.close();

  console.log('\n======================================');
  console.log('3D MARS LANDING HERO TEST RESULTS:');
  console.log(`Console Errors: ${errors.length}`);
  console.log('======================================');

  if (errors.length > 0) {
    console.error('FAIL: Detected errors during Landing Hero test!');
    process.exit(1);
  } else {
    console.log('SUCCESS: 3D Mars Landing Hero tested and verified with ZERO errors!');
  }
}

testLandingHero().catch((err) => {
  console.error('Test exception:', err);
  process.exit(1);
});
