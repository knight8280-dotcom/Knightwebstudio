#!/usr/bin/env node
/* Pixel comparison of two copies of the site (for example before and after a refactor).

   node compare.js --a http://localhost:8722 --b http://localhost:8720 --out DIR
                   [--paths /,/pricing/] [--widths 390,1440] [--themes light,dark]

   For every path, width and theme it takes a full-page screenshot of both copies with
   motion reduced (so reveal effects are in their final state) and third-party scripts
   blocked, then counts differing pixels. It writes DIR/report.json and, for every pair
   that differs, DIR/<page>__<width>__<theme>__diff.png (A | B | differences in red).
   Exit code 0 always: read the report. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const A = (arg('a') || '').replace(/\/$/, ''), B = (arg('b') || '').replace(/\/$/, '');
const out = arg('out');
const ALL = '/,/services/,/consulting/,/work/,/process/,/pricing/,/faq/,/contact/,/about/,/start/,/web-design-baton-rouge/,/web-design-denham-springs/,/web-design-gonzales/,/web-design-prairieville/,/privacy/,/terms/,/checkout/,/checkout/success/,/404.html';
const paths = arg('paths', ALL).split(',').map(s => s.trim()).filter(Boolean);
const widths = arg('widths', '390,1440').split(',').map(Number);
const themes = arg('themes', 'light,dark').split(',');
if (!A || !B || !out) { console.error('need --a URL --b URL --out DIR'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });
const slug = p => (p.replace(/^\/|\/$/g, '').replace(/[\/?=&#]/g, '_') || 'home');

(async () => {
  const browser = await chromium.launch();
  const report = {};
  for (const theme of themes) for (const w of widths) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 700 ? 844 : 900 }, deviceScaleFactor: 1, colorScheme: theme, reducedMotion: 'reduce' });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    for (const p of paths) {
      const key = `${slug(p)}__${w}__${theme}`;
      const files = [];
      for (const [name, base] of [['a', A], ['b', B]]) {
        const page = await ctx.newPage();
        try {
          await page.goto(base + p, { waitUntil: 'load', timeout: 30000 });
          await page.evaluate(() => document.fonts && document.fonts.ready);
          await page.waitForTimeout(500);
          const f = path.join(out, `${key}__${name}.png`);
          await page.screenshot({ path: f, fullPage: true });
          files.push(f);
        } catch (e) { report[key] = { error: String(e) }; }
        await page.close();
      }
      if (files.length < 2) continue;
      try {
        const res = execFileSync('python3', ['-I', '-c', `
import sys, json
from PIL import Image, ImageChops
a, b, diffp = sys.argv[1:4]
A, B = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
W, H = max(A.width, B.width), max(A.height, B.height)
ca, cb = Image.new('RGB', (W, H), (255, 0, 255)), Image.new('RGB', (W, H), (255, 0, 255))
ca.paste(A, (0, 0)); cb.paste(B, (0, 0))
d = ImageChops.difference(ca, cb).convert('L').point(lambda v: 255 if v > 8 else 0)
n = d.histogram()[255]
box = d.getbbox()
if n:
    red = Image.new('RGB', (W, H), (255, 255, 255)); red.paste((220, 30, 30), mask=d)
    sheet = Image.new('RGB', (W * 3 + 32, H), (128, 128, 128))
    sheet.paste(ca, (0, 0)); sheet.paste(cb, (W + 16, 0)); sheet.paste(red, (2 * W + 32, 0))
    if H > 12000: sheet = sheet.crop((0, 0, sheet.width, 12000))
    sheet.save(diffp)
print(json.dumps({'heightA': A.height, 'heightB': B.height, 'differingPixels': n, 'percent': round(100.0 * n / (W * H), 4), 'bbox': box}))
`, files[0], files[1], path.join(out, `${key}__diff.png`)]).toString();
        report[key] = JSON.parse(res);
      } catch (e) { report[key] = { error: String(e).slice(0, 400) }; }
      files.forEach(f => { try { fs.unlinkSync(f); } catch (e) {} });
    }
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  const diff = Object.entries(report).filter(([, v]) => v.error || v.differingPixels > 0);
  console.log(`compared ${Object.keys(report).length} page/width/theme combinations; ${diff.length} differ`);
  for (const [k, v] of diff) console.log('DIFF', k, JSON.stringify(v));
})();
