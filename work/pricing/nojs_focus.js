const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  // 1. No JavaScript: everything visible
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: false });
    const p = await ctx.newPage();
    await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
    await p.waitForTimeout(300);
    await p.screenshot({ path: `${__dirname}/crops/nojs-${w}.png`, fullPage: true });
    console.log('nojs', w, 'screenshot saved');
    await ctx.close();
  }
  // Without JS we cannot evaluate; re-open with JS but strip the js class to emulate, and measure hidden things
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage();
    await p.route('**/*.js', r => r.abort());
    await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
    const hidden = await p.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('main *')) {
        const cs = getComputedStyle(el);
        if (el.closest('.wide-only, .sr-only, thead, .payplan-std, [aria-hidden="true"]')) continue;
        if ((cs.opacity === '0' || cs.visibility === 'hidden' || cs.display === 'none') && el.textContent.trim()) out.push(el.tagName + '.' + el.className + ' ' + cs.opacity + ' ' + cs.display);
      }
      return { js: document.documentElement.className, hidden: out.slice(0, 20) };
    });
    console.log('scripts blocked:', JSON.stringify(hidden));
    await ctx.close();
  }
  // 2. Keyboard: tab through main, every stop has a visible ring
  for (const w of [390, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    const p = await ctx.newPage();
    await p.goto('http://localhost:8720/pricing/', { waitUntil: 'networkidle' });
    const stops = [];
    for (let i = 0; i < 70; i++) {
      await p.keyboard.press('Tab');
      const s = await p.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        let ring = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2;
        if (!ring) { const sp = el.querySelector('span'); if (sp) { const c2 = getComputedStyle(sp); ring = c2.outlineStyle !== 'none' && parseFloat(c2.outlineWidth) >= 2; } }
        return { where: el.closest('main') ? 'main' : el.closest('footer') ? 'footer' : 'header', text: (el.getAttribute('aria-label') || el.textContent).trim().replace(/\s+/g, ' ').slice(0, 44), ring, color: cs.outlineColor, w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), vh: innerHeight };
      });
      if (!s) break;
      stops.push(s);
      if (s.where === 'footer') break;
    }
    const m = stops.filter(s => s.where === 'main');
    console.log(`\nkeyboard ${w}: ${m.length} stops in main; without ring: ${m.filter(s => !s.ring).length}; off-screen when focused: ${m.filter(s => s.top < 0 || s.top > s.vh).length}`);
    console.log(m.map((s, i) => `${i + 1}. ${s.text} [${s.w}x${s.h}]`).join('\n'));
    if (w === 1440) {
      // picture of a focused table button and a focused toc link
      await p.evaluate(() => document.querySelector('.spec .btn-primary').focus());
      await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab');
      await p.screenshot({ path: `${__dirname}/crops/focus-btn.png` });
      await p.evaluate(() => { scrollTo(0, 0); });
      await p.focus('.toc a'); await p.keyboard.press('Tab'); await p.keyboard.press('Shift+Tab');
      await p.screenshot({ path: `${__dirname}/crops/focus-toc.png` });
    }
    await ctx.close();
  }
  await b.close();
})();
