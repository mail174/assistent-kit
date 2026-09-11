import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: process.env.CHROME ?? '/root/.cache/puppeteer/chrome/linux-147.0.7727.57/chrome-linux64/chrome', headless: true, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled'] });
try {
  const page = await browser.newPage(); await page.evaluateOnNewDocument(() => Object.defineProperty(navigator, 'webdriver', { get: () => false })); await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36');
  const fb = [];
  page.on('request', (r) => { if (/facebook\.com\/tr/.test(r.url())) { const q = new URL(r.url()).searchParams; fb.push('TR ' + q.get('ev') + ' eid=' + (q.get('eid') ?? '-')); } else if (/facebook/.test(r.url())) fb.push('REQ ' + r.url().slice(0, 70)); });
  page.on('requestfailed', (r) => { if (/facebook/.test(r.url())) fb.push('FAIL ' + r.url().slice(0, 60) + ' ' + r.failure()?.errorText); });
  page.on('response', (r) => { if (/facebook/.test(r.url())) fb.push('RES ' + r.status() + ' ' + r.url().slice(0, 60)); });
  page.on('pageerror', (e) => fb.push('PAGEERROR ' + e.message));
  const url = process.env.URL; if (!url) throw new Error('URL fehlt: URL=https://<host>/<funnel> node pixel-live-check.mjs');
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 6000));
  console.log(fb.join('\n') || 'keine facebook-Requests');
  console.log('fbq typ:', await page.evaluate(() => typeof window.fbq), '| queue:', await page.evaluate(() => JSON.stringify(window.fbq?.queue ?? null)?.slice(0, 300)));
  console.log('Script-Tags:', await page.evaluate(() => [...document.scripts].map((s) => s.src.slice(0, 70)).filter(Boolean).join(' | ')));
} finally { await browser.close(); }
