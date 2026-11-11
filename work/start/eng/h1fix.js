const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/plausible|calendly/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/start/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
  // simulated fallbacks: Fraunces itself scaled narrower / wider
  await p.addStyleTag({ content: [88, 92, 96, 98, 100, 104].map(s => `@font-face{font-family:"Sim${s}";src:url("/assets/fonts/fraunces-soft.woff2") format("woff2");font-weight:100 900;size-adjust:${s}%}`).join('') });
  const variants = {
    current: null,
    'four forced lines (<br> under 600px)': 'A website and<br> the systems<br> that bring<br> in <span class="mark">customers</span>',
    'three block lines, "bring customers"': '<span class="l" style="display:block">A website and</span> <span class="l" style="display:block">the systems that</span> <span class="l" style="display:block">bring <span class="mark">customers</span></span>',
    'three block lines, "win customers"': '<span class="l" style="display:block">A website and</span> <span class="l" style="display:block">the systems that</span> <span class="l" style="display:block">win <span class="mark">customers</span></span>',
  };
  const orig = await p.$eval('h1', h => h.innerHTML);
  for (const [name, html] of Object.entries(variants)) {
    await p.$eval('h1', (h, a) => { h.innerHTML = a[0] || a[1]; }, [html, orig]);
    const rows = [];
    for (const w of [360, 375, 390, 412, 430]) {
      await p.setViewportSize({ width: w, height: 844 });
      const cells = [];
      for (const s of [88, 92, 96, 98, 100, 104]) {
        await p.$eval('h1', (h, s) => { h.style.fontFamily = `"Sim${s}", serif`; }, s); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(60);
        const r = await p.evaluate(() => { const h = document.querySelector('h1'); const lh = parseFloat(getComputedStyle(h).lineHeight); return { lines: Math.round(h.getBoundingClientRect().height / lh), strip: Math.round(document.querySelector('.price-strip-nums').getBoundingClientRect().bottom), over: h.scrollWidth > h.clientWidth + 1 }; });
        cells.push(`${s}%:${r.lines}L${r.over ? '!' : ''}`);
        if (s === 100) cells.push(`[nums end ${r.strip}]`);
      }
      rows.push(`  ${w}: ` + cells.join(' '));
    }
    console.log(name); rows.forEach(r => console.log(r));
  }
  await b.close();
})();
