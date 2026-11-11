// Positions of the answers Dale is looking for, at 390x844 and 1280x800 (y in px from the top of the page, and as a share of page height).
const { chromium } = require('playwright');
const probes = {
  '/': [['who: "I\'m Christian Knight"', 'Christian Knight, the founder'], ['own: "You own everything" (facts shelf)', 'You own everything'], ['care row on board', 'Care plans, to keep a site running'], ['process heading', 'Four steps, no surprises'], ['price strip', 'Four fixed packages']],
  '/start/': [['who (eyebrow)', 'Christian Knight, Baton Rouge'], ['own (lede)', 'you own everything'], ['first plain description of the "systems"', 'Missed calls texted back'], ['"Automations that run while you work"', 'Automations that run while you work']],
  '/consulting/': [['lede promise', 'the first check is free'], ['hero CTA', 'Book a Growth Audit, $350'], ['first "Ask for the free check" action', 'Ask for the free check'], ['what a Growth Audit is', 'A 60-minute session, in person'], ['cancel line', 'No long-term contract']],
  '/pricing/': [['care heading', 'Care plans'], ['care intro', 'quietly rots'], ['first Start plan (checkout)', 'Start plan'], ['cancel line', 'No long-term contract or minimum term']],
};
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[390, 844], [1280, 800]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: w < 700, colorScheme: 'light' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    for (const [p, list] of Object.entries(probes)) {
      const page = await ctx.newPage();
      await page.goto('http://localhost:8720' + p, { waitUntil: 'load' }); await page.waitForTimeout(400);
      const res = await page.evaluate(list => {
        const H = document.documentElement.scrollHeight;
        const main = document.querySelector('main');
        return { H, rows: list.map(([name, needle]) => {
          const w = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
          let n; while ((n = w.nextNode())) {
            if (n.textContent.replace(/\s+/g, ' ').includes(needle)) {
              const el = n.parentElement; const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
              if (r.width === 0 || cs.display === 'none') continue;
              if (needle === 'Care plans' && el.tagName !== 'H2') continue;
              return { name, y: Math.round(r.top + scrollY), tag: el.tagName.toLowerCase(), fs: Math.round(parseFloat(cs.fontSize)) };
            }
          }
          return { name, y: null };
        }) };
      }, list);
      console.log(`\n${p} @${w}x${h}  page height ${res.H}px = ${(res.H / h).toFixed(1)} screens`);
      for (const r of res.rows) console.log(`  ${String(r.y).padStart(6)}px  screen ${r.y == null ? '-' : (r.y / h + 1).toFixed(1).padStart(4)}  ${r.y == null ? '' : Math.round(100 * r.y / res.H) + '% down'}  ${r.tag || ''} ${r.fs || ''}px  ${r.name}`);
      await page.close();
    }
    await ctx.close();
  }
  await b.close();
})();
