#!/usr/bin/env node
/* Screenshot helper for the KnightWebstudio refresh.

   node shoot.js --base http://localhost:8765 --paths /,/consulting/ --out DIR
                 [--modes desktop-dark,desktop-light,mobile-dark,mobile-light,tablet-dark]
                 [--max 14]

   For every path and mode it scrolls the page one viewport at a time and
   saves what a visitor would see at each stop (real scroll positions, so
   scroll-triggered effects are in their true state):

     DIR/<page>__<mode>__01.png, __02.png, ...      (desktop/tablet: one file per stop)
     DIR/<page>__<mode>__sheet1.png, ...            (mobile: 4 stops side by side per sheet)

   It also writes DIR/report.json with, per page+mode: console errors, failed
   requests, horizontal overflow in px, page height and number of stops.
   Exit code is 0 even when problems are found: read report.json. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const base = arg('base', 'http://localhost:8765').replace(/\/$/, '');
const paths = arg('paths', '/').split(',').map(s => s.trim()).filter(Boolean);
const out = arg('out');
const modes = arg('modes', 'desktop-dark,desktop-light,mobile-dark,mobile-light').split(',');
const maxStops = parseInt(arg('max', '14'), 10);
if (!out) { console.error('need --out DIR'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });

const VIEW = { desktop: [1440, 900], laptop: [1280, 800], tablet: [820, 1100], mobile: [390, 844], small: [360, 740], wide: [1920, 1080] };
const slug = p => (p.replace(/^\/|\/$/g, '').replace(/[\/?=&#]/g, '_') || 'home');

(async () => {
  const browser = await chromium.launch();
  const report = {};
  for (const mode of modes) {
    const [device, theme] = mode.split('-');
    const [w, h] = VIEW[device] || VIEW.desktop;
    const ctx = await browser.newContext({
      viewport: { width: w, height: h }, deviceScaleFactor: 1,
      colorScheme: theme === 'light' ? 'light' : 'dark',
      isMobile: device === 'mobile' || device === 'small', hasTouch: device === 'mobile' || device === 'small',
    });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme === 'light' ? 'light' : 'dark');
    // Third-party scripts are not part of the design; block them so shots are stable.
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    for (const p of paths) {
      const page = await ctx.newPage();
      const errors = [], failed = [];
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', e => errors.push(String(e)));
      page.on('requestfailed', r => { const u = r.url(); if (!/plausible|hcaptcha|calendly|stripe|onrender/.test(u)) failed.push(u); });
      page.on('response', r => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url()); });
      const key = `${slug(p)}__${mode}`;
      try {
        await page.goto(base + p, { waitUntil: 'load', timeout: 30000 });
      } catch (e) { report[key] = { error: String(e) }; await page.close(); continue; }
      await page.waitForTimeout(900);
      const dims = await page.evaluate(() => ({
        height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
        overflowX: document.documentElement.scrollWidth - window.innerWidth,
      }));
      const step = Math.round(h * 0.9);
      const files = [];
      let n = 0;
      for (let y = 0; y < dims.height - 40 && n < maxStops; y += step) {
        await page.evaluate(yy => window.scrollTo({ top: yy, left: 0, behavior: 'instant' }), y);
        await page.waitForTimeout(550);
        n++;
        const f = path.join(out, `${key}__${String(n).padStart(2, '0')}.png`);
        await page.screenshot({ path: f });
        files.push(f);
      }
      const truncated = n >= maxStops && (n * step) < dims.height - 40;
      report[key] = { ...dims, stops: n, truncated, consoleErrors: errors.filter(e => !/net::ERR|Failed to load resource/.test(e)), failedRequests: [...new Set(failed)] };
      if (device === 'mobile' || device === 'small') {
        // 4 stops per sheet, side by side, so a reviewer reads a phone page in a few images
        try {
          execFileSync('python3', ['-I', '-c', `
import sys
from PIL import Image
files = sys.argv[2:]
prefix = sys.argv[1]
for i in range(0, len(files), 4):
    ims = [Image.open(f) for f in files[i:i+4]]
    gap = 16
    W = sum(im.width for im in ims) + gap * (len(ims) - 1)
    H = max(im.height for im in ims)
    sheet = Image.new('RGB', (W, H), (128, 128, 128))
    x = 0
    for im in ims:
        sheet.paste(im, (x, 0)); x += im.width + gap
    sheet.save(f"{prefix}__sheet{i//4+1}.png")
`, path.join(out, key), ...files]);
          files.forEach(f => fs.unlinkSync(f));
        } catch (e) { report[key].sheetError = String(e); }
      }
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  const rp = path.join(out, 'report.json');
  let prev = {};
  try { prev = JSON.parse(fs.readFileSync(rp, 'utf8')); } catch (e) {}
  fs.writeFileSync(rp, JSON.stringify({ ...prev, ...report }, null, 2));
  const bad = Object.entries(report).filter(([, v]) => v.error || v.overflowX > 0 || (v.consoleErrors || []).length || (v.failedRequests || []).length);
  console.log(`shot ${Object.keys(report).length} page/mode combos into ${out}`);
  for (const [k, v] of bad) console.log('PROBLEM', k, JSON.stringify({ error: v.error, overflowX: v.overflowX, consoleErrors: v.consoleErrors, failedRequests: v.failedRequests }));
  if (!bad.length) console.log('no console errors, failed requests or horizontal overflow');
})();
