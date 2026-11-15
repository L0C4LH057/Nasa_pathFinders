import http from 'node:http';

async function makeRequest(path, abortImmediately = false) {
  return new Promise((resolve) => {
    const req = http.get(
      `http://localhost:4173${path}`,
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve({ status: res.statusCode, length: Buffer.concat(chunks).length });
        });
      }
    );

    req.on('error', (err) => {
      resolve({ error: err.message });
    });

    if (abortImmediately) {
      setTimeout(() => {
        req.destroy();
      }, 5);
    }
  });
}

async function runTest() {
  console.log('Testing tile proxy with concurrent requests and abrupt client abortions...');

  const paths = [
    '/esri-mars/arcgis/rest/services/OnMars/CTX/MapServer/tile/1/0/2',
    '/esri-mars/arcgis/rest/services/OnMars/CTX/MapServer/tile/3/4/4',
    '/esri-mars/arcgis/rest/services/OnMars/CTX/MapServer/tile/2/1/1',
    '/esri-mars/arcgis/rest/services/OnMars/CTX/MapServer/tile/99/99/99',
    '/esri-mars/arcgis/rest/services/OnMars/MDIM/MapServer/tile/0/0/0',
    '/esri-mars/arcgis/rest/services/OnMars/CTX/MapServer/tile/5/10/20',
  ];

  // Batch 1: normal requests
  console.log('Batch 1: Standard requests...');
  const results1 = await Promise.all(paths.map((p) => makeRequest(p, false)));
  console.log('Batch 1 completed:', results1.map((r) => r.status || r.error));

  // Batch 2: 50 rapid aborted requests to stress-test socket close race conditions
  console.log('Batch 2: 50 rapid client abortions during flight...');
  const abortPromises = [];
  for (let i = 0; i < 50; i++) {
    const p = paths[i % paths.length];
    abortPromises.push(makeRequest(p, true));
  }
  await Promise.all(abortPromises);
  console.log('Batch 2 abortions completed.');

  // Batch 3: Post-abortion verification — check if server is still alive and responsive
  console.log('Batch 3: Checking server health after abortions...');
  const healthCheck = await makeRequest('/');
  console.log('Server health response status:', healthCheck.status);

  if (healthCheck.status === 200) {
    console.log('SUCCESS: Server handled all race conditions and remained perfectly healthy!');
  } else {
    console.error('FAIL: Server did not return 200 after stress test');
    process.exit(1);
  }
}

runTest().catch((e) => {
  console.error('Test error:', e);
  process.exit(1);
});
