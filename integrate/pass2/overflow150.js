// Which elements stick out past the window with the root font size at 150% (or 125%)?
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:8720';
const PCT = process.argv[3] || '150';
const PATHS = (process.argv[4] || '/,/services/,/consulting/,/work/,/process/,/pricing/,/faq/,/contact/,/about/,/start/,/web-design-baton-rouge/,/privacy/,/terms/,/checkout/,/checkout/success/,/404.html').split(',');
(async () => {
  const b = await chromium.launch();
  for (const path of PATHS) {
    const line = [];
    for (const w of [320, 360, 390, 600, 820, 1100, 1280, 1440]) {
      const ctx = await b.newContext({ viewport: { width: w, height: 800 }, reducedMotion: 'reduce' });
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
      const p = await ctx.newPage();
      await p.goto(BASE + path, { waitUntil: 'load' });
      await p.addStyleTag({ content: `html{font-size:${PCT}%}` });
      await p.waitForTimeout(200);
      const r = await p.evaluate(() => {
        const cw = document.documentElement.clientWidth, sw = document.documentElement.scrollWidth;
        const out = [];
        if (sw > cw) for (const e of document.querySelectorAll('body *')) {
          const q = e.getBoundingClientRect();
          if (q.width && q.right > cw + 1 && getComputedStyle(e).position !== 'fixed') {
            let hid = false; for (let a = e; a; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.visibility === 'hidden' || cs.display === 'none') hid = true; }
            if (!hid && ![...e.children].some(c => c.getBoundingClientRect().right > cw + 1)) out.push((e.tagName.toLowerCase() + '.' + (e.getAttribute('class') || '')).slice(0, 40) + '→' + Math.round(q.right) + ' "' + (e.textContent || '').trim().slice(0, 24) + '"');
          }
        }
        return { cw, sw, out: out.slice(0, 4) };
      });
      if (r.sw > r.cw) line.push(`${w}: ${r.sw} ${r.out.join(' ; ')}`);
      await ctx.close();
    }
    console.log(path, line.length ? '\n   ' + line.join('\n   ') : 'ok');
  }
  await b.close();
})();
