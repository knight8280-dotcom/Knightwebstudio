// A11Y-02: how much of a short window do the sticky header and phone bar take, and is a focused control hidden?
const { chromium } = require('playwright');
const BASE = 'http://localhost:8720';
const BLOCK = /plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com|web3forms\.com/;
const SIZES = [[320,256],[341,162],[320,170],[844,390],[844,340],[667,375],[390,844]];
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of SIZES) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.route(BLOCK, r => r.abort());
    const p = await ctx.newPage();
    await p.goto(BASE + '/pricing/', { waitUntil: 'load' });
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 2500); });
    await p.waitForTimeout(700);
    const m = await p.evaluate(() => {
      const hd = document.getElementById('site-header').getBoundingClientRect();
      const bar = document.getElementById('mobile-cta');
      const br = bar.getBoundingClientRect();
      const cs = getComputedStyle(bar);
      const sp = getComputedStyle(document.documentElement);
      return { headerTop: hd.top, headerBottom: hd.bottom, barShown: bar.classList.contains('show'), barTop: br.top, barH: br.height, barVis: cs.visibility, barOp: cs.opacity, barTransform: cs.transform, spTop: sp.scrollPaddingTop, spBottom: sp.scrollPaddingBottom, vh: innerHeight };
    });
    const free = (m.barShown ? m.barTop : m.vh) - m.headerBottom;
    console.log(`${w}x${h}: header ${Math.round(m.headerBottom - m.headerTop)}px (bottom ${Math.round(m.headerBottom)}), bar shown=${m.barShown} top=${Math.round(m.barTop)} h=${Math.round(m.barH)}; free ${Math.round(free)}px = ${Math.round(free / m.vh * 100)}%; scroll-padding ${m.spTop}/${m.spBottom}`);
    if (['320x256','341x162','844x390'].includes(w + 'x' + h)) await p.screenshot({ path: `shots/v02_${w}x${h}_pricing.png` });
    // Keyboard: tab forward 40 times from here and record how much of each focused control is clear of header and bar
    let hiddenAll = 0, partly = 0, n = 0; const worst = [];
    await p.evaluate(() => { const el = document.querySelector('main a, main button'); el && el.focus(); });
    for (let i = 0; i < 45; i++) {
      await p.keyboard.press('Tab'); await p.waitForTimeout(60);
      const r = await p.evaluate(() => {
        const el = document.activeElement; if (!el || el === document.body) return null;
        if (el.closest('.site-header, .mobile-cta, .topbar, .site-footer')) return { skip: true };
        const r = el.getBoundingClientRect();
        const hd = document.getElementById('site-header').getBoundingClientRect().bottom;
        const bar = document.getElementById('mobile-cta'); const shown = bar.classList.contains('show') && getComputedStyle(bar).visibility !== 'hidden';
        const bt = shown ? bar.getBoundingClientRect().top : innerHeight;
        const visTop = Math.max(r.top, hd), visBot = Math.min(r.bottom, bt);
        const vis = Math.max(0, visBot - visTop);
        return { name: (el.innerText || el.getAttribute('aria-label') || el.id || el.tagName).trim().slice(0, 40), top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), vis: Math.round(vis), hd: Math.round(hd), bt: Math.round(bt) };
      });
      if (!r || r.skip) continue; n++;
      if (r.vis <= 0) { hiddenAll++; worst.push(r); } else if (r.vis < r.h - 1) { partly++; if (worst.length < 4) worst.push(r); }
    }
    console.log(`   focus walk: ${n} controls in main; entirely hidden ${hiddenAll}; partly covered ${partly}`);
    worst.slice(0, 5).forEach(x => console.log('     ', JSON.stringify(x)));
    await ctx.close();
  }
  await b.close();
})();
