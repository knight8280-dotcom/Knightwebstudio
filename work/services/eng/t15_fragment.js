const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); console.log('chromium', b.version());
  let html = fs.readFileSync('/home/user/Knightwebstudio/services/index.html', 'utf8');
  // experiment: the anchor id moves from <details> to the body inside it
  for (const id of ['ecommerce', 'brand', 'seo', 'google-reviews', 'redesigns', 'growth-consulting']) html = html.replace(new RegExp(`<details class="faq-item" id="${id}"( open)?>(\\s*<summary>.*?</summary>\\s*)<div class="faq-body">`, 's'), (m, o, s) => `<details class="faq-item"${o || ''}>${s}<div class="faq-body" id="${id}">`);
  html = html.replace('</head>', '<style>[data-page="services"] .faq-body { scroll-margin-top: calc(var(--header-h) + var(--s-5) + var(--btn-h-lg) + var(--s-4)); }</style></head>');
  for (const w of [390, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 844 } });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    await ctx.route('**/services/', r => r.fulfill({ contentType: 'text/html', body: html }));
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(400);
    for (const id of ['ecommerce', 'seo', 'google-reviews']) {
      await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      await p.evaluate(i => document.querySelector(`.menu a[href="#${i}"]`).click(), id); await p.waitForTimeout(1300);
      console.log(w, '#' + id, await p.evaluate(i => { const t = document.getElementById(i); const d = t.closest('details'); const s = d.querySelector('summary').getBoundingClientRect(); return { open: d.open, summaryTop: Math.round(s.top), headerBottom: Math.round(document.getElementById('site-header').getBoundingClientRect().bottom), bodyTop: Math.round(t.getBoundingClientRect().top) }; }, id));
    }
    await p.goto('http://localhost:8720/services/#brand'); await p.waitForTimeout(1200);
    console.log(w, 'deep link #brand', await p.evaluate(() => { const t = document.getElementById('brand'); const d = t.closest('details'); return { open: d.open, summaryTop: Math.round(d.querySelector('summary').getBoundingClientRect().top) }; }));
    await ctx.close();
  }
  await b.close();
})();
