import https from 'node:https';

// 1x1 transparent RGBA PNG buffer (67 bytes)
const TRANSPARENT_1X1_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

const MAX_CACHE_ENTRIES = 2000;
const tileCache = new Map();

/**
 * Mars Tile Proxy Middleware
 * Proxies /esri-mars/... to https://astro.arcgis.com/...
 * Prevents CORS blocks and gracefully handles missing/500/404/400 tiles
 * by returning a 1x1 transparent PNG with 200 OK.
 * 
 * Hardened against socket disconnects, client abortions, and double writeHead calls.
 */
export function marsTileProxyPlugin() {
  const install = (server) => {
    server.middlewares.use((req, res, next) => {
      const rawUrl = req.url || '';
      if (!rawUrl.startsWith('/esri-mars') && !req.originalUrl?.startsWith('/esri-mars')) {
        return next();
      }

      // Handle CORS preflight
      if (req.method === 'OPTIONS') {
        if (!res.headersSent && !res.writableEnded) {
          res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Max-Age': '86400',
          });
          res.end();
        }
        return;
      }

      const cleanPath = rawUrl.split('?')[0].replace(/^\/esri-mars/, '');
      const cacheKey = cleanPath;

      // Check LRU cache
      if (tileCache.has(cacheKey)) {
        if (!res.headersSent && !res.writableEnded) {
          const entry = tileCache.get(cacheKey);
          res.writeHead(200, {
            'Content-Type': entry.contentType,
            'Content-Length': entry.buffer.length,
            'Cache-Control': 'public, max-age=2592000, immutable',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          });
          if (req.method === 'HEAD') {
            res.end();
          } else {
            res.end(entry.buffer);
          }
        }
        return;
      }

      let completed = false;

      const sendResponse = (statusCode, headers, body) => {
        if (completed || res.headersSent || res.writableEnded) return;
        completed = true;
        try {
          res.writeHead(statusCode, headers);
          if (req.method === 'HEAD') {
            res.end();
          } else {
            res.end(body);
          }
        } catch {
          /* ignore socket write errors if client disconnected */
        }
      };

      const sendFallback = () => {
        sendResponse(200, {
          'Content-Type': 'image/png',
          'Content-Length': TRANSPARENT_1X1_PNG.length,
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        }, TRANSPARENT_1X1_PNG);
      };

      const upstreamUrl = `https://astro.arcgis.com${cleanPath}`;

      const proxyReq = https.request(
        upstreamUrl,
        {
          method: req.method || 'GET',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept:
              'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          },
          timeout: 6000,
        },
        (upstreamRes) => {
          if (upstreamRes.statusCode === 200) {
            const chunks = [];
            const contentType =
              upstreamRes.headers['content-type'] || 'image/png';

            upstreamRes.on('data', (chunk) => {
              if (!completed) chunks.push(chunk);
            });

            upstreamRes.on('end', () => {
              if (completed || res.headersSent || res.writableEnded) return;
              const buffer = Buffer.concat(chunks);
              if (tileCache.size >= MAX_CACHE_ENTRIES) {
                const oldest = tileCache.keys().next().value;
                tileCache.delete(oldest);
              }
              tileCache.set(cacheKey, { buffer, contentType });

              sendResponse(200, {
                'Content-Type': contentType,
                'Content-Length': buffer.length,
                'Cache-Control': 'public, max-age=2592000, immutable',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
              }, buffer);
            });

            upstreamRes.on('error', () => {
              sendFallback();
            });
          } else {
            // Missing/error tile on ArcGIS Server (400, 404, 500, etc.):
            // Return transparent fallback with 200 OK so Cesium receives a valid image without CORS or network error.
            // Notice: Do NOT cache transient 500/404 fallbacks in LRU cache so subsequent requests can re-fetch valid tiles.
            sendFallback();
          }
        }
      );

      // Handle client abortion (e.g. user panned away before tile loaded)
      req.on('close', () => {
        if (!completed) {
          completed = true;
          try {
            proxyReq.destroy();
          } catch {
            /* ignore */
          }
        }
      });

      proxyReq.on('error', () => {
        sendFallback();
      });

      proxyReq.on('timeout', () => {
        try {
          proxyReq.destroy();
        } catch {
          /* ignore */
        }
        sendFallback();
      });

      if (req.method !== 'HEAD' && req.method !== 'GET') {
        req.pipe(proxyReq);
      } else {
        proxyReq.end();
      }
    });
  };

  return {
    name: 'mars-tile-proxy',
    enforce: 'pre',
    configureServer: install,
    configurePreviewServer: install,
  };
}
