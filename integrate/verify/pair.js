// pair.js: screenshot the same element in the frozen copy (A) and the repository (B) and stitch them.
// node pair.js name path width theme selector [index] [pad]   (several jobs: separate with ::)
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const V = __dirname;
const jobs = process.argv.slice(2).join(' ').split('::').map(s => s.trim().split(/\s+/));
(async () => {
  const browser = await chromium.launch();
  for (const [name, p, w, theme, sel, idx = '0', pad = '12'] of jobs) {
    const files = [];
    for (const [tag, base] of [['a', 'http://localhost:8722'], ['b', 'http://localhost:8720']]) {
      const ctx = await browser.newContext({ viewport: { width: +w, height: +w < 700 ? 844 : 900 }, deviceScaleFactor: 1, colorScheme: theme, reducedMotion: 'reduce' });
      await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
      const page = await ctx.newPage();
      await page.goto(base + p, { waitUntil: 'load' });
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => { i.loading = 'eager'; return i.decode().catch(() => {}); })); });
      await page.waitForTimeout(300);
      const selector = sel.replace(/~/g, ' ');
      const box = await page.evaluate(([s, i]) => { const e = document.querySelectorAll(s)[i]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; }, [selector, +idx]);
      const f = `${V}/crops/${name}__${tag}.png`;
      if (!box) { console.log('no match', tag, selector); await ctx.close(); continue; }
      const full = await page.evaluate(() => ({ W: document.documentElement.scrollWidth, H: document.documentElement.scrollHeight }));
      const P = +pad; const clip = { x: Math.max(0, box.x - P), y: Math.max(0, box.y - P), width: Math.min(full.W, box.w + 2 * P), height: Math.min(box.h + 2 * P, 2600) };
      clip.width = Math.min(clip.width, full.W - clip.x); clip.height = Math.min(clip.height, full.H - clip.y);
      await page.screenshot({ path: f, fullPage: true, clip });
      files.push(f); await ctx.close();
    }
    if (files.length === 2) {
      execFileSync('python3', ['-I', '-c', `
import sys
from PIL import Image
a, b, o = sys.argv[1:4]
A, B = Image.open(a), Image.open(b)
if max(A.width, B.width) <= 620:
    S = Image.new('RGB', (A.width + B.width + 12, max(A.height, B.height)), (255, 0, 255)); S.paste(A, (0, 0)); S.paste(B, (A.width + 12, 0))
else:
    S = Image.new('RGB', (max(A.width, B.width), A.height + B.height + 12), (255, 0, 255)); S.paste(A, (0, 0)); S.paste(B, (0, A.height + 12))
S.save(o); print(o, S.size)
`, files[0], files[1], `${V}/crops/${name}.png`], { stdio: 'inherit' });
      files.forEach(f => fs.unlinkSync(f));
    }
  }
  await browser.close();
})();
