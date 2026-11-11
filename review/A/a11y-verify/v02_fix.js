// A11Y-02: does the reviewer's fix break anything? In particular the phone menu, once the header is position: static.
const { chromium } = require('playwright');
const BASE = 'http://localhost:8720';
const BLOCK = /plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com|web3forms\.com/;
const FIXES = {
  none: '',
  reviewer: '@media (max-height: 480px) { .site-header { position: static; } .mobile-cta, .mobile-cta.show { display: none; } html { scroll-padding: var(--s-5) 0; } }',
  relative: '@media (max-height: 480px) { .site-header { position: relative; } .mobile-cta, .mobile-cta.show { display: none; } html { scroll-padding: var(--s-5) 0; } }',
};
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[844, 390], [320, 256], [341, 162]]) {
    for (const [name, css] of Object.entries(FIXES)) {
      const ctx = await b.newContext({ viewport: { width: w, height: h } });
      await ctx.route(BLOCK, r => r.abort());
      const p = await ctx.newPage();
      await p.goto(BASE + '/pricing/', { waitUntil: 'load' });
      if (css) await p.addStyleTag({ content: css });
      // 1. menu at top of page
      const res = {};
      for (const y of [0, 1500]) {
        await p.evaluate(yy => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, yy); }, y);
        await p.waitForTimeout(400);
        const tg = await p.evaluate(() => { const r = document.getElementById('nav-toggle').getBoundingClientRect(); return { top: r.top, bottom: r.bottom, inView: r.bottom > 0 && r.top < innerHeight }; });
        if (!tg.inView) { res['y' + y] = 'menu button not on screen (header scrolled away)'; continue; }
        await p.click('#nav-toggle'); await p.waitForTimeout(500);
        const st = await p.evaluate(() => {
          const links = [...document.querySelectorAll('#nav .nav-links a')];
          let hit = 0, onscreen = 0;
          for (const a of links) { const r = a.getBoundingClientRect(); const x = r.left + 30, y = r.top + r.height / 2; if (y < 0 || y > innerHeight) continue; onscreen++; const e = document.elementFromPoint(x, y); if (e && (e === a || a.contains(e))) hit++; }
          const nav = document.getElementById('nav'); const cs = getComputedStyle(nav);
          return { open: nav.classList.contains('open'), links: links.length, onscreen, hit, navVis: cs.visibility, navOp: cs.opacity, scrollY, top: document.elementFromPoint(innerWidth / 2, innerHeight - 20)?.className };
        });
        res['y' + y] = st;
        await p.screenshot({ path: `shots/v02fix_${name}_${w}x${h}_y${y}_menu.png` });
        await p.keyboard.press('Escape'); await p.waitForTimeout(400);
      }
      console.log(`${w}x${h} fix=${name}:`, JSON.stringify(res));
      await ctx.close();
    }
  }
  await b.close();
})();
