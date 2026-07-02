const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 4321;
const DIST_DIR = path.join(__dirname, 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// 1. A simple, self-contained HTTP static server with SPA fallback
function startServer(port, dir) {
  const server = http.createServer((req, res) => {
    const cleanUrl = req.url.split('?')[0];
    let filePath = path.join(dir, cleanUrl);
    
    // Check if the path points to a directory, load index.html if so
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    
    // Fallback to index.html at root (standard SPA fallback behavior)
    if (!fs.existsSync(filePath)) {
      filePath = path.join(dir, 'index.html');
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Internal Server Error: ${err.code}`);
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`Prerendering helper server started at http://localhost:${port}`);
      resolve(server);
    });
  });
}

// 2. Pre-rendering execution flow
async function run() {
  if (process.env.VERCEL) {
    console.log('Vercel environment detected. Skipping prerendering build step.');
    process.exit(0);
  }

  if (!fs.existsSync(DIST_DIR)) {
    console.error('Error: "dist" folder not found. Make sure to run "vite build" first!');
    process.exit(1);
  }

  // Start temporary local HTTP server
  const server = await startServer(PORT, DIST_DIR);

  console.log('Launching headless browser...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Visit home page to fetch dynamic catalog structure from Firebase
    console.log('Navigating to homepage to retrieve catalog data...');
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });

    // Wait for posters list to be loaded into client state
    console.log('Waiting for product data hydration...');
    await page.waitForFunction(() => typeof window.posters !== 'undefined' && window.posters.length > 0, { timeout: 15000 });

    // Extract dynamic posters catalog
    const posters = await page.evaluate(() => window.posters);
    console.log(`Found ${posters.length} posters in database.`);

    const categories = Array.from(new Set(posters.map(p => p.category).filter(Boolean)));
    console.log(`Found categories: ${categories.join(', ')}`);

    // Define all static and dynamic paths to crawl/prerender
    const paths = [
      '/',
      '/shop',
      '/wishlist',
      '/checkout',
      '/login',
      '/account',
      '/faq'
    ];

    posters.forEach(p => {
      paths.push(`/product/${p.id}`);
    });

    categories.forEach(c => {
      paths.push(`/category/${encodeURIComponent(c)}`);
    });

    // Crawl each path and dump HTML payload
    for (const p of paths) {
      console.log(`Crawl and Render: ${p}`);
      const targetUrl = `http://localhost:${PORT}${p}`;
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

      // Selector load safeguards
      if (p === '/') {
        await page.waitForSelector('main', { timeout: 5000 });
      } else if (p.startsWith('/product/')) {
        await page.waitForSelector('h3', { timeout: 5000 });
      } else if (p === '/shop' || p.startsWith('/category/')) {
        await page.waitForSelector('h2', { timeout: 5000 });
      }

      // Read finalized page DOM
      const html = await page.content();

      // Write output files structure
      let outputDir = DIST_DIR;
      let outputFilename = 'index.html';
      
      if (p !== '/') {
        // Decode path component to handle url-encoded categories (e.g. %20 space character)
        const decodedPath = decodeURIComponent(p);
        outputDir = path.join(DIST_DIR, decodedPath);
      }
      
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(path.join(outputDir, outputFilename), html, 'utf-8');
    }

    // 3. Generate sitemap.xml dynamically with indexable paths
    console.log('Generating dynamic sitemap.xml...');
    const sitemapUrls = paths.map(p => {
      let priority = '0.5';
      let changefreq = 'weekly';
      
      if (p === '/') {
        priority = '1.0';
        changefreq = 'daily';
      } else if (p === '/shop') {
        priority = '0.9';
        changefreq = 'daily';
      } else if (p.startsWith('/product/')) {
        priority = '0.8';
        changefreq = 'weekly';
      } else if (p.startsWith('/category/')) {
        priority = '0.7';
        changefreq = 'weekly';
      }
      
      // Keep sitemap links clean (no trailing slash, matching standard route formats)
      const loc = `https://thesinglestore.xyz${p === '/' ? '' : p}`;
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    });

    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.join('\n')}
</urlset>
`;

    // Save sitemap both in build output and repo source
    fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapContent, 'utf-8');
    fs.writeFileSync(path.join(__dirname, 'public', 'sitemap.xml'), sitemapContent, 'utf-8');
    console.log('Sitemap successfully written to dist/sitemap.xml and public/sitemap.xml');

  } catch (error) {
    console.error('Prerendering failed with error:', error);
  } finally {
    await browser.close();
    server.close();
    console.log('Helper server shut down. Prerendering lifecycle complete.');
  }
}

run();
