// Lokaler Prüflauf für Pixel + CAPI-Verdrahtung: Bundle aus dist über vite preview,
// Meta-Hosts geblockt (fbq bleibt Queue-Stub, kein Traffic an Meta), Functions gemockt.
import puppeteer from 'puppeteer-core';

const base = process.env.BASE ?? 'http://localhost:4173';
const funnel = process.env.FUNNEL ?? 'vertrieb';
const PREFIX = process.env.PREFIX ?? funnel; // CSS-Präfix der Screens, z. B. vertrieb-cta
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME ?? '/root/.cache/puppeteer/chrome/linux-147.0.7727.57/chrome-linux64/chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});
const settle = (ms) => new Promise((r) => setTimeout(r, ms));
const fnCalls = [];
const metaHits = [];
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 860 });
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    if (/facebook\.net|facebook\.com/.test(url)) {
      metaHits.push(url);
      return req.abort();
    }
    if (url.includes('/.netlify/functions/')) {
      const name = url.split('/.netlify/functions/')[1];
      let body = null;
      try {
        body = JSON.parse(req.postData() ?? 'null');
      } catch {
        body = req.postData();
      }
      fnCalls.push({ name, body });
      return req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, recordId: 'rec_test' }) });
    }
    return req.continue();
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // sendBeacon-Bodies sind Blobs und für die Interception unsichtbar: auf fetch umleiten.
  await page.evaluateOnNewDocument(() => {
    navigator.sendBeacon = (url, data) => {
      const body = data instanceof Blob ? data.text() : Promise.resolve(String(data));
      body.then((b) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: b, keepalive: true }));
      return true;
    };
  });
  let idle = 0;

  await page.goto(`${base}/${funnel}?utm_source=meta&utm_medium=paid&utm_campaign=Camp%20A&utm_term=Adset%20B&utm_content=120200&fbclid=IwAR1test`, { waitUntil: 'networkidle0', timeout: 60000 });
  await settle(1200);

  const optionTry = {};
  for (let i = 0; i < 40; i++) {
    const state = await page.evaluate((PREFIX) => {
      const scr = document.querySelector(`.${PREFIX}-screen`) ?? document.body;
      const cta = document.querySelector('button.${PREFIX}-cta');
      const options = [...document.querySelectorAll('button')].filter((b) => !new RegExp(`${PREFIX}-(cta|more)`).test(b.className) && b.closest('form, [class*="screen"]'));
      const input = document.querySelector('input[type="text"], input[type="email"], input[type="tel"], input:not([type])');
      const textarea = document.querySelector('textarea');
      const select = document.querySelector('select');
      const isDq = new RegExp(`${PREFIX}-dq`).test(scr.className) || /Leider|leider|nicht möglich/.test(document.body.innerText.slice(0, 400)) && !input;
      return {
        path: location.pathname,
        options: options.length,
        hasCta: Boolean(cta),
        input: input ? { type: input.type, name: input.name, id: input.id, placeholder: input.placeholder } : null,
        textarea: Boolean(textarea),
        select: select ? [...select.options].map((o) => o.value) : null,
        isDq,
        heading: (document.querySelector('h1, h2')?.textContent ?? '').slice(0, 70),
      };
    }, PREFIX);
    if (state.path.endsWith('/danke')) break;
    const key = state.heading;
    if (state.isDq) {
      optionTry[key] = (optionTry[key] ?? 0) + 1;
      await page.click('button.${PREFIX}-cta');
      await settle(400);
      continue;
    }
    if (state.input) {
      const t = state.input.type;
      const value = t === 'email' ? 'test.meta@example.com' : t === 'tel' ? '1712345678' : 'Max Muster';
      await page.click('input[type="text"], input[type="email"], input[type="tel"], input:not([type])', { clickCount: 3 });
      await page.type('input[type="text"], input[type="email"], input[type="tel"], input:not([type])', value);
      const cb = await page.$('input[type="checkbox"]');
      if (cb) await cb.click();
      await page.click('button.${PREFIX}-cta');
      await settle(900);
      continue;
    }
    if (state.textarea) {
      await page.type('textarea', 'Ich will in den Vertrieb, Testlauf.');
      await page.click('button.${PREFIX}-cta');
      await settle(500);
      continue;
    }
    if (state.select) {
      const v = state.select.find((x) => x) ?? '';
      await page.select('select', v);
      await page.click('button.${PREFIX}-cta');
      await settle(500);
      continue;
    }
    if (state.options > 0) {
      const idx = Math.min(optionTry[key] ?? 0, state.options - 1);
      const buttons = await page.$$('button');
      let clicked = false;
      let seen = 0;
      for (const b of buttons) {
        const cls = await (await b.getProperty('className')).jsonValue();
        if (new RegExp(`${PREFIX}-(cta|more)`).test(String(cls))) continue;
        const inScreen = await b.evaluate((el) => Boolean(el.closest('form, [class*="screen"]')));
        if (!inScreen) continue;
        if (seen++ === idx) {
          await b.click();
          clicked = true;
          break;
        }
      }
      if (!clicked) break;
      await settle(500);
      continue;
    }
    if (state.hasCta) {
      await page.click('button.${PREFIX}-cta');
      await settle(1200);
      continue;
    }
    // Loader-Screen ohne Bedienelemente: kurz warten, dann nochmal schauen.
    if (idle++ < 4) {
      await settle(2000);
      continue;
    }
    console.log('Hängt bei:', JSON.stringify(state));
    break;
  }
  await settle(800);

  const queue = await page.evaluate(() => (window.fbq && window.fbq.queue ? window.fbq.queue.map((c) => JSON.parse(JSON.stringify(c))) : null));
  const path = await page.evaluate(() => location.pathname);
  console.log('Endpfad:', path);
  console.log('Meta-Requests geblockt:', metaHits.length, metaHits[0] ?? '');
  console.log('\n=== fbq-Queue ===');
  for (const c of queue ?? []) console.log(JSON.stringify(c));
  console.log('\n=== Function-Calls ===');
  for (const c of fnCalls) {
    const b = c.body ?? {};
    const short = c.name === 'q'
      ? `q ${b.event_type} ${b.step_label ?? ''} meta.event_id=${b.metadata?.event_id ?? '-'} fbp=${b.metadata?.fbp ?? '-'} utm=${b.metadata?.utm_source ?? '-'}/${b.metadata?.utm_term ?? '-'}`
      : `${c.name} event_id=${b.event_id} tracking_consent=${b.tracking_consent} fbp=${b.fbp} fbc=${b.fbc} utm_term=${b.utm_term} session=${String(b.session_id).slice(0, 8)}`;
    console.log(short);
  }
  console.log('\nBrowser-Fehler:', errors.length ? errors.join(' | ') : 'keine');
} finally {
  await browser.close();
}
