const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const [url, w, pct, out, css] = process.argv.slice(2);
  const ctx = await b.newContext({ viewport: { width: +w, height: 900 }, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto(url, { waitUntil: 'load' });
  await p.addStyleTag({ content: `html{font-size:${pct}% !important} ${css || ''}` }); await p.waitForTimeout(300);
  console.log(await p.evaluate(() => [...document.querySelectorAll('.browser-bar span, .case-facts a, .ticket-head span')].map(e => { const r = e.getBoundingClientRect(), pr = e.closest('.browser, .case-copy, .ticket').getBoundingClientRect(); return e.textContent.trim().slice(0, 18) + ' ' + Math.round(r.left) + '..' + Math.round(r.right) + ' in ' + Math.round(pr.left) + '..' + Math.round(pr.right); }).join(' | ')));
  await p.screenshot({ path: out, fullPage: true });
  await b.close();
})();
