const { chromium } = require('playwright');
(async () => {
  const css = `
  [data-page="contact"] .talk { display: grid; }
  @media (min-width: 980px) {
    [data-page="contact"] .split { grid-template-rows: auto 1fr; row-gap: var(--s-6); }
    [data-page="contact"] .talk { grid-column: 2; grid-row: 1; align-self: start; }
    [data-page="contact"] form { grid-column: 1; grid-row: 1 / 3; }
    [data-page="contact"] .contact-side { grid-column: 2; grid-row: 2; position: static; }
  }`;
  const b = await chromium.launch();
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 700 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
    const p = await ctx.newPage();
    await p.goto('http://localhost:8720/contact/', { waitUntil: 'load' });
    await p.addStyleTag({ content: css });
    await p.waitForTimeout(500);
    await p.screenshot({ path: `look/try-card-${w}.png`, fullPage: w > 700 });
    console.log(w, await p.evaluate(() => document.documentElement.scrollHeight));
    await ctx.close();
  }
  await b.close();
})();
