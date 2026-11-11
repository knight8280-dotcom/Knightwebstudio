// Dump visible text of each page at 390x844, in visual order, with y positions of headings.
const { chromium } = require('playwright');
const fs = require('fs');
const base = process.argv[2] || 'http://localhost:8720';
const outDir = process.argv[3];
const pages = (process.argv[4] || '/start/,/,/pricing/,/consulting/,/work/,/about/,/contact/').split(',');
const W = parseInt(process.argv[5] || '390', 10), H = parseInt(process.argv[6] || '844', 10);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: W, height: H }, isMobile: W < 700, hasTouch: W < 700, colorScheme: 'light' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  for (const p of pages) {
    const page = await ctx.newPage();
    await page.goto(base + p, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    const res = await page.evaluate(() => {
      const out = [];
      const total = document.documentElement.scrollHeight;
      const vis = el => { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      const sel = 'h1,h2,h3,h4,p,li,a.btn,button,summary,figcaption,th,td,dt,dd,label,legend,.eyebrow,.stamp,.pl-row,.tag,.pill,caption,small,.fine';
      const seen = new Set();
      document.querySelectorAll(sel).forEach(el => {
        if (!vis(el)) return;
        // skip when an ancestor matched and is a leaf-ish container (avoid duplicates): only keep elements with no matching descendants, except headings
        if (el.querySelector(sel) && !/^H\d$/.test(el.tagName)) return;
        let a = el.closest('svg'); if (a) return;
        const t = (el.innerText || '').replace(/\s+/g, ' ').trim();
        if (!t) return;
        const r = el.getBoundingClientRect();
        const y = Math.round(r.top + scrollY);
        const key = y + '|' + t; if (seen.has(key)) return; seen.add(key);
        const where = el.closest('header') ? 'HDR' : el.closest('footer') ? 'FTR' : el.closest('#mobile-cta') ? 'BAR' : '';
        out.push({ y, tag: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(/\s+/).slice(0, 2).join('.') : ''), t, where, fs: Math.round(parseFloat(getComputedStyle(el).fontSize)) });
      });
      out.sort((a, b) => a.y - b.y);
      return { total, out };
    });
    const slug = (p.replace(/^\/|\/$/g, '').replace(/\//g, '_') || 'home');
    const lines = [`# ${p}  width ${W}  total height ${res.total}px  (${(res.total / H).toFixed(1)} screens)`];
    for (const o of res.out) lines.push(`${String(o.y).padStart(6)}  s${(o.y / H).toFixed(1).padStart(4)}  ${o.where.padEnd(3)} ${o.fs}px ${o.tag.padEnd(22)} ${o.t}`);
    fs.writeFileSync(`${outDir}/${slug}__${W}.txt`, lines.join('\n') + '\n');
    await page.close();
  }
  await b.close();
})();
