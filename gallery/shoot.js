#!/usr/bin/env node
/* Screenshot the gallery: node gallery/shoot.js [--modes desktop-light,desktop-dark,mobile-light,mobile-dark] [--base http://localhost:8721]
   Takes one full-page capture per mode and cuts it into sheets in gallery/shots/:
     desktop: 1440 wide, one slice of about 1500px per file
     mobile:  four 390px-wide strips side by side per file
   Also prints horizontal overflow and console errors. */
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path'); const { execFileSync } = require('child_process');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const base = arg('base', 'http://localhost:8721'); const out = arg('out', path.join(__dirname, 'shots'));
const modes = arg('modes', 'desktop-light,desktop-dark,mobile-light,mobile-dark').split(',');
const VIEW = { desktop: [1440, 900], mobile: [390, 844], small: [360, 740], tablet: [820, 1100], laptop: [1280, 800] };
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch();
  for (const mode of modes) {
    const [device, theme] = mode.split('-'); const [w, h] = VIEW[device];
    const phone = device === 'mobile' || device === 'small';
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: theme, isMobile: phone, hasTouch: phone, reducedMotion: 'reduce' });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); const errors = [];
    p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|Failed to load/.test(m.text())) errors.push(m.text()); });
    p.on('pageerror', e => errors.push(String(e)));
    await p.goto(base + '/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
    // walk the page once so lazy images load and reveals have run, then go back to the top
    await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight) { scrollTo(0, y); await new Promise(r => setTimeout(r, 90)); } scrollTo(0, 0); });
    await p.waitForLoadState('networkidle').catch(() => {}); await p.waitForTimeout(500);
    const dims = await p.evaluate(() => ({ h: document.documentElement.scrollHeight, over: document.documentElement.scrollWidth - innerWidth }));
    const full = path.join(out, `_${mode}.png`);
    await p.screenshot({ path: full, fullPage: true });
    for (const f of fs.readdirSync(out)) if (f.startsWith(mode + '__')) fs.unlinkSync(path.join(out, f));
    execFileSync('python3', ['-I', '-c', `
import sys
from PIL import Image
im = Image.open(sys.argv[1]); out, mode, phone = sys.argv[2], sys.argv[3], sys.argv[4] == '1'
W, H = im.size
if phone:
    step, per = 1700, 4
    strips = [im.crop((0, y, W, min(y + step, H))) for y in range(0, H, step)]
    for i in range(0, len(strips), per):
        group = strips[i:i + per]; gap = 14
        sheet = Image.new('RGB', (W * len(group) + gap * (len(group) - 1), step), (128, 128, 128))
        for j, s in enumerate(group): sheet.paste(s, (j * (W + gap), 0))
        sheet.save(f"{out}/{mode}__sheet{i // per + 1:02d}.png")
else:
    step = 1500
    for i, y in enumerate(range(0, H, step)):
        im.crop((0, y, W, min(y + step, H))).save(f"{out}/{mode}__{i + 1:02d}.png")
`, full, out, mode, phone ? '1' : '0']);
    fs.unlinkSync(full);
    console.log(mode, 'height', dims.h, 'overflowX', dims.over, errors.length ? 'ERRORS ' + JSON.stringify(errors) : 'no errors');
    await ctx.close();
  }
  await b.close();
})();
