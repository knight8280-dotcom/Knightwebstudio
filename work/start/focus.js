// Focus-ring close-ups: tab to each named element and screenshot around it.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h, theme] of [[390, 844, 'light'], [1440, 900, 'dark']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: theme, reducedMotion: 'reduce' });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/start/', { waitUntil: 'load' }); await p.waitForTimeout(500);
    const want = ['.price-strip', '.menu .more-link', '.tier', '.board-foot p a', '.print', '.write a', '.cta-band .btn + .btn'];
    let i = 0;
    for (const sel of want) {
      await p.evaluate((sel) => { const e = document.querySelector(sel); e.scrollIntoView({ block: 'center' }); }, sel);
      await p.waitForTimeout(250);
      // focus through the keyboard so :focus-visible applies
      await p.evaluate((sel) => { const e = document.querySelector(sel); const all = [...document.querySelectorAll('a, button')].filter(x => x.offsetParent); const k = all.indexOf(e); (all[k - 1] || document.body).focus(); }, sel);
      await p.keyboard.press('Tab'); await p.waitForTimeout(200);
      const box = await p.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, t: document.activeElement.textContent.trim().slice(0, 30) }; });
      const pad = 28; const clip = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: Math.min(w - Math.max(0, box.x - pad), box.w + 2 * pad), height: Math.min(h - Math.max(0, box.y - pad), box.h + 2 * pad) };
      await p.screenshot({ path: `${__dirname}/focus-${w}-${i++}.png`, clip });
      console.log(w, sel, '->', box.t, Math.round(box.w) + 'x' + Math.round(box.h));
    }
    await ctx.close();
  }
  await b.close();
})();
